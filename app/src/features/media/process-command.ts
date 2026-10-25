import { spawn } from "node:child_process";
import { JOB_POLICY, PROCESS_FAILURE } from "@/config/jobs";
import { MediaProcessError } from "./process-errors";

const activeChildren = new Set<() => void>();

export function stopMediaProcesses() {
	for (const interrupt of activeChildren) {
		interrupt();
	}
}

export function processCommand(
	command: string,
	args: readonly string[],
	timeoutMilliseconds: number,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, [...args], {
			shell: false,
			stdio: ["ignore", "pipe", "pipe"],
		});
		const output: Buffer[] = [],
			errors: Buffer[] = [];
		let bytes = 0,
			failure: MediaProcessError | undefined;
		const terminate = (reason: MediaProcessError) => {
			failure ??= reason;
			child.kill("SIGKILL");
		};
		const interrupt = () =>
			terminate(
				new MediaProcessError(
					PROCESS_FAILURE.interrupted,
					"Media processing interrupted",
				),
			);
		activeChildren.add(interrupt);
		const timeout = setTimeout(
			() =>
				terminate(
					new MediaProcessError(
						PROCESS_FAILURE.timeout,
						"Media processing timed out",
					),
				),
			timeoutMilliseconds,
		);
		function collect(target: Buffer[], chunk: Buffer) {
			bytes += chunk.length;
			if (bytes > JOB_POLICY.maximumProcessOutputBytes) {
				terminate(
					new MediaProcessError(
						PROCESS_FAILURE.output,
						"Process output limit exceeded",
					),
				);
				return;
			}
			target.push(chunk);
		}
		child.stdout.on("data", (chunk: Buffer) => collect(output, chunk));
		child.stderr.on("data", (chunk: Buffer) => collect(errors, chunk));
		child.once("error", () => {
			failure ??= new MediaProcessError(
				PROCESS_FAILURE.spawn,
				"Unable to start media processor",
			);
		});
		child.once("close", (code, signal) => {
			activeChildren.delete(interrupt);
			clearTimeout(timeout);
			// Reject only after close: cleanup cannot race with a still-writing FFmpeg.
			if (failure) {
				reject(failure);
				return;
			}
			if (signal) {
				reject(
					new MediaProcessError(
						PROCESS_FAILURE.interrupted,
						"Media processor was terminated",
					),
				);
				return;
			}
			if (code !== 0) {
				const tail = Buffer.concat(errors)
					.toString("utf8")
					.slice(-JOB_POLICY.errorOutputTailLength);
				reject(
					new MediaProcessError(
						PROCESS_FAILURE.failed,
						`${command} exited with ${code}: ${tail}`,
					),
				);
				return;
			}
			resolve(Buffer.concat(output).toString("utf8"));
		});
	});
}

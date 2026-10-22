import { spawn } from "node:child_process";

const MAX_PROCESS_OUTPUT_BYTES = 1_048_576;
const ERROR_OUTPUT_TAIL_LENGTH = 1000;
const activeChildren = new Set<ReturnType<typeof spawn>>();

export function stopMediaProcesses() {
	for (const child of activeChildren) {
		child.kill("SIGKILL");
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
		const output: Buffer[] = [];
		activeChildren.add(child);
		const errors: Buffer[] = [];
		let bytes = 0;
		const timeout = setTimeout(() => {
			child.kill("SIGKILL");
			reject(new Error("Media processing timed out"));
		}, timeoutMilliseconds);
		function collect(target: Buffer[], chunk: Buffer) {
			bytes += chunk.length;
			if (bytes > MAX_PROCESS_OUTPUT_BYTES) {
				child.kill("SIGKILL");
				reject(new Error("Process output limit exceeded"));
			} else {
				target.push(chunk);
			}
		}
		child.stdout.on("data", (chunk) => collect(output, chunk));
		child.stderr.on("data", (chunk) => collect(errors, chunk));
		child.once("error", (error) => {
			activeChildren.delete(child);
			clearTimeout(timeout);
			reject(error);
		});
		child.once("close", (code) => {
			activeChildren.delete(child);
			clearTimeout(timeout);
			if (code !== 0) {
				reject(
					new Error(
						`${command} exited with ${code}: ${Buffer.concat(errors).toString("utf8").slice(-ERROR_OUTPUT_TAIL_LENGTH)}`,
					),
				);
			} else {
				resolve(Buffer.concat(output).toString("utf8"));
			}
		});
	});
}

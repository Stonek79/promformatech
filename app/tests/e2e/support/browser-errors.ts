import type { ConsoleMessage, Page, TestInfo } from "@playwright/test";

const SERVER_ERROR_STATUS = 500;
const CONSOLE_ERROR_LEVEL = "error";

export type BrowserDiagnostics = {
	readonly errors: string[];
	readonly consoleErrors: Promise<ConsoleErrorDetails>[];
};

type ConsoleErrorDetails = {
	readonly message: string;
	readonly location: ReturnType<ConsoleMessage["location"]>;
	readonly stacks: readonly string[];
};

async function readConsoleError(
	message: ConsoleMessage,
): Promise<ConsoleErrorDetails> {
	const stacks = await Promise.all(
		message.args().map(async (argument) => {
			try {
				return await argument.evaluate((value: unknown) =>
					value instanceof Error ? value.stack : undefined,
				);
			} catch {
				// Navigation may destroy the originating JavaScript context.
				return undefined;
			}
		}),
	);
	return {
		message: message.text(),
		location: message.location(),
		stacks: stacks.filter(
			(stack): stack is string => typeof stack === "string",
		),
	};
}

export function observeBrowserErrors(
	page: Page,
	diagnostics: BrowserDiagnostics,
) {
	page.on("pageerror", (error) => {
		diagnostics.errors.push(error.stack ?? error.message);
	});
	page.on("console", (message) => {
		if (message.type() === CONSOLE_ERROR_LEVEL) {
			diagnostics.errors.push(message.text());
			diagnostics.consoleErrors.push(readConsoleError(message));
		}
	});
	page.on("response", (response) => {
		if (response.status() >= SERVER_ERROR_STATUS) {
			diagnostics.errors.push(
				`${response.status()} ${new URL(response.url()).pathname}`,
			);
		}
	});
}

export async function attachBrowserErrors(
	diagnostics: BrowserDiagnostics,
	testInfo: TestInfo,
) {
	if (diagnostics.errors.length === 0) {
		return;
	}
	await testInfo.attach("browser-errors", {
		body: JSON.stringify(
			{
				errors: diagnostics.errors,
				console: await Promise.all(diagnostics.consoleErrors),
			},
			null,
			"\t",
		),
		contentType: "application/json",
	});
}

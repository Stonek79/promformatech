import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import type { EmailAdapter } from "payload";
import { SMTP_PORTS } from "@/config/email";

export function smtpConfigured() {
	return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

export async function emailAdapter(): Promise<EmailAdapter> {
	if (!smtpConfigured()) {
		return () => ({
			name: "unconfigured",
			defaultFromAddress: "noreply@localhost",
			defaultFromName: "ПромФормаТех",
			sendEmail: async () => {
				throw new Error("SMTP не настроен. Обратитесь к владельцу сайта.");
			},
		});
	}
	const port = Number(process.env.SMTP_PORT || SMTP_PORTS.startTLS);
	if (!Number.isInteger(port) || port <= 0) {
		throw new Error("Некорректный SMTP_PORT");
	}
	return nodemailerAdapter({
		defaultFromAddress: process.env.SMTP_FROM || "",
		defaultFromName: process.env.SMTP_FROM_NAME || "ПромФормаТех",
		skipVerify: true,
		transportOptions: {
			host: process.env.SMTP_HOST,
			port,
			secure: port === SMTP_PORTS.implicitTLS,
			auth: process.env.SMTP_USER
				? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
				: undefined,
		},
	});
}

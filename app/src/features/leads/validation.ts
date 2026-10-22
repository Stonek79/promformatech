import { FORM_LIMITS } from "@/config/forms";

export type Inquiry = {
	readonly requestID: string;
	readonly name: string;
	readonly contact: string;
	readonly message: string;
	readonly sourcePath: string;
	readonly consent: true;
};

export class InquiryValidationError extends Error {
	constructor(
		readonly field: "name" | "contact" | "message" | "consent" | "form",
	) {
		super("Invalid inquiry");
	}
}

export function parseInquiry(value: unknown): Inquiry {
	if (!value || typeof value !== "object") {
		throw new InquiryValidationError("form");
	}
	const input = value as Record<string, unknown>;
	const string = (name: string) =>
		typeof input[name] === "string" ? input[name].trim() : "";
	const name = string("name"),
		contact = string("contact"),
		message = string("message");
	if (
		name.length < FORM_LIMITS.minimumNameLength ||
		name.length > FORM_LIMITS.name
	) {
		throw new InquiryValidationError("name");
	}
	const phoneDigits = contact.replace(/[^\d]/g, "");
	const validContact =
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ||
		(/^[+\d\s()-]+$/.test(contact) &&
			phoneDigits.length >= FORM_LIMITS.minimumPhoneDigits &&
			phoneDigits.length <= FORM_LIMITS.maximumPhoneDigits);
	if (!validContact || contact.length > FORM_LIMITS.contact) {
		throw new InquiryValidationError("contact");
	}
	if (message.length > FORM_LIMITS.message) {
		throw new InquiryValidationError("message");
	}
	if (input.consent !== true) {
		throw new InquiryValidationError("consent");
	}
	if (
		string("website") ||
		!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(string("requestID"))
	) {
		throw new InquiryValidationError("form");
	}
	const sourcePath = string("sourcePath");
	if (
		!sourcePath.startsWith("/") ||
		sourcePath.startsWith("//") ||
		sourcePath.length > FORM_LIMITS.contact
	) {
		throw new InquiryValidationError("form");
	}
	return {
		requestID: string("requestID"),
		name,
		contact,
		message,
		sourcePath,
		consent: true,
	};
}

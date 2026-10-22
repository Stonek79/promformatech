"use client";

import { usePathname } from "next/navigation";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import {
	Field,
	fieldDescription,
	Input,
	Textarea,
} from "@/components/ui/Field/Field";
import { ROUTES } from "@/config/content";
import { FORM_LIMITS, HTTP } from "@/config/forms";
import { useMessages } from "@/i18n/MessagesProvider";
import type { Messages } from "@/i18n/messages";
import { isSafeHref } from "@/lib/urls";
import type { SiteSetting } from "@/payload-types";
import styles from "./InquiryForm.module.css";
import { InquiryValidationError, parseInquiry } from "./validation";

type Props = { readonly copy: SiteSetting["form"]; readonly preview: boolean };
type State = "idle" | "pending" | "success" | "error" | "rate-limit";
type InvalidField = keyof Messages["form"]["validation"];

export function InquiryForm({ copy, preview }: Props) {
	const { form: messages } = useMessages();
	const id = useId(),
		path = usePathname();
	const requestID = useRef<string | null>(null);
	const activeRequest = useRef<AbortController | null>(null);
	const [state, setState] = useState<State>("idle");
	const [invalid, setInvalid] = useState<InvalidField | null>(null);
	useEffect(() => () => activeRequest.current?.abort(), []);
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (preview || state === "pending") {
			return;
		}
		const form = event.currentTarget;
		const data = new FormData(form);
		requestID.current ||= crypto.randomUUID();
		let input: ReturnType<typeof parseInquiry>;
		try {
			input = parseInquiry({
				requestID: requestID.current,
				name: data.get("name"),
				contact: data.get("contact"),
				message: data.get("message"),
				sourcePath: path,
				consent: data.get("consent") === "on",
				website: data.get("website"),
			});
		} catch (error) {
			if (error instanceof InquiryValidationError) {
				setInvalid(error.field);
			}
			setState("error");
			return;
		}
		setInvalid(null);
		setState("pending");
		const controller = new AbortController();
		activeRequest.current = controller;
		const timeout = setTimeout(
			() => controller.abort(),
			FORM_LIMITS.requestTimeoutMilliseconds,
		);
		try {
			const response = await fetch(ROUTES.leads, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
				signal: controller.signal,
			});
			if (response.status === HTTP.tooManyRequests) {
				setState("rate-limit");
				return;
			}
			if (!response.ok) {
				throw new Error("Inquiry was not saved");
			}
			setState("success");
			form.reset();
			requestID.current = null;
		} catch {
			setState("error");
		} finally {
			clearTimeout(timeout);
			activeRequest.current = null;
		}
	}
	return (
		<form onSubmit={submit} className={styles.form} noValidate>
			<div className={styles.fields}>
				<Field
					id={`${id}-name`}
					label={copy?.nameLabel || messages.name}
					hint={copy?.namePlaceholder}
					error={invalid === "name" ? messages.validation.name : undefined}
				>
					<Input
						id={`${id}-name`}
						name="name"
						autoComplete="name"
						required
						maxLength={FORM_LIMITS.name}
						aria-invalid={invalid === "name"}
						aria-describedby={fieldDescription(
							`${id}-name`,
							copy?.namePlaceholder,
							invalid === "name",
						)}
					/>
				</Field>
				<Field
					id={`${id}-contact`}
					label={copy?.contactLabel || messages.contact}
					hint={copy?.contactPlaceholder}
					error={
						invalid === "contact" ? messages.validation.contact : undefined
					}
				>
					<Input
						id={`${id}-contact`}
						name="contact"
						required
						maxLength={FORM_LIMITS.contact}
						aria-invalid={invalid === "contact"}
						aria-describedby={fieldDescription(
							`${id}-contact`,
							copy?.contactPlaceholder,
							invalid === "contact",
						)}
					/>
				</Field>
			</div>
			<Field
				id={`${id}-message`}
				label={copy?.messageLabel || messages.message}
				hint={copy?.messagePlaceholder}
				error={invalid === "message" ? messages.validation.message : undefined}
			>
				<Textarea
					id={`${id}-message`}
					name="message"
					maxLength={FORM_LIMITS.message}
					aria-invalid={invalid === "message"}
					aria-describedby={fieldDescription(
						`${id}-message`,
						copy?.messagePlaceholder,
						invalid === "message",
					)}
				/>
			</Field>
			<div className={styles.trap} aria-hidden="true">
				<label htmlFor={`${id}-website`}>{messages.website}</label>
				<input
					id={`${id}-website`}
					name="website"
					tabIndex={-1}
					autoComplete="off"
				/>
			</div>
			<label className={styles.consent} htmlFor={`${id}-consent`}>
				<input
					id={`${id}-consent`}
					name="consent"
					type="checkbox"
					required
					aria-invalid={invalid === "consent"}
				/>
				<span>
					{copy?.consentLabel || messages.consent}{" "}
					{isSafeHref(copy?.privacyURL) && (
						<a href={copy.privacyURL} target="_blank" rel="noreferrer">
							{copy.consentLinkLabel || messages.privacy}
						</a>
					)}
				</span>
			</label>
			{preview && <p role="note">{messages.preview}</p>}
			{state === "success" && (
				<p role="status" className={styles.success}>
					{copy?.successMessage || messages.success}
				</p>
			)}
			{(state === "error" || state === "rate-limit") && (
				<p role="alert" className={styles.error}>
					{invalid
						? messages.validation[invalid]
						: state === "rate-limit"
							? messages.rateLimit
							: copy?.errorMessage || messages.error}
				</p>
			)}
			<Button type="submit" disabled={preview || state === "pending"}>
				{state === "pending"
					? copy?.pendingLabel || messages.pending
					: copy?.submitLabel || messages.submit}
			</Button>
		</form>
	);
}

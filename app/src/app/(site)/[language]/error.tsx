"use client";

import { Button } from "@/components/ui/Button/Button";
import { Heading, Section } from "@/components/ui/Layout/Layout";
import { useMessages } from "@/i18n/MessagesProvider";

export default function ErrorPage({ reset }: { readonly reset: () => void }) {
	const { error: messages } = useMessages();
	return (
		<Section>
			<Heading as="h1">{messages.title}</Heading>
			<p>{messages.description}</p>
			<Button onClick={reset}>{messages.retry}</Button>
		</Section>
	);
}

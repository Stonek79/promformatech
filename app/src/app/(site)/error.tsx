"use client";

import { Button } from "@/components/ui/Button/Button";
import { Heading, Section } from "@/components/ui/Layout/Layout";

export default function ErrorPage({ reset }: { readonly reset: () => void }) {
	return (
		<Section>
			<Heading as="h1">Не удалось загрузить страницу</Heading>
			<p>Попробуйте ещё раз немного позже.</p>
			<Button onClick={reset}>Повторить</Button>
		</Section>
	);
}

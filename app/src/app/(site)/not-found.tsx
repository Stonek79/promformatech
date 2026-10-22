import { ButtonLink } from "@/components/ui/Button/Button";
import { Heading, Section } from "@/components/ui/Layout/Layout";
import { ROUTES } from "@/config/content";
import { getMessages } from "@/i18n/messages";

export default function NotFound() {
	const { notFound: messages } = getMessages();
	return (
		<Section>
			<Heading as="h1">{messages.title}</Heading>
			<p>{messages.description}</p>
			<ButtonLink href={ROUTES.home}>{messages.home}</ButtonLink>
		</Section>
	);
}

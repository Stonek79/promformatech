import { ButtonLink } from "@/components/ui/Button/Button";
import { Heading, Section } from "@/components/ui/Layout/Layout";
import { ROUTES } from "@/config/content";
import { getMessages } from "@/i18n/messages";
import { sitePath } from "@/i18n/site-path";
import { getSiteLocale } from "@/i18n/site-server";

export default async function NotFound() {
	const locale = await getSiteLocale();
	const { notFound: messages } = getMessages(locale);
	return (
		<Section>
			<Heading as="h1">{messages.title}</Heading>
			<p>{messages.description}</p>
			<ButtonLink href={sitePath(ROUTES.home, locale)}>
				{messages.home}
			</ButtonLink>
		</Section>
	);
}

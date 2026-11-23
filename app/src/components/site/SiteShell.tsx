import type { ReactNode } from "react";
import { Container } from "@/components/ui/Layout/Layout";
import { readSettings } from "@/features/content/read";
import { getViewer } from "@/features/content/viewer";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { serverURL } from "@/lib/urls";
import { Footer } from "./Footer/Footer";
import { Header } from "./Header/Header";
import { PreviewBanner } from "./PreviewBanner/PreviewBanner";
import { BackNavigation } from "./SiteNavigation/BackNavigation";
import { ScrollToTop } from "./SiteNavigation/ScrollToTop";

export async function SiteShell({
	children,
	locale,
}: {
	readonly children: ReactNode;
	readonly locale: Locale;
}) {
	const { common: messages } = getMessages(locale);
	const viewer = await getViewer(locale);
	const settings = await readSettings(viewer);
	if (!settings.companyName) {
		return (
			<main>
				<Container>
					<h1>{messages.preparing}</h1>
				</Container>
			</main>
		);
	}
	return (
		<>
			{viewer.preview && (
				<PreviewBanner editURL={viewer.editURL} serverURL={serverURL()} />
			)}
			<Header settings={settings} locale={locale} />
			<main id="main-content" tabIndex={-1}>
				<Container>
					<BackNavigation />
					{children}
				</Container>
			</main>
			<Footer settings={settings} locale={locale} />
			<ScrollToTop />
		</>
	);
}

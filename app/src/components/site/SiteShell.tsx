import type { ReactNode } from "react";
import { Container } from "@/components/ui/Layout/Layout";
import { readSettings } from "@/features/content/read";
import { getViewer } from "@/features/content/viewer";
import { getMessages } from "@/i18n/messages";
import { serverURL } from "@/lib/urls";
import { Footer } from "./Footer/Footer";
import { Header } from "./Header/Header";
import { PreviewBanner } from "./PreviewBanner/PreviewBanner";

export async function SiteShell({
	children,
}: {
	readonly children: ReactNode;
}) {
	const { common: messages } = getMessages();
	const viewer = await getViewer();
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
			<Header settings={settings} />
			<main id="main-content">
				<Container>{children}</Container>
			</main>
			<Footer settings={settings} />
		</>
	);
}

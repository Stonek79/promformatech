import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { ShellSkeleton } from "@/components/site/PageSkeleton/PageSkeleton";
import { SiteShell } from "@/components/site/SiteShell";
import { APPEARANCE, parseTextSize, parseTheme } from "@/config/appearance";
import { SiteAppearanceProvider } from "@/features/appearance/SiteAppearance";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { MessagesProvider } from "@/i18n/MessagesProvider";
import { getMessages } from "@/i18n/messages";
import { serverURL } from "@/lib/urls";
import "@/design-system/generated/tokens.css";
import "./globals.css";

const brandFont = localFont({
	src: "../../assets/fonts/unbounded-variable.woff2",
	variable: "--pf-font-brand",
	weight: "200 900",
	display: "swap",
});

export const metadata: Metadata = {
	metadataBase: new URL(serverURL()),
	title: getMessages().common.brand,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
	const { common: messages } = getMessages();
	const preferences = await cookies();
	const theme = parseTheme(preferences.get(APPEARANCE.siteThemeCookie)?.value);
	const size = parseTextSize(preferences.get(APPEARANCE.siteSizeCookie)?.value);
	return (
		<html
			lang={DEFAULT_LOCALE}
			data-scroll-behavior="smooth"
			className={brandFont.variable}
			data-site-theme={theme}
			data-text-size={size}
		>
			<body>
				<MessagesProvider locale={DEFAULT_LOCALE}>
					<SiteAppearanceProvider initialTheme={theme} initialSize={size}>
						<a className="skip-link" href="#main-content">
							{messages.skipToContent}
						</a>
						<Suspense fallback={<ShellSkeleton />}>
							<SiteShell>{children}</SiteShell>
						</Suspense>
					</SiteAppearanceProvider>
				</MessagesProvider>
			</body>
		</html>
	);
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { ShellSkeleton } from "@/components/site/PageSkeleton/PageSkeleton";
import { SiteShell } from "@/components/site/SiteShell";
import { APPEARANCE, parseTextSize, parseTheme } from "@/config/appearance";
import { SiteAppearanceProvider } from "@/features/appearance/SiteAppearance";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { MessagesProvider } from "@/i18n/MessagesProvider";
import { getMessages } from "@/i18n/messages";
import { getSiteLocale } from "@/i18n/site-server";
import { serverURL } from "@/lib/urls";
import "@/design-system/generated/tokens.css";
import "../globals.css";

const siteFont = localFont({
	src: "../../../assets/fonts/onest-variable.woff2",
	variable: "--pf-font-site",
	weight: "100 900",
	display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
	await connection();
	const locale = await getSiteLocale();
	return {
		metadataBase: new URL(serverURL()),
		title: getMessages(locale).common.brand,
		...(locale === DEFAULT_LOCALE
			? {}
			: { robots: { index: false, follow: true } }),
	};
}

export default async function RootLayout({
	children,
}: LayoutProps<"/[language]">) {
	const [locale, preferences] = await Promise.all([getSiteLocale(), cookies()]);
	const { common: messages } = getMessages(locale);
	const theme = parseTheme(preferences.get(APPEARANCE.siteThemeCookie)?.value);
	const size = parseTextSize(preferences.get(APPEARANCE.siteSizeCookie)?.value);
	return (
		<html
			lang={locale}
			data-scroll-behavior="smooth"
			className={siteFont.variable}
			data-site-theme={theme}
			data-text-size={size}
		>
			<body>
				<MessagesProvider locale={locale}>
					<SiteAppearanceProvider initialTheme={theme} initialSize={size}>
						<a className="skip-link" href="#main-content">
							{messages.skipToContent}
						</a>
						<Suspense fallback={<ShellSkeleton locale={locale} />}>
							<SiteShell locale={locale}>{children}</SiteShell>
						</Suspense>
					</SiteAppearanceProvider>
				</MessagesProvider>
			</body>
		</html>
	);
}

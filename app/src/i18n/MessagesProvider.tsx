"use client";

import { createContext, type ReactNode, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { getMessages } from "./messages";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function MessagesProvider({
	children,
	locale,
}: {
	readonly children: ReactNode;
	readonly locale: Locale;
}) {
	return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useMessages() {
	return getMessages(useLocale());
}

export function useLocale() {
	return useContext(LocaleContext);
}

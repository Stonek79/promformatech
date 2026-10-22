"use client";

import { createContext, type ReactNode, use, useState } from "react";
import {
	APPEARANCE,
	type TextSize,
	type ThemePreference,
} from "@/config/appearance";
import { AppearanceControls } from "./AppearanceControls";
import { applyTextSize, savePreference } from "./persistence";

type AppearanceState = {
	readonly theme: ThemePreference;
	readonly size: TextSize;
	readonly onThemeChange: (theme: ThemePreference) => void;
	readonly onSizeChange: (size: TextSize) => void;
};
const AppearanceContext = createContext<AppearanceState | null>(null);

export function SiteAppearanceProvider({
	children,
	initialTheme,
	initialSize,
}: {
	readonly children: ReactNode;
	readonly initialTheme: ThemePreference;
	readonly initialSize: TextSize;
}) {
	const [theme, setTheme] = useState(initialTheme);
	const [size, setSize] = useState(initialSize);
	function onThemeChange(value: ThemePreference) {
		document.documentElement.setAttribute(APPEARANCE.themeAttribute, value);
		savePreference(APPEARANCE.siteThemeCookie, value);
		setTheme(value);
	}
	function onSizeChange(value: TextSize) {
		applyTextSize(value, APPEARANCE.siteSizeCookie);
		setSize(value);
	}
	return (
		<AppearanceContext value={{ theme, size, onThemeChange, onSizeChange }}>
			{children}
		</AppearanceContext>
	);
}

export function SiteAppearance() {
	const appearance = use(AppearanceContext);
	if (!appearance) {
		return null;
	}
	return <AppearanceControls {...appearance} />;
}

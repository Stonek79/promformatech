"use client";

import { useSyncExternalStore } from "react";
import { APPEARANCE, THEMES, type ThemePreference } from "@/config/appearance";

function subscribe(onChange: () => void) {
	const media = window.matchMedia(APPEARANCE.darkMedia);
	media.addEventListener("change", onChange);
	return () => media.removeEventListener("change", onChange);
}

function getSnapshot() {
	return window.matchMedia(APPEARANCE.darkMedia).matches;
}

function getServerSnapshot() {
	return false;
}

export function useDarkTheme(theme: ThemePreference) {
	const systemDark = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getServerSnapshot,
	);
	return theme === THEMES.system ? systemDark : theme === THEMES.dark;
}

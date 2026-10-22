"use client";

import { useTheme } from "@payloadcms/ui";
import { useEffect, useState } from "react";
import {
	APPEARANCE,
	type TextSize,
	THEMES,
	type ThemePreference,
} from "@/config/appearance";
import { AppearanceControls } from "@/features/appearance/AppearanceControls";
import { applyTextSize } from "@/features/appearance/persistence";

export function AdminAppearance({
	initialSize,
}: {
	readonly initialSize: TextSize;
}) {
	const { theme, autoMode, setTheme } = useTheme();
	const [size, setSize] = useState(initialSize);
	// Payload 3.91 runtime supports auto; its ThemeContext declaration omits it.
	const setNativeTheme = setTheme as (value: ThemePreference) => void;
	useEffect(() => {
		if (!autoMode) {
			return;
		}
		const media = window.matchMedia(APPEARANCE.darkMedia);
		const followSystem = () => setNativeTheme(THEMES.system);
		media.addEventListener("change", followSystem);
		return () => media.removeEventListener("change", followSystem);
	}, [autoMode, setNativeTheme]);

	function onSizeChange(value: TextSize) {
		applyTextSize(value, APPEARANCE.adminSizeCookie);
		setSize(value);
	}
	return (
		<AppearanceControls
			theme={autoMode ? THEMES.system : theme}
			size={size}
			onThemeChange={setNativeTheme}
			onSizeChange={onSizeChange}
		/>
	);
}

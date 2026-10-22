import styles from "./Icon.module.css";

const paths = {
	textSize: "M2 5h10M7 5v14m9-12 3-3 3 3M19 4v16m-3-3 3 3 3-3",
	sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
	moon: "M20 15A8 8 0 0 1 9 4a8.5 8.5 0 1 0 11 11Z",
	menu: "M3 6h18M3 12h18M3 18h18",
	close: "m6 6 12 12M18 6 6 18",
	search: "m21 21-5-5M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Z",
	arrow: "M4 12h16m-6-6 6 6-6 6",
	phone:
		"M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a13 13 0 0 1-7-7l2-2-2-5Z",
	mail: "M3 5h18v14H3V5Zm0 0 9 8 9-8",
	location:
		"M12 21s7-7 7-12A7 7 0 0 0 5 9c0 5 7 12 7 12Zm0-15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
} as const;

export function Icon({ name }: { readonly name: keyof typeof paths }) {
	return (
		<svg
			className={styles.icon}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			aria-hidden="true"
		>
			<path d={paths[name]} />
		</svg>
	);
}

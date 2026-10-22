import { breakpoints } from "@/design-system/tokens/theme.mjs";

export const IMAGE_SIZES = {
	full: "100vw",
	columns: `(max-width: ${breakpoints.tablet}) 100vw, 50vw`,
	card: `(max-width: ${breakpoints.phone}) 100vw, (max-width: ${breakpoints.tablet}) 50vw, 33vw`,
	logo: `(max-width: ${breakpoints.wide}) 35vw, 33rem`,
} as const;
export const IMAGE_QUERY = { width: "w" } as const;

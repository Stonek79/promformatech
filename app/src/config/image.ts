import { breakpoints, tokens } from "@/design-system/tokens/theme.mjs";

const productCardWidth = tokens["product-card-max-width"];

export const IMAGE_SIZES = {
	full: "100vw",
	columns: `(max-width: ${breakpoints.tablet}) 100vw, 50vw`,
	card: `(max-width: ${breakpoints.phone}) 100vw, (max-width: ${breakpoints.tablet}) 50vw, 33vw`,
	productCard: `(min-width: ${breakpoints.wide}) min(25vw, ${productCardWidth}), (min-width: ${breakpoints.tablet}) min(33vw, ${productCardWidth}), (min-width: ${breakpoints.phone}) min(50vw, ${productCardWidth}), min(100vw, ${productCardWidth})`,
	logo: `(max-width: ${breakpoints.wide}) 35vw, 33rem`,
} as const;
export const IMAGE_QUERY = { width: "w" } as const;

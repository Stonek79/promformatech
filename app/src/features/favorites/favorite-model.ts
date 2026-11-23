import { FAVORITES } from "@/config/favorites";
import { LOCALES, type Locale } from "@/i18n/config";

type Copy = { readonly value: string; readonly lang: Locale };

export type FavoriteProduct = {
	readonly id: number;
	readonly slug: string;
	readonly title: Copy;
	readonly summary?: Copy;
	readonly photo?: {
		readonly id: number;
		readonly width: number;
		readonly height: number;
	};
	readonly specs: readonly {
		readonly key: string;
		readonly label: Copy;
		readonly value: Copy;
	}[];
};

function positiveInteger(value: unknown): value is number {
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function favoriteIDs(values: readonly unknown[]) {
	return [...new Set(values.filter(positiveInteger))].slice(
		0,
		FAVORITES.maxProducts,
	);
}

function record(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function copy(value: unknown): value is Copy {
	return (
		record(value) &&
		typeof value.value === "string" &&
		Object.values(LOCALES).some((locale) => locale === value.lang)
	);
}

export function isFavoriteProduct(value: unknown): value is FavoriteProduct {
	if (
		!record(value) ||
		!positiveInteger(value.id) ||
		typeof value.slug !== "string" ||
		!copy(value.title)
	) {
		return false;
	}
	const { photo, summary, specs } = value;
	return (
		(summary === undefined || copy(summary)) &&
		(photo === undefined ||
			(record(photo) &&
				positiveInteger(photo.id) &&
				positiveInteger(photo.width) &&
				positiveInteger(photo.height))) &&
		Array.isArray(specs) &&
		specs.every(
			(item: unknown) =>
				record(item) &&
				typeof item.key === "string" &&
				copy(item.label) &&
				copy(item.value),
		)
	);
}

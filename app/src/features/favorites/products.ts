import { getCMS } from "@/cms/client";
import { COLLECTIONS } from "@/config/content";
import {
	localizedText,
	matchRows,
	readSourceLocales,
} from "@/features/content/localized-fields";
import { publicRead } from "@/features/content/queries";
import { isReadyImage, mediaView } from "@/features/media/view-model";
import type { Locale } from "@/i18n/config";
import type { Product } from "@/payload-types";
import type { FavoriteProduct } from "./favorite-model";

type ProductFields = Pick<
	Product,
	"id" | "slug" | "title" | "summary" | "featuredImage" | "specifications"
>;

function productView(
	product: ProductFields,
	locale: Locale,
	source?: ProductFields,
): FavoriteProduct {
	const { id, slug } = product;
	const title = localizedText(locale, product.title, source?.title);
	const summary = localizedText(locale, product.summary, source?.summary);
	const photo = mediaView(product.featuredImage);
	const specs = matchRows(
		product.specifications,
		source?.specifications,
		(row, original) => {
			const label = localizedText(locale, row.label, original?.label);
			const value = localizedText(locale, row.value, original?.value);
			if (!label.value || !value.value) {
				return [];
			}
			return [
				{
					key: (original?.label?.trim() || label.value)
						.normalize("NFC")
						.toLowerCase(),
					label: { ...label, value: label.value },
					value: { ...value, value: value.value },
				},
			];
		},
	).flat();
	return {
		id,
		slug,
		title: { ...title, value: title.value ?? slug },
		summary: summary.value ? { ...summary, value: summary.value } : undefined,
		photo: isReadyImage(photo)
			? { id: photo.id, width: photo.width, height: photo.height }
			: undefined,
		specs,
	};
}

export async function readFavoriteProducts(ids: number[], locale: Locale) {
	if (!ids.length) {
		return [];
	}
	const cms = await getCMS();
	const [localized, originals] = await readSourceLocales(
		locale,
		async (locale) => {
			const { docs } = await cms.find({
				...publicRead(),
				collection: COLLECTIONS.products,
				locale,
				fallbackLocale: false,
				depth: 1,
				limit: ids.length,
				where: { id: { in: ids } },
				select: {
					slug: true,
					title: true,
					summary: true,
					featuredImage: true,
					specifications: true,
				},
			});
			return docs;
		},
	);
	const originalByID = new Map(originals?.map((item) => [item.id, item]));
	return localized.map((product) =>
		productView(product, locale, originalByID.get(product.id)),
	);
}

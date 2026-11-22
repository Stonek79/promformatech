import type { BLOCK_TYPES } from "@/config/blocks";
import { PUBLICATION, type ShowcaseCollection } from "@/config/content";
import type { Locale } from "@/i18n/config";
import type { Product, Project, Service } from "@/payload-types";
import type { ArticleBlock } from "./article-blocks";
import {
	type LocalizedText,
	localizedText,
	readSourceLocales,
} from "./localized-fields";

type ShowcaseMaterial = Product | Project | Service;
export type LocalizedMaterial = {
	readonly material: ShowcaseMaterial;
	readonly source?: ShowcaseMaterial;
	readonly locale: Locale;
};

type CardContent = Pick<
	ShowcaseMaterial,
	"id" | "slug" | "featuredImage" | "title" | "summary"
>;

export type MaterialCard = Pick<
	CardContent,
	"id" | "slug" | "featuredImage"
> & {
	readonly collection: ShowcaseCollection;
	readonly title: LocalizedText;
	readonly summary: LocalizedText;
};

export function materialCard(
	collection: ShowcaseCollection,
	{ id, slug, featuredImage, title, summary }: CardContent,
	locale: Locale,
	source?: CardContent,
): MaterialCard {
	return {
		id,
		slug,
		featuredImage,
		collection,
		title: localizedText(locale, title, source?.title),
		summary: localizedText(locale, summary, source?.summary),
	};
}

export async function readMaterialLocales(
	locale: Locale,
	load: (locale: Locale) => Promise<ShowcaseMaterial | null>,
): Promise<LocalizedMaterial | null> {
	const [material, source] = await readSourceLocales(locale, load);
	return material ? { material, source: source ?? undefined, locale } : null;
}

export async function readMaterialCards<T extends CardContent>(
	collection: ShowcaseCollection,
	locale: Locale,
	load: (locale: Locale) => Promise<T[]>,
) {
	const [items, originals] = await readSourceLocales(locale, load);
	const source = new Map(originals?.map((item) => [item.id, item]));
	return items.map((item) =>
		materialCard(collection, item, locale, source.get(item.id)),
	);
}

type CardsBlock = Extract<
	ArticleBlock,
	{ blockType: typeof BLOCK_TYPES.cards }
>;
type CardsItem = NonNullable<CardsBlock["items"]>[number];

function cardKey({ relationTo, value }: CardsItem) {
	return `${relationTo}-${typeof value === "object" ? value.id : value}`;
}

export function relatedMaterialCards(
	block: CardsBlock,
	source: CardsBlock | undefined,
	locale: Locale,
	preview: boolean,
) {
	const originals = new Map(
		source?.items?.map((row) => [cardKey(row), row.value]),
	);
	const cards = [];
	for (const item of block.items ?? []) {
		const material = item.value;
		if (
			typeof material !== "object" ||
			(!preview && material._status !== PUBLICATION.published)
		) {
			continue;
		}
		const original = originals.get(cardKey(item));
		cards.push(
			materialCard(
				item.relationTo,
				material,
				locale,
				typeof original === "object" ? original : undefined,
			),
		);
	}
	return cards;
}

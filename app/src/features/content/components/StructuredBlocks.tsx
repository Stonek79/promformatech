import type { BLOCK_TYPES } from "@/config/blocks";
import type { Locale } from "@/i18n/config";
import { classes } from "@/lib/classes";
import type { ArticleBlock } from "../article-blocks";
import { localizedText, matchRows } from "../localized-fields";
import styles from "./content.module.css";
import specificationStyles from "./specifications.module.css";

export function Steps({
	block,
	original,
	language,
}: {
	readonly block: Extract<
		ArticleBlock,
		{ blockType: typeof BLOCK_TYPES.steps }
	>;
	readonly original?: Extract<
		ArticleBlock,
		{ blockType: typeof BLOCK_TYPES.steps }
	>;
	readonly language: Locale;
}) {
	return (
		<ol className={styles.steps}>
			{matchRows(block.items, original?.items, (step, source) => {
				const title = localizedText(language, step.title, source?.title);
				const text = localizedText(language, step.text, source?.text);
				const duration = localizedText(
					language,
					step.duration,
					source?.duration,
				);
				return (
					<li key={step.id}>
						{title.value && <h3 lang={title.lang}>{title.value}</h3>}
						{text.value && <p lang={text.lang}>{text.value}</p>}
						{duration.value && (
							<span lang={duration.lang}>{duration.value}</span>
						)}
					</li>
				);
			})}
		</ol>
	);
}

export function Specifications({
	block,
	original,
	language,
}: {
	readonly block: Extract<
		ArticleBlock,
		{ blockType: typeof BLOCK_TYPES.specifications }
	>;
	readonly original?: Extract<
		ArticleBlock,
		{ blockType: typeof BLOCK_TYPES.specifications }
	>;
	readonly language: Locale;
}) {
	return (
		<dl className={classes(styles.specifications, specificationStyles.list)}>
			{matchRows(block.items, original?.items, (item, source) => {
				const label = localizedText(language, item.label, source?.label);
				const value = localizedText(language, item.value, source?.value);
				return (
					<div key={item.id}>
						<dt lang={label.lang}>{label.value}</dt>
						<dd lang={value.lang}>{value.value}</dd>
					</div>
				);
			})}
		</dl>
	);
}

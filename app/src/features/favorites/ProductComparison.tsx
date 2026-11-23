"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Heading } from "@/components/ui/Layout/Layout";
import { COLLECTIONS } from "@/config/content";
import { useLocale, useMessages } from "@/i18n/MessagesProvider";
import { sitePath } from "@/i18n/site-path";
import { materialPath } from "@/lib/urls";
import type { FavoriteProduct } from "./favorite-model";
import styles from "./favorites.module.css";

export const COMPARISON_ID = "product-comparison";

export function ProductComparison({
	products,
}: {
	readonly products: readonly FavoriteProduct[];
}) {
	const { favorites } = useMessages();
	const locale = useLocale();
	const rows = new Map<string, FavoriteProduct["specs"][number]["label"]>();
	for (const product of products) {
		for (const spec of product.specs) {
			if (!rows.has(spec.key)) {
				rows.set(spec.key, spec.label);
			}
		}
	}
	const columns = products.map(
		(product) => new Map(product.specs.map((spec) => [spec.key, spec.value])),
	);

	return (
		<section id={COMPARISON_ID} className={styles.comparison} tabIndex={-1}>
			<Heading>{favorites.comparison}</Heading>
			<p className={styles.scrollHint}>{favorites.scrollHint}</p>
			<section
				aria-label={favorites.comparison}
				className={styles.tableScroll}
				// biome-ignore lint/a11y/noNoninteractiveTabindex: Enables keyboard scrolling of the comparison table.
				tabIndex={0}
			>
				<table
					className={styles.table}
					style={{ "--comparison-products": products.length } as CSSProperties}
				>
					<thead>
						<tr>
							<th scope="col">{favorites.spec}</th>
							{products.map((product) => (
								<th key={product.id} scope="col">
									<Link
										href={sitePath(
											materialPath(COLLECTIONS.products, product.slug),
											locale,
										)}
										lang={product.title.lang}
									>
										{product.title.value}
									</Link>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						<tr>
							<th scope="row">{favorites.description}</th>
							{products.map(({ id, summary }) => (
								<td key={id} lang={summary?.lang}>
									{summary?.value ?? "—"}
								</td>
							))}
						</tr>
						{[...rows].map(([key, label]) => (
							<tr key={key}>
								<th scope="row" lang={label.lang}>
									{label.value}
								</th>
								{products.map((product, index) => {
									const value = columns[index].get(key);
									return (
										<td key={product.id} lang={value?.lang}>
											{value?.value ?? "—"}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</section>
	);
}

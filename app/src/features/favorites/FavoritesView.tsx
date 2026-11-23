"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Layout/Layout";
import { COLLECTIONS, ROUTES } from "@/config/content";
import { FAVORITES } from "@/config/favorites";
import { IMAGE_SIZES } from "@/config/image";
import { ResponsiveImage } from "@/features/media/ResponsiveImage";
import { type Locale, SITE_LANGUAGE_QUERY } from "@/i18n/config";
import { useLocale, useMessages } from "@/i18n/MessagesProvider";
import { sitePath } from "@/i18n/site-path";
import { materialPath } from "@/lib/urls";
import { FavoriteToggle } from "./FavoriteToggle";
import { type FavoriteProduct, isFavoriteProduct } from "./favorite-model";
import styles from "./favorites.module.css";
import { COMPARISON_ID, ProductComparison } from "./ProductComparison";
import { toggleFavorite, useFavoriteIDs } from "./store";

type Result = {
	readonly ids: readonly number[];
	readonly locale: Locale;
	readonly attempt: number;
	readonly products?: readonly FavoriteProduct[];
};

async function fetchProducts(
	ids: readonly number[],
	locale: Locale,
	signal: AbortSignal,
) {
	const query = new URLSearchParams({ [SITE_LANGUAGE_QUERY]: locale });
	for (const id of ids) {
		query.append("id", String(id));
	}
	const response = await fetch(`${ROUTES.favoriteProducts}?${query}`, {
		signal,
	});
	if (!response.ok) {
		throw new Error("Favorites request failed");
	}
	const products: unknown = await response.json();
	if (!Array.isArray(products) || !products.every(isFavoriteProduct)) {
		throw new Error("Invalid favorites response");
	}
	return products;
}

function ProductRow({
	product,
	selected,
	disabled,
	select,
}: {
	readonly product: FavoriteProduct;
	readonly selected: boolean;
	readonly disabled: boolean;
	readonly select: (id: number) => void;
}) {
	const { favorites } = useMessages();
	const locale = useLocale();
	const { photo, title, summary } = product;
	return (
		<li className={styles.savedRow}>
			{photo && (
				<div className={styles.savedImage}>
					<ResponsiveImage
						{...photo}
						sizes={IMAGE_SIZES.favoriteThumbnail}
						alt=""
						fill
						cover
					/>
				</div>
			)}
			<div className={styles.savedBody}>
				<Heading lang={title.lang}>
					<Link
						data-return-card
						href={sitePath(
							materialPath(COLLECTIONS.products, product.slug),
							locale,
						)}
					>
						{title.value}
					</Link>
				</Heading>
				{summary && <p lang={summary.lang}>{summary.value}</p>}
				<label className={styles.select}>
					<input
						type="checkbox"
						checked={selected}
						disabled={disabled}
						onChange={() => select(product.id)}
					/>
					{favorites.select}
				</label>
			</div>
			<FavoriteToggle id={product.id} title={title.value} />
		</li>
	);
}

export function FavoritesView() {
	const { favorites, error } = useMessages();
	const locale = useLocale();
	const ids = useFavoriteIDs();
	const [result, setResult] = useState<Result>();
	const [attempt, setAttempt] = useState(0);
	const [selection, setSelection] = useState<readonly number[]>([]);

	useEffect(() => {
		if (!ids?.length) {
			return;
		}
		const request = new AbortController();
		void fetchProducts(ids, locale, request.signal).then(
			(products) => {
				if (!request.signal.aborted) {
					setResult({ ids, locale, attempt, products });
				}
			},
			() => {
				if (!request.signal.aborted) {
					setResult({ ids, locale, attempt });
				}
			},
		);
		return () => request.abort();
	}, [ids, locale, attempt]);

	if (!ids) {
		return <p role="status">{favorites.loading}</p>;
	}
	if (!ids.length) {
		return (
			<div className={styles.empty}>
				<p>{favorites.empty}</p>
				<ButtonLink href={sitePath(ROUTES.products, locale)}>
					{favorites.catalog}
				</ButtonLink>
			</div>
		);
	}
	const current = result?.locale === locale ? result : undefined;
	const complete = current?.ids === ids && current.attempt === attempt;
	if (complete && !current?.products) {
		return (
			<div className={styles.empty}>
				<p role="status">{favorites.error}</p>
				<Button
					variant="secondary"
					onClick={() => setAttempt((number) => number + 1)}
				>
					{error.retry}
				</Button>
			</div>
		);
	}
	const products = new Map(current?.products?.map((item) => [item.id, item]));
	const comparison = ids.flatMap((id) => {
		const item = products.get(id);
		return item && selection.includes(id) ? [item] : [];
	});
	const compare = comparison.length >= FAVORITES.minComparison;
	const limit = comparison.length >= FAVORITES.maxComparison;

	function select(id: number) {
		setSelection((previous) =>
			previous.includes(id)
				? previous.filter((item) => item !== id)
				: [...previous.filter((item) => products.has(item)), id],
		);
	}

	return (
		<div className={styles.saved}>
			<div className={styles.savedToolbar}>
				<p>
					{favorites.hint(FAVORITES.minComparison, FAVORITES.maxComparison)}
				</p>
				{compare && (
					<ButtonLink href={`#${COMPARISON_ID}`}>
						{favorites.compare}
					</ButtonLink>
				)}
			</div>
			{!complete && !current?.products && (
				<p role="status">{favorites.loading}</p>
			)}
			<ul className={styles.savedList}>
				{ids.map((id) => {
					const product = products.get(id);
					if (!product) {
						return complete ? (
							<li key={id} className={styles.missing}>
								<span>{favorites.unavailable}</span>
								<Button variant="secondary" onClick={() => toggleFavorite(id)}>
									{favorites.remove}
								</Button>
							</li>
						) : null;
					}
					const selected = selection.includes(id);
					return (
						<ProductRow
							key={id}
							product={product}
							selected={selected}
							disabled={limit && !selected}
							select={select}
						/>
					);
				})}
			</ul>
			{compare && <ProductComparison products={comparison} />}
		</div>
	);
}

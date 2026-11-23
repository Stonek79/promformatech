import { FAVORITES } from "@/config/favorites";
import { favoriteIDs } from "@/features/favorites/favorite-model";
import { readFavoriteProducts } from "@/features/favorites/products";
import { parseLocale, SITE_LANGUAGE_QUERY } from "@/i18n/config";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const ids = favoriteIDs(
		searchParams.getAll("id").slice(0, FAVORITES.maxProducts).map(Number),
	);
	const locale = parseLocale(searchParams.get(SITE_LANGUAGE_QUERY));
	return Response.json(await readFavoriteProducts(ids, locale), {
		headers: { "Cache-Control": "private, no-store" },
	});
}

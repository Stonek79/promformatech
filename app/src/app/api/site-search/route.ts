import { SEARCH } from "@/config/search";
import { publishedSearch } from "@/features/content/search";
import { readSearchQuery } from "@/features/content/search-query";
import { parseLocale, SITE_LANGUAGE_QUERY } from "@/i18n/config";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = readSearchQuery(searchParams.get("q"));
	const locale = parseLocale(searchParams.get(SITE_LANGUAGE_QUERY));
	const results = await publishedSearch(query, locale);
	return Response.json({
		results: results.slice(0, SEARCH.suggestions),
		hasMore: results.length > SEARCH.suggestions,
	});
}

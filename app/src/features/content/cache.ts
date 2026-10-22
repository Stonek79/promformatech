import { unstable_cache } from "next/cache";
import { CONTENT_CACHE } from "@/config/content";

// Only anonymous, published reads belong in this cache; preview stays outside it.
export function cachePublished<Args extends unknown[], Result>(
	key: string,
	read: (...args: Args) => Promise<Result>,
) {
	return unstable_cache(read, [key], {
		tags: [CONTENT_CACHE.tag],
		revalidate: CONTENT_CACHE.seconds,
	});
}

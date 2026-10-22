import { SHOWCASE_COLLECTIONS, SHOWCASE_PATHS } from "@/config/content";

export function resolveContentRoute(segments: readonly string[]) {
	if (segments.length === 1) {
		return { kind: "page" as const, slug: segments[0] };
	}
	const collection = SHOWCASE_COLLECTIONS.find(
		(name) => SHOWCASE_PATHS[name] === `/${segments[0]}`,
	);
	if (segments.length === 2 && collection) {
		return { kind: "material" as const, collection, slug: segments[1] };
	}
	return null;
}

import { MEDIA_FIELDS, MEDIA_REFERENCE_FIELDS } from "@/config/media";
import { MEDIA_KIND, type MediaKind } from "@/config/media-assets";

const MEDIA_FIELD_NAMES: ReadonlySet<string> = new Set(
	Object.values(MEDIA_FIELDS),
);

type MediaReferences = {
	readonly ids: number[];
	readonly expectedKinds: ReadonlyMap<number, ReadonlySet<MediaKind>>;
};

export function relationshipID(value: unknown): number | null {
	if (typeof value === "string" && /^[1-9]\d*$/.test(value)) {
		return relationshipID(Number(value));
	}
	if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
		return value;
	}
	if (typeof value === "object" && value !== null && "id" in value) {
		return relationshipID(value.id);
	}
	return null;
}

export function collectMediaReferences(value: unknown): MediaReferences {
	const ids = new Set<number>();
	const expectedKinds = new Map<number, Set<MediaKind>>();
	function visit(item: unknown) {
		if (Array.isArray(item)) {
			for (const child of item) {
				visit(child);
			}
			return;
		}
		if (
			!item ||
			typeof item !== "object" ||
			("visible" in item && item.visible === false)
		) {
			return;
		}
		if (
			MEDIA_REFERENCE_FIELDS.relationTo in item &&
			MEDIA_REFERENCE_FIELDS.value in item
		) {
			return;
		}
		for (const [key, child] of Object.entries(item)) {
			if (
				key === MEDIA_REFERENCE_FIELDS.referencedMedia ||
				key === MEDIA_REFERENCE_FIELDS.body
			) {
				continue;
			}
			if (MEDIA_FIELD_NAMES.has(key)) {
				const id = relationshipID(child);
				if (id) {
					ids.add(id);
					if (key !== MEDIA_FIELDS.asset) {
						const kinds = expectedKinds.get(id) || new Set<MediaKind>();
						kinds.add(
							key === MEDIA_FIELDS.video ? MEDIA_KIND.video : MEDIA_KIND.image,
						);
						expectedKinds.set(id, kinds);
					}
				}
			} else {
				visit(child);
			}
		}
	}
	visit(value);
	return { ids: [...ids], expectedKinds };
}

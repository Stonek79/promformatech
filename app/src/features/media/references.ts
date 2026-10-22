import {
	MEDIA_FIELDS,
	MEDIA_KIND,
	MEDIA_REFERENCE_FIELDS,
	type MediaKind,
} from "@/config/media";

const MEDIA_FIELD_NAMES: ReadonlySet<string> = new Set(
	Object.values(MEDIA_FIELDS),
);

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

export function collectMediaIDs(value: unknown): number[] {
	const ids = new Set<number>();
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
		// Linked materials own their publication state; text editor JSON cannot grant file access.
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
				}
			} else {
				visit(child);
			}
		}
	}
	visit(value);
	return [...ids];
}

export function collectTypedMedia(value: unknown): Map<number, Set<MediaKind>> {
	const kinds = new Map<number, Set<MediaKind>>();
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
			("visible" in item && item.visible === false) ||
			(MEDIA_REFERENCE_FIELDS.relationTo in item &&
				MEDIA_REFERENCE_FIELDS.value in item)
		) {
			return;
		}
		for (const [key, child] of Object.entries(item)) {
			if (
				key === MEDIA_REFERENCE_FIELDS.body ||
				key === MEDIA_REFERENCE_FIELDS.referencedMedia
			) {
				continue;
			}
			if (MEDIA_FIELD_NAMES.has(key)) {
				const id = relationshipID(child);
				if (id && key !== MEDIA_FIELDS.asset) {
					const expected = kinds.get(id) || new Set<MediaKind>();
					expected.add(
						key === MEDIA_FIELDS.video ? MEDIA_KIND.video : MEDIA_KIND.image,
					);
					kinds.set(id, expected);
				}
			} else {
				visit(child);
			}
		}
	}
	visit(value);
	return kinds;
}

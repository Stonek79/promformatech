import { ROUTES } from "@/config/content";
import { serverURL } from "@/lib/urls";

type PreviewTarget = {
	readonly collection?: string;
	readonly id?: unknown;
	readonly global?: string;
};

export function previewURL({ collection, id, global }: PreviewTarget) {
	const url = new URL(ROUTES.preview, serverURL());
	if (collection) {
		url.searchParams.set("collection", collection);
	}
	if (typeof id === "string" || typeof id === "number") {
		url.searchParams.set("id", String(id));
	}
	if (global) {
		url.searchParams.set("global", global);
	}
	return url.toString();
}

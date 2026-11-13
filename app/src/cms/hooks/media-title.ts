import type { CollectionBeforeValidateHook } from "payload";
import { mediaTitleFromFilename } from "@/features/media/title";

export const assignMediaTitle: CollectionBeforeValidateHook = ({
	data,
	operation,
	req,
}) => {
	if (!data || operation !== "create") {
		return data;
	}
	if (typeof data.title === "string" && data.title.trim()) {
		return data;
	}
	return {
		...data,
		title: mediaTitleFromFilename(req.file?.name || data.filename),
	};
};

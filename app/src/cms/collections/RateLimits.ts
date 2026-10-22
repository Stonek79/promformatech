import type { CollectionConfig } from "payload";
import { COLLECTIONS } from "@/config/content";
import { deny } from "../access";

export const RateLimits: CollectionConfig = {
	slug: COLLECTIONS.rateLimits,
	dbName: "rate_limits",
	timestamps: false,
	admin: { hidden: true },
	access: { create: deny, read: deny, update: deny, delete: deny },
	fields: [
		{ name: "key", type: "text", required: true, unique: true },
		{ name: "count", type: "number", required: true },
		{ name: "resetAt", type: "date", required: true, index: true },
	],
};

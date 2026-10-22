import { COLLECTIONS } from "@/config/content";
import { getArrayLabels } from "@/i18n/messages";
import { showcaseCollection } from "./showcase";

export const Products = showcaseCollection({
	slug: COLLECTIONS.products,
	singular: "Продукция",
	plural: "Продукция",
	extraFields: [
		{ name: "category", type: "text", label: "Группа продукции" },
		{
			name: "specifications",
			type: "array",
			label: "Характеристики",
			labels: getArrayLabels("specifications"),
			fields: [
				{ name: "label", type: "text", label: "Название", required: true },
				{ name: "value", type: "text", label: "Значение", required: true },
			],
		},
	],
});

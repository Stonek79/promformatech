import { COLLECTIONS } from "@/config/content";
import { getArrayLabels } from "@/i18n/messages";
import { requiredSourceText } from "../fields/common";
import { showcaseCollection } from "./showcase";

export const Products = showcaseCollection({
	slug: COLLECTIONS.products,
	singular: "Продукция",
	plural: "Продукция",
	extraFields: [
		{
			name: "category",
			type: "text",
			label: "Группа продукции",
			localized: true,
		},
		{
			name: "specifications",
			type: "array",
			label: "Характеристики",
			labels: getArrayLabels("specifications"),
			fields: [
				{
					name: "label",
					type: "text",
					label: "Название",
					localized: true,
					validate: requiredSourceText,
				},
				{
					name: "value",
					type: "text",
					label: "Значение",
					localized: true,
					validate: requiredSourceText,
				},
			],
		},
	],
});

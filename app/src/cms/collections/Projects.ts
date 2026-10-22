import { COLLECTIONS } from "@/config/content";
import { showcaseCollection } from "./showcase";

export const Projects = showcaseCollection({
	slug: COLLECTIONS.projects,
	singular: "Проект",
	plural: "Реализованные проекты",
	extraFields: [
		{ name: "task", type: "textarea", label: "Задача клиента" },
		{ name: "solution", type: "textarea", label: "Наше решение" },
		{ name: "result", type: "textarea", label: "Результат" },
		{
			name: "client",
			type: "text",
			label: "Клиент",
			admin: { description: "Указывайте только с разрешения клиента." },
		},
		{ name: "location", type: "text", label: "Местоположение" },
	],
});

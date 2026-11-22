import { COLLECTIONS } from "@/config/content";
import { showcaseCollection } from "./showcase";

export const Projects = showcaseCollection({
	slug: COLLECTIONS.projects,
	singular: "Проект",
	plural: "Реализованные проекты",
	extraFields: [
		{
			name: "task",
			type: "textarea",
			label: "Задача клиента",
			localized: true,
		},
		{
			name: "solution",
			type: "textarea",
			label: "Наше решение",
			localized: true,
		},
		{ name: "result", type: "textarea", label: "Результат", localized: true },
		{
			name: "client",
			type: "text",
			label: "Клиент",
			localized: true,
			admin: { description: "Указывайте только с разрешения клиента." },
		},
		{
			name: "location",
			type: "text",
			label: "Местоположение",
			localized: true,
		},
	],
});

import type { APIRequestContext } from "@playwright/test";
import { COLLECTIONS, PUBLICATION, ROUTES } from "../../../src/config/content";
import { MEDIA_KIND, MEDIA_STATUS } from "../../../src/config/media";
import { expect } from "./admin";
import { login } from "./auth";

const PROJECT_API = `${ROUTES.api}/${COLLECTIONS.projects}`;
const FIXTURE_IMAGE_TITLE = "Промышленные роботы на производстве";
export const LAYOUT_PROJECT = {
	slug: "layout-verification-project",
	path: `${ROUTES.projects}/layout-verification-project`,
	title:
		"Автоматизированная линия изготовления высокоточных комплектующих для промышленного оборудования",
	caption:
		"Изготовление и контроль качества комплектующих: инструментальная оснастка, испытания и подготовка к серийному производству. Спецификация: ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ.",
} as const;

function documentID(value: unknown): number {
	if (typeof value !== "object" || value === null) {
		throw new Error("Expected a document");
	}
	if ("id" in value && typeof value.id === "number") {
		return value.id;
	}
	throw new Error("Expected a numeric document ID");
}

export async function createLayoutProject(request: APIRequestContext) {
	await login(request, "owner");
	const media = await request.get(`${ROUTES.api}/${COLLECTIONS.media}`, {
		params: {
			limit: 1,
			sort: "id",
			"where[title][equals]": FIXTURE_IMAGE_TITLE,
			"where[kind][equals]": MEDIA_KIND.image,
			"where[processingStatus][equals]": MEDIA_STATUS.ready,
		},
	});
	expect(media.ok()).toBe(true);
	const data: unknown = await media.json();
	if (
		typeof data !== "object" ||
		data === null ||
		!("docs" in data) ||
		!Array.isArray(data.docs)
	) {
		throw new Error("Missing seeded media");
	}
	const asset = documentID(data.docs[0]);
	const result = await request.post(PROJECT_API, {
		data: {
			title: LAYOUT_PROJECT.title,
			slug: LAYOUT_PROJECT.slug,
			_status: PUBLICATION.published,
			summary: LAYOUT_PROJECT.caption,
			task: "Спроектировать и изготовить оснастку для серийного выпуска деталей.",
			solution:
				"Подготовили конструкторскую документацию, изготовили оборудование и провели испытания.",
			result: "Линия подготовлена к серийному производству.",
			featuredImage: asset,
			gallery: [{ asset, caption: LAYOUT_PROJECT.caption }],
		},
	});
	expect(result.ok(), await result.text()).toBe(true);
	const created: unknown = await result.json();
	if (typeof created !== "object" || created === null || !("doc" in created)) {
		throw new Error("Missing project response");
	}
	return documentID(created.doc);
}

export async function deleteLayoutProject(
	request: APIRequestContext,
	id: number,
) {
	await login(request, "owner");
	expect((await request.delete(`${PROJECT_API}/${id}`)).ok()).toBe(true);
}

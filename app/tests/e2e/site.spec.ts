import { expect, test } from "@playwright/test";
import { login } from "./support/auth";
import { E2E_ORIGIN as origin } from "./support/config";

test("public facade, responsive navigation and protected admin", async ({
	page,
	request,
}) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		"Прямые поставки из Китая",
	);
	await expect(
		page.getByRole("link", { name: "Контакты проекты", exact: true }),
	).toHaveCount(0);
	for (const width of [320, 390, 768, 820, 1024, 1440, 1920]) {
		await page.setViewportSize({ width, height: 900 });
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
	}
	await page.setViewportSize({ width: 390, height: 844 });
	await page.getByRole("button", { name: "Открыть меню" }).click();
	await expect(page.getByRole("dialog")).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await expect(
		page.getByRole("button", { name: "Открыть меню" }),
	).toBeFocused();
	await page.getByRole("button", { name: "Открыть поиск" }).click();
	await page.getByRole("searchbox").fill("Пресс");
	await page.getByRole("button", { name: "Найти", exact: true }).click();
	await expect(
		page.getByRole("link", { name: "Пресс-формы", exact: true }),
	).toBeVisible();
	for (const path of [
		"/about",
		"/products",
		"/services",
		"/projects",
		"/contacts",
		"/services/molds",
	]) {
		await page.goto(path);
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(
			"Страница не найдена",
		);
	}
	const removed = await request.get("/kontaktyi.html", { maxRedirects: 0 });
	expect(removed.headers().location).toBeUndefined();
	expect(await removed.text()).toContain("Страница не найдена");
	expect((await request.get("/api/users")).status()).toBe(403);
	expect((await request.get("/api/leads")).status()).toBe(403);
	expect((await request.get("/api/pages?draft=true")).status()).toBe(403);
	expect(
		(await request.get("/api/globals/site-settings?draft=true")).status(),
	).toBe(403);
	expect((await request.get("/sitemap.xml")).ok()).toBe(true);
});

test("manager saves drafts, previews and explicitly publishes; cannot escalate role", async ({
	page,
	request,
	playwright,
}) => {
	const user = await login(request);
	await login(page.request);
	await page.context().setExtraHTTPHeaders({});
	await page.goto("/admin");
	await expect(
		page.getByRole("heading", { name: "Управление сайтом", exact: true }),
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: "Добавить продукцию", exact: true }),
	).toHaveAttribute("href", "/admin/collections/products/create");
	await expect(
		page.getByRole("link", { name: /^Новых заявок:/ }),
	).toBeVisible();
	const guest = await playwright.request.newContext({ baseURL: origin });
	try {
		const created = await request.post("/api/pages?draft=true", {
			data: {
				title: "Проверка черновика",
				kind: "content",
				heading: "Черновой заголовок",
				_status: "draft",
				blocks: [],
			},
		});
		expect(created.status()).toBe(201);
		const { doc } = await created.json();
		expect(doc.slug).toMatch(/^item-[a-f\d-]+$/);
		expect((await guest.get(`/api/pages/${doc.id}?draft=true`)).status()).toBe(
			403,
		);
		await page.goto(`/admin/collections/pages/${doc.id}`);
		await expect(page.getByRole("textbox", { name: /^Название/ })).toHaveValue(
			"Проверка черновика",
		);
		await page
			.getByLabel("Заголовок на сайте", { exact: true })
			.fill("Проверен менеджером");
		await page.getByRole("button", { name: /Сохранить черновик/ }).click();
		await expect
			.poll(async () =>
				(await request.get(`/api/pages/${doc.id}?draft=true`))
					.json()
					.then((data) => data.heading),
			)
			.toBe("Проверен менеджером");
		const publicBefore = await guest.get(`/api/pages/${doc.id}`);
		expect(publicBefore.status()).toBe(404);
		await page.goto(`/preview?collection=pages&id=${doc.id}`);
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			"Проверен менеджером",
		);
		await expect(
			page.getByText("Предпросмотр", { exact: false }).first(),
		).toBeVisible();
		await page.goto("/api/preview/exit");
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			"Прямые поставки из Китая",
		);
		const publish = await request.patch(`/api/pages/${doc.id}`, {
			data: { _status: "published" },
		});
		expect(publish.ok()).toBe(true);
		await expect
			.poll(async () =>
				(await guest.get(`/api/pages/${doc.id}`))
					.json()
					.then((data) => data.heading),
			)
			.toBe("Проверен менеджером");
		await request.patch(`/api/pages/${doc.id}?draft=true`, {
			data: { heading: "Следующий черновик", _status: "draft" },
		});
		expect(
			(await (await guest.get(`/api/pages/${doc.id}`)).json()).heading,
		).toBe("Проверен менеджером");
		await request.patch(`/api/users/${user.id}`, { data: { role: "owner" } });
		expect((await (await request.get("/api/users/me")).json()).user.role).toBe(
			"manager",
		);
		expect((await request.get("/api/globals/service-settings")).status()).toBe(
			403,
		);
		expect(
			(
				await request.post("/api/users", {
					data: {
						email: "intruder@example.test",
						password: "this-is-not-allowed",
						role: "owner",
					},
				})
			).status(),
		).toBe(403);
	} finally {
		await guest.dispose();
	}
});

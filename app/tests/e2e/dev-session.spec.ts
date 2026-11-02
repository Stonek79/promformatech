import { expect, test } from "@playwright/test";
import { E2E_ORIGIN } from "./support/config";

test("manager stays signed in when a LAN HTTP navigation has no Origin or fetch metadata", async () => {
	const login = await fetch(`${E2E_ORIGIN}/api/users/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Origin: E2E_ORIGIN },
		body: JSON.stringify({
			email: "manager@example.test",
			password: process.env.TEST_PASSWORD,
		}),
	});
	expect(login.status).toBe(200);
	const loginResult = await login.json();
	const cookie = login.headers
		.getSetCookie()
		.map((value) => value.split(";")[0])
		.join("; ");
	expect(cookie).not.toBe("");
	const response = await fetch(`${E2E_ORIGIN}/api/users/me`, {
		headers: { Cookie: cookie },
	});
	expect(response.status).toBe(200);
	const result = await response.json();
	expect(result.user?.role).toBe("manager");
	const admin = await fetch(`${E2E_ORIGIN}/admin`, {
		headers: { Cookie: cookie },
		redirect: "manual",
	});
	expect(admin.status).toBe(200);
	expect(await admin.text()).toContain("Управление сайтом");

	const foreign = await fetch(`${E2E_ORIGIN}/api/users/me`, {
		headers: { Cookie: cookie, Origin: "https://untrusted.example" },
	});
	expect((await foreign.json()).user).toBeNull();

	const unsafe = await fetch(`${E2E_ORIGIN}/api/users/${loginResult.user.id}`, {
		method: "PATCH",
		headers: { Cookie: cookie, "Content-Type": "application/json" },
		body: JSON.stringify({ name: "unauthorized" }),
	});
	expect(unsafe.status).toBe(403);
});

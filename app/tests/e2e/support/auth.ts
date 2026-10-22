import { type APIRequestContext, expect } from "@playwright/test";

const LOGIN_PATH = "/api/users/login";
type Role = "manager" | "owner";
const DEFAULT_ROLE: Role = "manager";

export async function login(
	request: APIRequestContext,
	role: Role = DEFAULT_ROLE,
) {
	const response = await request.post(LOGIN_PATH, {
		data: {
			email: `${role}@example.test`,
			password: process.env.TEST_PASSWORD,
		},
	});
	expect(response.ok()).toBe(true);
	const data: unknown = await response.json();
	if (data && typeof data === "object" && "user" in data) {
		const user = data.user;
		if (
			user &&
			typeof user === "object" &&
			"id" in user &&
			typeof user.id === "number" &&
			"role" in user &&
			user.role === role
		) {
			return { id: user.id, role: user.role };
		}
	}
	throw new Error("Invalid test user login response");
}

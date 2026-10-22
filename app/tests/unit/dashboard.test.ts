import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Dashboard } from "@/cms/components/Dashboard";
import { COLLECTIONS, ROLES } from "@/config/content";

describe("admin dashboard server props", () => {
	it.each([ROLES.owner, ROLES.manager])(
		"renders for %s using Payload's component props and access checks",
		async (role) => {
			const user = { id: 1, role };
			const payload = {
				find: vi.fn().mockResolvedValue({ docs: [{ id: 42 }] }),
				count: vi.fn().mockResolvedValue({ totalDocs: 3 }),
			};
			const component = await Reflect.apply(Dashboard, undefined, [
				{ payload, user },
			]);
			const html = renderToStaticMarkup(component);

			expect(html).toContain("Управление сайтом");
			expect(html).toContain("/admin/collections/pages/42");
			expect(html).toContain("Новых заявок: 3");
			expect(payload.find).toHaveBeenCalledWith(
				expect.objectContaining({
					collection: COLLECTIONS.pages,
					draft: true,
					overrideAccess: false,
					user,
				}),
			);
			expect(payload.count).toHaveBeenCalledTimes(2);
			for (const [options] of payload.count.mock.calls) {
				expect(options).toEqual(
					expect.objectContaining({ overrideAccess: false, user }),
				);
			}
		},
	);

	it("does not query content without a staff user", async () => {
		const payload = { find: vi.fn(), count: vi.fn() };
		const component = await Reflect.apply(Dashboard, undefined, [{ payload }]);

		expect(component).toBeNull();
		expect(payload.find).not.toHaveBeenCalled();
		expect(payload.count).not.toHaveBeenCalled();
	});
});

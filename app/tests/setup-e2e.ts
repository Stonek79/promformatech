import { getCMS } from "@/cms/client";
import { seedSite } from "@/cms/seed/run";
import {
	COLLECTIONS,
	CONTEXT,
	PAGE_SLUGS,
	PUBLICATION,
	ROLES,
} from "@/config/content";

if (
	!process.env.DATABASE_URL?.endsWith("/promformatech_e2e.sqlite") ||
	!process.env.TEST_PASSWORD
) {
	throw new Error("E2E setup requires an isolated test database and password");
}
const cms = await getCMS();
try {
	await seedSite(cms);
	const retiredPage = await cms.create({
		collection: COLLECTIONS.pages,
		data: {
			title: "Политика обработки данных",
			slug: "retired-policy-fixture",
			kind: "content",
			_status: PUBLICATION.published,
			blocks: [],
		},
		overrideAccess: true,
	});
	// Simulate a policy that was already published before the feature was removed.
	await cms.db.updateOne({
		collection: COLLECTIONS.pages,
		id: retiredPage.id,
		data: { slug: PAGE_SLUGS.privacy },
	});
	for (const role of [ROLES.owner, ROLES.manager]) {
		await cms.create({
			collection: COLLECTIONS.users,
			data: {
				email: `${role}@example.test`,
				password: process.env.TEST_PASSWORD,
				role,
			},
			overrideAccess: true,
			context: { [CONTEXT.bootstrap]: true },
		});
	}
} finally {
	await cms.destroy();
}

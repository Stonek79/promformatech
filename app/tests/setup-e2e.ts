import { randomUUID } from "node:crypto";
import { getCMS } from "@/cms/client";
import { seedSite } from "@/cms/seed/run";
import { COLLECTIONS, CONTEXT, ROLES } from "@/config/content";
import { JOBS } from "@/config/media";

if (
	new URL(process.env.DATABASE_URL || "").pathname !== "/promformatech_e2e" ||
	!process.env.TEST_PASSWORD
) {
	throw new Error("E2E setup requires an isolated test database and password");
}
const cms = await getCMS();
try {
	await seedSite(cms);
	const lead = await cms.create({
		collection: COLLECTIONS.leads,
		data: {
			name: "Worker recovery",
			contact: "worker-recovery@example.test",
			consent: true,
			requestID: randomUUID(),
		},
		overrideAccess: true,
	});
	const pending = await cms.find({
		collection: "payload-jobs",
		where: {
			and: [
				{ taskSlug: { equals: JOBS.notifyLead } },
				{ "input.leadID": { equals: lead.id } },
			],
		},
		depth: 0,
		overrideAccess: true,
	});
	if (!pending.docs[0]) {
		throw new Error("Recovery fixture job was not queued");
	}
	await cms.update({
		collection: "payload-jobs",
		id: pending.docs[0].id,
		data: { processing: true },
		overrideAccess: true,
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

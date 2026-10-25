import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getCMS } from "@/cms/client";
import { COLLECTIONS, PAGE_KINDS, PUBLICATION, ROLES } from "@/config/content";
import { MEDIA_STATUS } from "@/config/media";

if (
	!new URL(process.env.DATABASE_URL || "").pathname.startsWith(
		"/promformatech_verification_target_",
	)
) {
	throw new Error("Verification requires an isolated target database");
}
const fixture: unknown = JSON.parse(
	await readFile(process.env.TEST_FIXTURE_FILE || "", "utf8"),
);
assert(fixture && typeof fixture === "object");
assert("homeID" in fixture && typeof fixture.homeID === "number");
assert("mediaID" in fixture && typeof fixture.mediaID === "number");
assert("leadID" in fixture && typeof fixture.leadID === "number");
assert("interruptedID" in fixture && typeof fixture.interruptedID === "number");
assert("derivative" in fixture && typeof fixture.derivative === "string");
const cms = await getCMS();
try {
	const login = await cms.login({
		collection: COLLECTIONS.users,
		data: {
			email: "owner@example.test",
			password: process.env.TEST_PASSWORD || "",
		},
	});
	assert(login.user);
	assert.equal(login.user.role, ROLES.owner);
	const published = await cms.findByID({
		collection: COLLECTIONS.pages,
		id: fixture.homeID,
		draft: false,
		overrideAccess: true,
	});
	const draft = await cms.findByID({
		collection: COLLECTIONS.pages,
		id: fixture.homeID,
		draft: true,
		overrideAccess: true,
	});
	assert.notEqual(published.title, draft.title);
	assert.equal(draft.title, "Isolated draft for migration rehearsal");
	const versions = await cms.findVersions({
		collection: COLLECTIONS.pages,
		where: { parent: { equals: fixture.homeID } },
		overrideAccess: true,
	});
	assert(versions.totalDocs > 1);
	const media = await cms.findByID({
		collection: COLLECTIONS.media,
		id: fixture.mediaID,
		draft: true,
		overrideAccess: true,
	});
	assert.equal(media.processingStatus, MEDIA_STATUS.ready);
	assert(media.derivativeKey);
	const interrupted = await cms.findByID({
		collection: COLLECTIONS.media,
		id: fixture.interruptedID,
		draft: true,
		overrideAccess: true,
	});
	assert.equal(interrupted.processingStatus, MEDIA_STATUS.ready);
	assert.equal(interrupted.derivativeKey, fixture.derivative);
	const lead = await cms.findByID({
		collection: COLLECTIONS.leads,
		id: fixture.leadID,
		overrideAccess: true,
	});
	assert.equal(lead.contact, "fixture@example.test");
	const maximum = (
		await cms.find({
			collection: COLLECTIONS.pages,
			sort: "-id",
			limit: 1,
			overrideAccess: true,
		})
	).docs[0].id;
	const next = await cms.create({
		collection: COLLECTIONS.pages,
		draft: true,
		data: {
			title: "Sequence check",
			slug: "sequence-check",
			kind: PAGE_KINDS.content,
			_status: PUBLICATION.draft,
		},
		overrideAccess: true,
	});
	assert(next.id > maximum);
	console.log(
		"Imported owner login, versions, publication isolation, queue and next IDs verified",
	);
} finally {
	await cms.destroy();
}

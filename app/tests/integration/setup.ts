import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import sharp from "sharp";
import { getCMS } from "@/cms/client";
import { seedSite } from "@/cms/seed/run";
import {
	COLLECTIONS,
	CONTEXT,
	ROLES,
	SYSTEM_COLLECTIONS,
} from "@/config/content";
import { JOBS } from "@/config/jobs";
import { MEDIA_STATUS } from "@/config/media";
import { processImage } from "@/features/media/process-image";
import { writeProcessingReceipt } from "@/features/media/processing-receipt";
import {
	commitDerivatives,
	processingDirectory,
	storagePaths,
} from "@/features/media/storage";

const DATABASE_PREFIX = "/promformatech_verification_source_";
if (
	!new URL(process.env.DATABASE_URL || "").pathname.startsWith(DATABASE_PREFIX)
) {
	throw new Error(
		"Integration setup requires an isolated verification database",
	);
}
const cms = await getCMS();
try {
	await seedSite(cms);
	await cms.create({
		collection: COLLECTIONS.users,
		data: {
			email: "owner@example.test",
			password: process.env.TEST_PASSWORD || "",
			role: ROLES.owner,
		},
		overrideAccess: true,
		context: { [CONTEXT.bootstrap]: true },
	});
	const home = (
		await cms.find({
			collection: COLLECTIONS.pages,
			where: { slug: { equals: "home" } },
			limit: 1,
		})
	).docs[0];
	await cms.update({
		collection: COLLECTIONS.pages,
		id: home.id,
		draft: true,
		data: { title: "Isolated draft for migration rehearsal" },
		overrideAccess: true,
	});
	const image = await sharp({
		create: { width: 64, height: 32, channels: 3, background: "#336699" },
	})
		.png()
		.toBuffer();
	const media = await cms.create({
		collection: COLLECTIONS.media,
		data: { title: "Queued integration image", alt: "Integration image" },
		file: {
			data: image,
			name: "fixture.png",
			mimetype: "image/png",
			size: image.length,
		},
		overrideAccess: true,
	});
	const lead = await cms.create({
		collection: COLLECTIONS.leads,
		data: {
			name: "Migration rehearsal",
			contact: "fixture@example.test",
			consent: true,
			requestID: randomUUID(),
		},
		overrideAccess: true,
	});
	const interrupted = await cms.create({
		collection: COLLECTIONS.media,
		data: { title: "Committed derivative before crash" },
		file: {
			data: image,
			name: "interrupted.png",
			mimetype: "image/png",
			size: image.length,
		},
		overrideAccess: true,
	});
	assertStorageKey(interrupted.storageKey);
	const staging = await processingDirectory(interrupted.storageKey);
	const details = await processImage(
		storagePaths(interrupted.storageKey).original,
		staging,
	);
	await writeProcessingReceipt(staging, details);
	const derivative = await commitDerivatives(interrupted.storageKey, staging);
	await cms.update({
		collection: COLLECTIONS.media,
		id: interrupted.id,
		draft: true,
		data: { processingStatus: MEDIA_STATUS.processing },
		overrideAccess: true,
	});
	const job = (
		await cms.find({
			collection: SYSTEM_COLLECTIONS.jobs,
			where: {
				and: [
					{ taskSlug: { equals: JOBS.processMedia } },
					{ "input.mediaID": { equals: interrupted.id } },
				],
			},
			overrideAccess: true,
		})
	).docs[0];
	await cms.update({
		collection: SYSTEM_COLLECTIONS.jobs,
		id: job.id,
		data: { processing: true },
		overrideAccess: true,
	});
	await writeFile(
		process.env.TEST_FIXTURE_FILE || "",
		JSON.stringify({
			homeID: home.id,
			mediaID: media.id,
			leadID: lead.id,
			interruptedID: interrupted.id,
			derivative,
		}),
		{ mode: 0o600 },
	);
} finally {
	await cms.destroy();
}

function assertStorageKey(value: unknown): asserts value is string {
	if (typeof value !== "string") {
		throw new Error("Missing fixture storage key");
	}
}

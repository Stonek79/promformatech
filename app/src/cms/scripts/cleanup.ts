import type { Where } from "payload";
import { getCMS } from "@/cms/client";
import { COLLECTIONS, GLOBALS } from "@/config/content";
import { LEAD_STATUS } from "@/config/forms";
import { TIME_UNITS } from "@/config/units";

const DEFAULT_RETENTION_DAYS = 90;
const cms = await getCMS();
try {
	const settings = await cms.findGlobal({
		slug: GLOBALS.service,
		overrideAccess: true,
	});
	const cutoff = new Date(
		Date.now() -
			(settings.retentionDays || DEFAULT_RETENTION_DAYS) *
				TIME_UNITS.millisecondsPerDay,
	).toISOString();
	const where: Where = {
		and: [
			{ status: { in: [LEAD_STATUS.closed, LEAD_STATUS.spam] } },
			{ updatedAt: { less_than: cutoff } },
		],
	};
	const { totalDocs } = await cms.count({
		collection: COLLECTIONS.leads,
		where,
		overrideAccess: true,
	});
	if (process.argv.includes("apply")) {
		await cms.delete({
			collection: COLLECTIONS.leads,
			where,
			overrideAccess: true,
		});
		await cms.delete({
			collection: COLLECTIONS.rateLimits,
			where: { resetAt: { less_than: new Date().toISOString() } },
			overrideAccess: true,
		});
		cms.logger.info(
			`Очистка завершена. Удалено закрытых заявок и спама: ${totalDocs}.`,
		);
	} else {
		cms.logger.info(
			`Будет удалено закрытых заявок и спама: ${totalDocs}. Для выполнения: pnpm cms:cleanup apply.`,
		);
	}
} finally {
	await cms.destroy();
}

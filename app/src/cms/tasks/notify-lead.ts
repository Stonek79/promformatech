import type { TaskConfig } from "payload";
import { COLLECTIONS, GLOBALS } from "@/config/content";
import { NOTIFICATION_STATUS } from "@/config/forms";
import { JOBS } from "@/config/jobs";
import { serverURL } from "@/lib/urls";
import { smtpConfigured } from "../email";

export const notifyLeadTask: TaskConfig<{
	input: { leadID: number };
	output: { success: boolean };
}> = {
	slug: JOBS.notifyLead,
	label: "Уведомление о заявке",
	retries: 0,
	concurrency: ({ input }) => `${JOBS.notifyLead}-${input.leadID}`,
	inputSchema: [{ name: "leadID", type: "number", required: true }],
	outputSchema: [{ name: "success", type: "checkbox" }],
	handler: async ({ input, req }) => {
		const cms = req.payload;
		const lead = await cms.findByID({
			collection: COLLECTIONS.leads,
			id: input.leadID,
			overrideAccess: true,
		});
		if (lead.notificationStatus === NOTIFICATION_STATUS.sent) {
			return { output: { success: true } };
		}
		const settings = await cms.findGlobal({
			slug: GLOBALS.service,
			overrideAccess: true,
		});
		const recipients =
			settings.recipients?.map((item) => item.email).filter(Boolean) || [];
		if (!smtpConfigured() || recipients.length === 0) {
			await cms.update({
				collection: COLLECTIONS.leads,
				id: lead.id,
				data: { notificationStatus: NOTIFICATION_STATUS.unconfigured },
				overrideAccess: true,
			});
			return { output: { success: false } };
		}
		try {
			await cms.sendEmail({
				to: recipients,
				subject: "Новое обращение с сайта",
				text: [
					`Имя: ${lead.name}`,
					`Контакт: ${lead.contact}`,
					lead.message || "",
					`Страница: ${lead.sourcePath}`,
					`Заявка: ${serverURL()}/admin/collections/leads/${lead.id}`,
				].join("\n\n"),
			});
			await cms.update({
				collection: COLLECTIONS.leads,
				id: lead.id,
				data: { notificationStatus: NOTIFICATION_STATUS.sent },
				overrideAccess: true,
			});
			return { output: { success: true } };
		} catch {
			await cms.update({
				collection: COLLECTIONS.leads,
				id: lead.id,
				data: { notificationStatus: NOTIFICATION_STATUS.failed },
				overrideAccess: true,
			});
			return { output: { success: false } };
		}
	},
};

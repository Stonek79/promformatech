import type { ServerProps, Where } from "payload";
import { adminCollectionURL, adminGlobalURL, CMS_ACTIONS } from "@/config/cms";
import { COLLECTIONS, GLOBALS, PAGE_SLUGS, ROUTES } from "@/config/content";
import { ADMIN_HELP, adminHelpURL } from "@/config/help";
import { MEDIA_STATUS } from "@/config/media";
import { getMessages } from "@/i18n/messages";
import { isStaff } from "../access";
import styles from "./admin.module.css";

export type DashboardProps = Readonly<Pick<ServerProps, "payload" | "user">>;

const mediaList = adminCollectionURL(COLLECTIONS.media);
const pendingStatuses = [MEDIA_STATUS.queued, MEDIA_STATUS.processing];
const messages = getMessages().cms.dashboard;

function filteredMediaURL(statuses: readonly string[]) {
	const query = new URLSearchParams();
	for (const [index, status] of statuses.entries()) {
		query.set(`where[or][${index}][processingStatus][equals]`, status);
	}
	return `${mediaList}?${query}`;
}

export async function Dashboard({ payload, user }: DashboardProps) {
	if (!isStaff(user)) {
		return null;
	}
	const countFiles = (where: Where) =>
		payload.find({
			collection: COLLECTIONS.media,
			where,
			draft: true,
			depth: 0,
			limit: 1,
			select: { processingStatus: true },
			overrideAccess: false,
			user,
		});
	const [home, pending, failed] = await Promise.all([
		payload.find({
			collection: COLLECTIONS.pages,
			where: { slug: { equals: PAGE_SLUGS.home } },
			limit: 1,
			depth: 0,
			draft: true,
			overrideAccess: false,
			user,
		}),
		countFiles({ processingStatus: { in: pendingStatuses } }),
		countFiles({ processingStatus: { equals: MEDIA_STATUS.error } }),
	]);
	const homeID = home.docs[0]?.id;
	return (
		<section className={styles.dashboard}>
			<h1>Управление сайтом</h1>
			<p>
				Первый раз здесь? <a href={adminHelpURL()}>{ADMIN_HELP.title}</a> —
				пошаговые инструкции по всем разделам.
			</p>
			<p>
				Измените материал, сохраните черновик и проверьте его перед публикацией.
			</p>
			<nav className={styles.actions} aria-label="Быстрые действия">
				<a href={adminCollectionURL(COLLECTIONS.products, CMS_ACTIONS.create)}>
					Добавить продукцию
				</a>
				<a href={adminCollectionURL(COLLECTIONS.projects, CMS_ACTIONS.create)}>
					Добавить проект
				</a>
				<a
					href={
						homeID
							? adminCollectionURL(COLLECTIONS.pages, homeID)
							: adminCollectionURL(COLLECTIONS.pages, CMS_ACTIONS.create)
					}
				>
					Изменить главную
				</a>
				<a href={adminGlobalURL(GLOBALS.site)}>Общие данные сайта</a>
				<a href={mediaList}>{messages.media}</a>
				<a href={ROUTES.home} target="_blank" rel="noreferrer">
					Открыть сайт ↗
				</a>
			</nav>
			{(pending.totalDocs > 0 || failed.totalDocs > 0) && (
				<ul className={styles.mediaStatus}>
					{pending.totalDocs > 0 && (
						<li>
							<a href={filteredMediaURL(pendingStatuses)}>
								{messages.processing(pending.totalDocs)}
							</a>
						</li>
					)}
					{failed.totalDocs > 0 && (
						<li>
							<a href={filteredMediaURL([MEDIA_STATUS.error])}>
								{messages.failed(failed.totalDocs)}
							</a>
						</li>
					)}
				</ul>
			)}
		</section>
	);
}

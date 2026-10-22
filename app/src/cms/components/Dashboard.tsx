import type { ServerProps } from "payload";
import { adminCollectionURL, adminGlobalURL, CMS_ACTIONS } from "@/config/cms";
import { COLLECTIONS, GLOBALS, PAGE_SLUGS, ROUTES } from "@/config/content";
import { LEAD_STATUS } from "@/config/forms";
import { ADMIN_HELP, adminHelpURL } from "@/config/help";
import { MEDIA_STATUS } from "@/config/media";
import { isStaff } from "../access";
import styles from "./admin.module.css";

type DashboardProps = Readonly<Pick<ServerProps, "payload" | "user">>;

export async function Dashboard({ payload, user }: DashboardProps) {
	if (!isStaff(user)) {
		return null;
	}
	const [home, leads, media] = await Promise.all([
		payload.find({
			collection: COLLECTIONS.pages,
			where: { slug: { equals: PAGE_SLUGS.home } },
			limit: 1,
			depth: 0,
			draft: true,
			overrideAccess: false,
			user,
		}),
		payload.count({
			collection: COLLECTIONS.leads,
			where: { status: { equals: LEAD_STATUS.fresh } },
			overrideAccess: false,
			user,
		}),
		payload.count({
			collection: COLLECTIONS.media,
			where: {
				processingStatus: {
					in: [
						MEDIA_STATUS.queued,
						MEDIA_STATUS.processing,
						MEDIA_STATUS.error,
					],
				},
			},
			overrideAccess: false,
			user,
		}),
	]);
	const homeID = home.docs[0]?.id;
	return (
		<section className={styles.dashboard}>
			<h2>Управление сайтом</h2>
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
				<a href={ROUTES.home} target="_blank" rel="noreferrer">
					Открыть сайт ↗
				</a>
			</nav>
			<div className={styles.actions}>
				<a href={adminCollectionURL(COLLECTIONS.leads)}>
					Новых заявок: {leads.totalDocs}
				</a>
				<a href={adminCollectionURL(COLLECTIONS.media)}>
					Файлов в обработке или с ошибкой: {media.totalDocs}
				</a>
			</div>
		</section>
	);
}

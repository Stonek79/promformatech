import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { redirect } from "next/navigation";
import type { AdminViewServerProps } from "payload";
import { CMS_PATHS } from "@/config/cms";
import { isStaff } from "../access";
import { HelpContent } from "./HelpContent";

type HelpViewProps = Readonly<
	Pick<
		AdminViewServerProps,
		"initPageResult" | "params" | "searchParams" | "user"
	>
>;

export function HelpView({
	initPageResult,
	params,
	searchParams,
	user,
}: HelpViewProps) {
	const { req, locale, permissions, visibleEntities } = initPageResult;
	if (!isStaff(req.user)) {
		redirect(CMS_PATHS.login);
	}
	return (
		<DefaultTemplate
			i18n={req.i18n}
			locale={locale}
			params={params}
			payload={req.payload}
			permissions={permissions}
			req={req}
			searchParams={searchParams}
			user={user}
			visibleEntities={visibleEntities}
		>
			<Gutter>
				<HelpContent />
			</Gutter>
		</DefaultTemplate>
	);
}

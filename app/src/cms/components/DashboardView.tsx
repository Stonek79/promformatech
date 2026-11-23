import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getMessages } from "@/i18n/messages";
import { Dashboard, type DashboardProps } from "./Dashboard";

export function DashboardView({ payload, user }: DashboardProps) {
	return (
		<Gutter>
			<SetStepNav nav={[{ label: getMessages().cms.dashboard.panel }]} />
			<Dashboard payload={payload} user={user} />
		</Gutter>
	);
}

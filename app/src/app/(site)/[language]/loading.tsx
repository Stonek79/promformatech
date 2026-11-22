import { PageSkeleton } from "@/components/site/PageSkeleton/PageSkeleton";
import { getSiteLocale } from "@/i18n/site-server";

export default async function Loading() {
	return <PageSkeleton locale={await getSiteLocale()} />;
}

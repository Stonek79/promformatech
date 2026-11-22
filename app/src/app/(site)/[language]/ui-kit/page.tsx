import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isStaff } from "@/cms/access";
import { getCMS } from "@/cms/client";
import { UIKit } from "@/components/ui/UIKit";

export const metadata = {
	title: "UI kit",
	robots: { index: false, follow: false },
};

export default async function UIKitPage() {
	if (process.env.NODE_ENV === "production") {
		notFound();
	}
	const { user } = await (await getCMS()).auth({ headers: await headers() });
	if (!isStaff(user)) {
		notFound();
	}
	return <UIKit />;
}

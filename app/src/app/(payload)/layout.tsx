import config from "@payload-config";
import "@payloadcms/next/css";
import "@/design-system/generated/tokens.css";
import "@/cms/admin-bridge.css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import { cookies } from "next/headers";
import type { ServerFunctionClient } from "payload";
import type { ReactNode } from "react";
import { APPEARANCE, parseTextSize } from "@/config/appearance";
import { importMap } from "./admin/importMap";

const serverFunction: ServerFunctionClient = async (args) => {
	"use server";
	return handleServerFunctions({ ...args, config, importMap });
};

export default async function PayloadLayout({
	children,
}: {
	readonly children: ReactNode;
}) {
	const size = parseTextSize(
		(await cookies()).get(APPEARANCE.adminSizeCookie)?.value,
	);
	const htmlProps = { "data-text-size": size, className: "pf-admin" };
	return (
		<RootLayout
			htmlProps={htmlProps}
			config={config}
			importMap={importMap}
			serverFunction={serverFunction}
		>
			{children}
		</RootLayout>
	);
}

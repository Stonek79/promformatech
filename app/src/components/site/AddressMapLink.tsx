import type { Locale } from "@/i18n/config";

export function AddressMapLink({
	address,
	href,
	locale,
	className,
}: {
	readonly address: string;
	readonly href: string;
	readonly locale: Locale;
	readonly className?: string;
}) {
	return (
		<a
			href={href}
			className={className}
			lang={locale}
			target="_blank"
			rel="noopener noreferrer"
		>
			{address}
		</a>
	);
}

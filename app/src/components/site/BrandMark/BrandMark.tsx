import { MediaImage } from "@/features/media/MediaView";
import { isReadyImage, mediaView } from "@/features/media/view-model";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/config";
import { siteBrandName } from "@/i18n/site-copy";
import type { Media } from "@/payload-types";

type Props = {
	readonly company: string;
	readonly logo: Media | number | null | undefined;
	readonly locale: Locale;
	readonly sizes: string;
	readonly priority?: boolean;
	readonly className?: string;
};

export function BrandMark({
	company,
	logo,
	locale,
	sizes,
	priority,
	className,
}: Props) {
	const name = siteBrandName(company, locale);
	const localized = name !== company;
	const asset = mediaView(logo);
	if (!localized && isReadyImage(asset)) {
		return (
			<MediaImage sizes={sizes} asset={asset} alt={name} priority={priority} />
		);
	}
	return (
		<span className={className} lang={localized ? LOCALES.en : DEFAULT_LOCALE}>
			{name}
		</span>
	);
}

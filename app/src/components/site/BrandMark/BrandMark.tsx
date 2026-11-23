import { IMAGE_SIZES } from "@/config/image";
import { MediaImage } from "@/features/media/MediaView";
import { isReadyImage, mediaView } from "@/features/media/view-model";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { siteBrandName } from "@/i18n/site-copy";
import { classes } from "@/lib/classes";
import type { Media } from "@/payload-types";
import styles from "./BrandMark.module.css";

type Props = {
	readonly company: string;
	readonly logo: Media | number | null | undefined;
	readonly fallbackLogo?: Media | number | null;
	readonly locale: Locale;
	readonly priority?: boolean;
};

export function BrandMark({
	company,
	logo,
	fallbackLogo,
	locale,
	priority,
}: Props) {
	const name = siteBrandName(company, locale);
	const localized = name !== company;
	const { brand, brandPrefix } = getMessages(locale).common;
	const stock = company === getMessages().common.brand;
	const primary = mediaView(logo);
	const hasPrimary = isReadyImage(primary);
	const asset = hasPrimary ? primary : mediaView(fallbackLogo);
	if (!localized && isReadyImage(asset)) {
		return (
			<MediaImage
				sizes={IMAGE_SIZES.headerLogo}
				asset={asset}
				alt={name}
				priority={priority}
				className={classes(styles.image, !hasPrimary && styles.inverse)}
			/>
		);
	}
	return (
		<span
			className={styles.wordmark}
			data-stock={stock || undefined}
			lang={localized ? LOCALES.en : DEFAULT_LOCALE}
		>
			{stock ? (
				<>
					<span className={styles.accent}>{brandPrefix}</span>
					{brand.slice(brandPrefix.length)}
				</>
			) : (
				name
			)}
		</span>
	);
}

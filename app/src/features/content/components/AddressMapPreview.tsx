import Image from "next/image";
import { Icon } from "@/components/ui/Icon/Icon";
import { MAP_ATTRIBUTION_LABEL, MAP_ATTRIBUTION_URL } from "@/config/maps";
import { MediaImage } from "@/features/media/MediaView";
import type { MediaView } from "@/features/media/view-model";
import { LOCALES, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import styles from "./Contacts.module.css";

export function AddressMapPreview({
	address,
	addressLanguage,
	href,
	locale,
	preview,
}: {
	readonly address: string;
	readonly addressLanguage: Locale;
	readonly href: string;
	readonly locale: Locale;
	readonly preview: string | MediaView;
}) {
	const { map } = getMessages(locale);

	return (
		<div className={styles.mapPreview}>
			<a
				className={styles.mapAction}
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				lang={locale}
				aria-label={map.openAddress(address)}
			>
				{typeof preview === "string" ? (
					<Image
						src={preview}
						alt=""
						className={styles.mapImage}
						fill
						loading="eager"
						unoptimized
					/>
				) : (
					<MediaImage asset={preview} alt="" className={styles.mapImage} />
				)}
				<span className={styles.mapBadge}>
					<Icon name="externalLink" />
				</span>
				<span
					className={styles.mapAddress}
					lang={addressLanguage}
					aria-hidden="true"
				>
					{address}
				</span>
			</a>
			{typeof preview === "string" && (
				<a
					className={styles.attribution}
					href={MAP_ATTRIBUTION_URL}
					lang={LOCALES.en}
				>
					{MAP_ATTRIBUTION_LABEL}
				</a>
			)}
		</div>
	);
}

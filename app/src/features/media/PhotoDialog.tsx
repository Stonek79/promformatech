"use client";

import {
	type CSSProperties,
	type ReactElement,
	useEffect,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/Button/Button";
import { Dialog } from "@/components/ui/Dialog/Dialog";
import { Icon } from "@/components/ui/Icon/Icon";
import { IMAGE_SIZES } from "@/config/image";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { useMessages } from "@/i18n/MessagesProvider";
import { MediaImage } from "./MediaView";
import styles from "./media.module.css";
import { isReadyImage, type MediaView } from "./view-model";

const ZOOM_CONTROL_IDLE = 2400;

export function PhotoDialog({
	asset,
	trigger,
	caption,
	captionLanguage = DEFAULT_LOCALE,
}: {
	readonly asset: MediaView;
	readonly trigger: ReactElement;
	readonly caption?: string | null;
	readonly captionLanguage?: Locale;
}) {
	const { media } = useMessages();
	const [zoomed, setZoomed] = useState(false);
	const [controlsVisible, setControlsVisible] = useState(false);
	const idle = useRef<number>(undefined);
	const zoomLabel = zoomed ? media.zoomOut : media.zoomIn;
	const photoSize = isReadyImage(asset)
		? ({ "--photo-ratio": asset.width / asset.height } as CSSProperties)
		: undefined;

	useEffect(() => () => window.clearTimeout(idle.current), []);

	function revealZoom() {
		window.clearTimeout(idle.current);
		setControlsVisible(true);
		idle.current = window.setTimeout(
			() => setControlsVisible(false),
			ZOOM_CONTROL_IDLE,
		);
	}

	return (
		<Dialog
			className={styles.photoDialog}
			viewportClassName={styles.photoDialogViewport}
			style={photoSize}
			title={asset.title}
			titleLanguage={DEFAULT_LOCALE}
			trigger={trigger}
			onOpenChange={(open) => {
				if (open) {
					revealZoom();
					return;
				}
				window.clearTimeout(idle.current);
				setControlsVisible(false);
				setZoomed(false);
			}}
		>
			<div
				className={styles.photoFrame}
				onPointerMove={revealZoom}
				onPointerDown={revealZoom}
			>
				<section
					aria-label={asset.title}
					tabIndex={zoomed ? 0 : undefined}
					className={styles.photoViewport}
					data-zoomed={zoomed}
				>
					<MediaImage asset={asset} sizes={IMAGE_SIZES.full} />
				</section>
				<Button
					variant="secondary"
					icon
					className={styles.zoomButton}
					data-visible={controlsVisible}
					aria-label={zoomLabel}
					title={zoomLabel}
					onFocus={revealZoom}
					onClick={() => setZoomed(!zoomed)}
				>
					<Icon name={zoomed ? "zoomOut" : "zoomIn"} />
				</Button>
			</div>
			{caption && (
				<p className={styles.photoCaption} lang={captionLanguage}>
					{caption}
				</p>
			)}
		</Dialog>
	);
}

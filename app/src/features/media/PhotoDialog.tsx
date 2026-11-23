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
import { PHOTO_ZOOM } from "@/config/media";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { useMessages } from "@/i18n/MessagesProvider";
import { MediaImage } from "./MediaView";
import styles from "./media.module.css";
import { usePhotoZoom } from "./usePhotoZoom";
import { isReadyImage, type MediaView } from "./view-model";

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
	const zoom = usePhotoZoom();
	const [controlsVisible, setControlsVisible] = useState(false);
	const idle = useRef<number>(undefined);
	const photoSize = isReadyImage(asset)
		? ({ "--photo-ratio": asset.width / asset.height } as CSSProperties)
		: undefined;

	useEffect(() => () => window.clearTimeout(idle.current), []);

	function revealZoom() {
		window.clearTimeout(idle.current);
		setControlsVisible(true);
		idle.current = window.setTimeout(
			() => setControlsVisible(false),
			PHOTO_ZOOM.controlIdleMs,
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
				zoom.reset();
			}}
		>
			<div
				className={styles.photoFrame}
				onPointerMove={revealZoom}
				onPointerDown={revealZoom}
			>
				<section
					ref={zoom.viewport}
					aria-label={asset.title}
					tabIndex={zoom.zoomed ? 0 : undefined}
					className={styles.photoViewport}
					data-zoomed={zoom.zoomed}
					data-dragging={zoom.dragging}
					onPointerDown={zoom.startDrag}
					onPointerMove={zoom.pan}
					onLostPointerCapture={zoom.stopDrag}
					onPointerCancel={zoom.stopDrag}
					onDragStart={(event) => event.preventDefault()}
				>
					<div className={styles.photoCanvas}>
						<MediaImage asset={asset} sizes={IMAGE_SIZES.full} />
					</div>
				</section>
				<div className={styles.zoomControls} data-visible={controlsVisible}>
					<Button
						variant="secondary"
						icon
						aria-label={media.zoomOut}
						title={media.zoomOut}
						disabled={!zoom.zoomed}
						onClick={zoom.decrease}
					>
						<Icon name="zoomOut" />
					</Button>
					<Button
						variant="secondary"
						aria-label={`${media.zoomReset} (${zoom.level}%)`}
						title={media.zoomReset}
						onClick={zoom.fit}
					>
						{zoom.level}%
					</Button>
					<Button
						variant="secondary"
						icon
						aria-label={media.zoomIn}
						title={media.zoomIn}
						disabled={zoom.maximum}
						onClick={zoom.increase}
					>
						<Icon name="zoomIn" />
					</Button>
				</div>
			</div>
			{caption && (
				<p className={styles.photoCaption} lang={captionLanguage}>
					{caption}
				</p>
			)}
		</Dialog>
	);
}

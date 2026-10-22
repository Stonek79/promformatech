"use client";

import Image, { type ImageLoaderProps } from "next/image";
import { MEDIA_DELIVERY, mediaURL } from "@/config/media";
import { derivativeURL } from "./image-loader";

type Props = {
	readonly id: number;
	readonly alt: string;
	readonly width: number;
	readonly height: number;
	readonly sizes: string;
	readonly priority?: boolean;
	readonly className?: string;
};

export function ResponsiveImage({ id, priority, ...props }: Props) {
	function loader({ width }: ImageLoaderProps) {
		return derivativeURL(id, width);
	}
	return (
		<Image
			{...props}
			src={mediaURL(id, MEDIA_DELIVERY.image)}
			loader={loader}
			loading={priority ? "eager" : "lazy"}
			fetchPriority={priority ? "high" : "auto"}
		/>
	);
}

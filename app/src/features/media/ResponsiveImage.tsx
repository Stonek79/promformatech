"use client";

import Image, { type ImageLoaderProps } from "next/image";
import { mediaURL } from "@/config/media";
import { MEDIA_DELIVERY } from "@/config/media-assets";
import { derivativeURL } from "./image-loader";

type Props = {
	readonly id: number;
	readonly alt: string;
	readonly width: number;
	readonly height: number;
	readonly sizes: string;
	readonly fill?: boolean;
	readonly cover?: boolean;
	readonly priority?: boolean;
	readonly eager?: boolean;
	readonly className?: string;
};

export function ResponsiveImage({
	id,
	priority,
	eager,
	fill,
	cover,
	width,
	height,
	...props
}: Props) {
	function loader({ width }: ImageLoaderProps) {
		return derivativeURL(id, width);
	}
	return (
		<Image
			{...props}
			{...(fill ? { fill } : { width, height })}
			style={cover ? { objectFit: "cover" } : undefined}
			src={mediaURL(id, MEDIA_DELIVERY.image)}
			loader={loader}
			loading={priority || eager ? "eager" : "lazy"}
			fetchPriority={priority ? "high" : "auto"}
		/>
	);
}

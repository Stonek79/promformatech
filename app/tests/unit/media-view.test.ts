import { describe, expect, it } from "vitest";
import { MEDIA_STATUS } from "../../src/config/media";
import { MEDIA_KIND } from "../../src/config/media-assets";
import {
	isReadyImage,
	isReadyVideo,
	type MediaView,
	mediaView,
} from "../../src/features/media/view-model";

const IMAGE = {
	id: 1,
	title: "Изделие",
	kind: MEDIA_KIND.image,
	processingStatus: MEDIA_STATUS.ready,
	width: 960,
	height: 640,
} satisfies MediaView;

describe("media presentation boundary", () => {
	it.each([null, undefined, IMAGE.id])(
		"does not expose an unresolved relationship %j",
		(value) => {
			expect(mediaView(value)).toBeNull();
		},
	);
	it.each([MEDIA_STATUS.queued, MEDIA_STATUS.processing, MEDIA_STATUS.error])(
		"does not render media in state %s",
		(processingStatus) => {
			expect(isReadyImage({ ...IMAGE, processingStatus })).toBe(false);
			expect(
				isReadyVideo({ ...IMAGE, kind: MEDIA_KIND.video, processingStatus }),
			).toBe(false);
		},
	);
	it.each([null, undefined, 0, Number.NaN])(
		"requires both image dimensions: %j",
		(dimension) => {
			expect(isReadyImage({ ...IMAGE, width: dimension })).toBe(false);
			expect(isReadyImage({ ...IMAGE, height: dimension })).toBe(false);
		},
	);
	it("keeps image and video renderers distinct", () => {
		const video = { ...IMAGE, kind: MEDIA_KIND.video };
		expect(isReadyImage(IMAGE)).toBe(true);
		expect(isReadyVideo(IMAGE)).toBe(false);
		expect(isReadyVideo(video)).toBe(true);
		expect(isReadyImage(video)).toBe(false);
	});
	it.each([null, undefined])("does not render absent media %j", (value) => {
		expect(isReadyImage(value)).toBe(false);
		expect(isReadyVideo(value)).toBe(false);
	});
});

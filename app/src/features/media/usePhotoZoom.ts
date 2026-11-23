"use client";

import { type PointerEvent, useEffect, useRef, useState } from "react";
import { APPEARANCE } from "@/config/appearance";
import { PHOTO_ZOOM } from "@/config/media";

const FIT = PHOTO_ZOOM.steps[0];
const PERCENT = 100;

type Drag = {
	readonly pointer: number;
	readonly x: number;
	readonly y: number;
	readonly left: number;
	readonly top: number;
};

export function usePhotoZoom() {
	const viewport = useRef<HTMLElement>(null);
	const frame = useRef(0);
	const scale = useRef(1);
	const drag = useRef<Drag>(null);
	const [step, setStep] = useState(0);
	const [dragging, setDragging] = useState(false);
	const level = PHOTO_ZOOM.steps[step];
	const zoomed = level > FIT;

	useEffect(() => () => cancelAnimationFrame(frame.current), []);

	function moveZoom(next: number) {
		const view = viewport.current;
		if (!view || next < 0 || next >= PHOTO_ZOOM.steps.length || next === step) {
			return;
		}
		setStep(next);
		cancelAnimationFrame(frame.current);
		const from = scale.current;
		const to = PHOTO_ZOOM.steps[next] / PERCENT;
		const x = (view.scrollLeft + view.clientWidth / 2) / view.scrollWidth;
		const y = (view.scrollTop + view.clientHeight / 2) / view.scrollHeight;
		const start = performance.now();

		const resize = (amount: number) => {
			scale.current = amount;
			view.style.setProperty("--photo-scale", String(amount));
			view.scrollLeft = x * view.scrollWidth - view.clientWidth / 2;
			view.scrollTop = y * view.scrollHeight - view.clientHeight / 2;
		};

		if (window.matchMedia(APPEARANCE.reducedMotionMedia).matches) {
			resize(to);
			return;
		}
		function tick(now: number) {
			const progress = Math.min((now - start) / PHOTO_ZOOM.durationMs, 1);
			resize(from + (to - from) * (1 - (1 - progress) ** 2));
			if (progress < 1) {
				frame.current = requestAnimationFrame(tick);
			}
		}
		frame.current = requestAnimationFrame(tick);
	}

	function startDrag(event: PointerEvent<HTMLElement>) {
		if (!zoomed || event.pointerType !== "mouse" || event.button !== 0) {
			return;
		}
		event.preventDefault();
		const view = event.currentTarget;
		view.focus({ preventScroll: true });
		view.setPointerCapture(event.pointerId);
		drag.current = {
			pointer: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			left: view.scrollLeft,
			top: view.scrollTop,
		};
		setDragging(true);
	}

	function pan(event: PointerEvent<HTMLElement>) {
		const active = drag.current;
		if (active?.pointer !== event.pointerId) {
			return;
		}
		event.currentTarget.scrollLeft = active.left + active.x - event.clientX;
		event.currentTarget.scrollTop = active.top + active.y - event.clientY;
	}

	function stopDrag() {
		drag.current = null;
		setDragging(false);
	}

	function reset() {
		cancelAnimationFrame(frame.current);
		scale.current = 1;
		const view = viewport.current;
		if (view) {
			view.style.removeProperty("--photo-scale");
			view.scrollTo(0, 0);
		}
		stopDrag();
		setStep(0);
	}

	return {
		viewport,
		level,
		zoomed,
		dragging,
		maximum: step === PHOTO_ZOOM.steps.length - 1,
		increase: () => moveZoom(step + 1),
		decrease: () => moveZoom(step - 1),
		fit: () => moveZoom(0),
		reset,
		startDrag,
		pan,
		stopDrag,
	};
}

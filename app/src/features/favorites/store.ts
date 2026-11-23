"use client";

import { useSyncExternalStore } from "react";
import { FAVORITES } from "@/config/favorites";
import { favoriteIDs } from "./favorite-model";

const listeners = new Set<() => void>();
const empty: readonly number[] = [];
let cached: readonly number[] = empty;
let lastStored: string | null | undefined;

function getSnapshot() {
	try {
		const stored = window.localStorage.getItem(FAVORITES.storageKey);
		if (stored !== lastStored) {
			lastStored = stored;
			cached = empty;
			const parsed: unknown = stored ? JSON.parse(stored) : null;
			if (Array.isArray(parsed)) {
				cached = favoriteIDs(parsed);
			}
		}
	} catch {
		// Keep the current session usable if browser storage is unavailable.
	}
	return cached;
}

function getServerSnapshot() {
	return undefined;
}

function subscribe(listener: () => void) {
	function storageChanged(event: StorageEvent) {
		if (event.key === FAVORITES.storageKey || event.key === null) {
			listener();
		}
	}
	listeners.add(listener);
	window.addEventListener("storage", storageChanged);
	return () => {
		listeners.delete(listener);
		window.removeEventListener("storage", storageChanged);
	};
}

export function useFavoriteIDs() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function toggleFavorite(id: number) {
	const selected = getSnapshot();
	const next = selected.includes(id)
		? selected.filter((item) => item !== id)
		: favoriteIDs([...selected, id]);
	cached = next;
	try {
		const serialized = JSON.stringify(next);
		window.localStorage.setItem(FAVORITES.storageKey, serialized);
		lastStored = serialized;
	} catch {
		// The selection remains available for this session.
	}
	for (const listener of listeners) {
		listener();
	}
}

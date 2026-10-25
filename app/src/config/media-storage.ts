export const MEDIA_STORAGE = {
	defaultRoot: "private/media",
	originals: "originals",
	derived: "derived",
	staging: "staging",
	uploads: "uploads",
	pending: "pending",
	fileMode: 0o600,
	directoryMode: 0o700,
} as const;

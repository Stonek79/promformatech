export function parseByteRange(header: string | null, size: number) {
	if (!header) {
		return undefined;
	}
	const match = /^bytes=(\d*)-(\d*)$/.exec(header);
	if (!match || (!match[1] && !match[2]) || size <= 0) {
		throw new RangeError("Unsupported byte range");
	}
	const start = match[1]
		? Number(match[1])
		: Math.max(0, size - Number(match[2]));
	const end =
		match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
	if (
		!Number.isSafeInteger(start) ||
		!Number.isSafeInteger(end) ||
		start < 0 ||
		start > end ||
		start >= size ||
		(!match[1] && Number(match[2]) === 0)
	) {
		throw new RangeError("Invalid byte range");
	}
	return { start, end };
}

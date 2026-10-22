export function classes(
	...values: readonly (string | false | null | undefined)[]
) {
	return values.filter(Boolean).join(" ");
}

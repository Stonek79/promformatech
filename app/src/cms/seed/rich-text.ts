export function richText(...paragraphs: string[]) {
	return {
		root: {
			type: "root",
			version: 1,
			format: "" as const,
			indent: 0,
			direction: "ltr" as const,
			children: paragraphs.map((text) => ({
				type: "paragraph",
				version: 1,
				format: "" as const,
				indent: 0,
				direction: "ltr" as const,
				children: [
					{
						type: "text",
						version: 1,
						text,
						format: 0,
						detail: 0,
						mode: "normal",
						style: "",
					},
				],
			})),
		},
	};
}

export type HelpArticle = {
	readonly title: string;
	readonly summary: string;
	readonly steps?: readonly string[];
	readonly details?: readonly {
		readonly title: string;
		readonly text: string;
	}[];
	readonly note?: string;
	readonly links?: readonly {
		readonly label: string;
		readonly href: string;
	}[];
};

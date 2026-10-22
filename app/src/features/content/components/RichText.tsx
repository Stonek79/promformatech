import { Fragment, type ReactNode } from "react";
import { COLLECTIONS, SHOWCASE_COLLECTIONS } from "@/config/content";
import { isSafeHref, materialPath, pagePath } from "@/lib/urls";
import styles from "./content.module.css";

type Node = {
	type?: string;
	text?: string;
	format?: number | string;
	tag?: string;
	listType?: string;
	children?: Node[];
	fields?: Record<string, unknown>;
};
const FORMAT = {
	bold: 1,
	italic: 2,
	strike: 4,
	underline: 8,
	code: 16,
} as const;

function linkURL(fields: Node["fields"]) {
	if (isSafeHref(fields?.url)) {
		return fields.url;
	}
	const doc = fields?.doc;
	if (
		!doc ||
		typeof doc !== "object" ||
		!("value" in doc) ||
		!("relationTo" in doc)
	) {
		return null;
	}
	const value = doc.value;
	if (
		!value ||
		typeof value !== "object" ||
		!("slug" in value) ||
		typeof value.slug !== "string"
	) {
		return null;
	}
	if (doc.relationTo === COLLECTIONS.pages) {
		return pagePath(value.slug);
	}
	const collection = SHOWCASE_COLLECTIONS.find(
		(slug) => slug === doc.relationTo,
	);
	return collection ? materialPath(collection, value.slug) : null;
}

function renderText(node: Node): ReactNode {
	let text: ReactNode = typeof node.text === "string" ? node.text : "";
	const format = typeof node.format === "number" ? node.format : 0;
	if (format & FORMAT.code) {
		text = <code>{text}</code>;
	}
	if (format & FORMAT.bold) {
		text = <strong>{text}</strong>;
	}
	if (format & FORMAT.italic) {
		text = <em>{text}</em>;
	}
	if (format & FORMAT.underline) {
		text = <u>{text}</u>;
	}
	if (format & FORMAT.strike) {
		text = <s>{text}</s>;
	}
	return text;
}

function renderNode(node: Node, key: number): ReactNode {
	const children = Array.isArray(node.children)
		? node.children.map(renderNode)
		: null;
	switch (node.type) {
		case "text":
			return <Fragment key={key}>{renderText(node)}</Fragment>;
		case "paragraph":
			return <p key={key}>{children}</p>;
		case "heading": {
			const Tag = node.tag === "h3" ? "h3" : node.tag === "h4" ? "h4" : "h2";
			return <Tag key={key}>{children}</Tag>;
		}
		case "list":
			return node.listType === "number" ? (
				<ol key={key}>{children}</ol>
			) : (
				<ul key={key}>{children}</ul>
			);
		case "listitem":
			return <li key={key}>{children}</li>;
		case "quote":
			return <blockquote key={key}>{children}</blockquote>;
		case "linebreak":
			return <br key={key} />;
		case "horizontalrule":
			return <hr key={key} />;
		case "link":
		case "autolink": {
			const url = linkURL(node.fields);
			return url ? (
				<a key={key} href={url} rel="noreferrer">
					{children}
				</a>
			) : (
				<Fragment key={key}>{children}</Fragment>
			);
		}
		default:
			return <Fragment key={key}>{children}</Fragment>;
	}
}

export function RichText({ data }: { readonly data: unknown }) {
	if (
		!data ||
		typeof data !== "object" ||
		!("root" in data) ||
		!data.root ||
		typeof data.root !== "object" ||
		!("children" in data.root) ||
		!Array.isArray(data.root.children)
	) {
		return null;
	}
	return (
		<div className={styles.richText}>{data.root.children.map(renderNode)}</div>
	);
}

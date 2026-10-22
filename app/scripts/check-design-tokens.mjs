import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import { tokens } from "../src/design-system/tokens/theme.mjs";

const visualProperty =
	/^(?:color|background(?:-color)?|border(?:-(?:top|right|bottom|left))?(?:-(?:color|width|radius))?|(?:padding|margin)(?:-.+)?|gap|(?:row|column)-gap|font(?:-.+)?|line-height|letter-spacing|box-shadow|outline(?:-.+)?|transition(?:-.+)?|animation-duration)$/;
const allowedLiteral =
	/^(?:0|auto|none|inherit|initial|unset|transparent|currentColor|normal|100%)$/i;
const errors = [];

async function inspect(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const file = path.join(directory, entry.name);
		if (file.includes(`${path.sep}generated`)) {
			continue;
		}
		if (entry.isDirectory()) {
			await inspect(file);
			continue;
		}
		if (!file.endsWith(".css")) {
			continue;
		}
		postcss
			.parse(await readFile(file, "utf8"), { from: file })
			.walkDecls((declaration) => {
				const { prop, value } = declaration;
				const literalPart = value.replace(/var\([^)]*\)/g, "");
				if (
					visualProperty.test(prop) &&
					/#[a-f\d]{3,8}\b|\b\d*\.?\d+(?:px|rem|em|vw|vh|ms|s)\b/i.test(
						literalPart,
					)
				) {
					errors.push(`${file}: ${prop}: mixed visual literals need tokens`);
				}
				for (const [, name] of value.matchAll(/var\(--pf-([a-z\d-]+)/g)) {
					if (!(name in tokens) && name !== "font-brand") {
						errors.push(`${file}: unknown token --pf-${name}`);
					}
				}
				if (
					visualProperty.test(prop) &&
					!allowedLiteral.test(value) &&
					!value.includes("var(--")
				) {
					if (!/^0(?: 0)*$/.test(value)) {
						errors.push(`${file}: ${prop}: ${value} needs a token`);
					}
				}
			});
	}
}

await inspect("src");
if (errors.length) {
	console.error(errors.join("\n"));
	process.exitCode = 1;
} else {
	console.log("Design tokens: OK");
}

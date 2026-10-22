import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const template = await readFile(
	new URL("../.env.example", import.meta.url),
	"utf8",
);
const environment = template
	.replaceAll(
		"replace-with-generated-database-password",
		randomBytes(24).toString("hex"),
	)
	.replaceAll(
		"replace-with-generated-payload-secret",
		randomBytes(32).toString("hex"),
	);

try {
	await writeFile(new URL("../.env", import.meta.url), environment, {
		flag: "wx",
		mode: 0o600,
	});
	console.log("Создан .env с локальными случайными паролями.");
} catch (error) {
	if (error.code !== "EEXIST") {
		throw error;
	}
	console.log("Файл .env уже существует. Его содержимое сохранено.");
}

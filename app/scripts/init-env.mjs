import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const template = await readFile(
	new URL("../.env.example", import.meta.url),
	"utf8",
);
const environment = template.replaceAll(
	"replace-with-generated-payload-secret",
	randomBytes(32).toString("hex"),
);

await mkdir("private/database", { recursive: true });

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

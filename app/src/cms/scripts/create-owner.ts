import { getCMS } from "@/cms/client";
import { AUTH, COLLECTIONS, CONTEXT, ROLES } from "@/config/content";

const email = process.env.OWNER_EMAIL,
	password = process.env.OWNER_PASSWORD;
if (!email || !password || password.length < AUTH.minimumOwnerPasswordLength) {
	throw new Error(
		"Задайте OWNER_EMAIL и OWNER_PASSWORD (от 16 символов) только для этой команды. Пароль не выводится в лог.",
	);
}
const cms = await getCMS();
try {
	const owners = await cms.count({
		collection: COLLECTIONS.users,
		where: { role: { equals: ROLES.owner } },
		overrideAccess: true,
	});
	if (owners.totalDocs) {
		throw new Error(
			"Владелец уже существует. Используйте управление пользователями в админке.",
		);
	}
	await cms.create({
		collection: COLLECTIONS.users,
		data: { email, password, role: ROLES.owner },
		overrideAccess: true,
		context: { [CONTEXT.bootstrap]: true },
	});
	cms.logger.info("Учётная запись владельца создана.");
} finally {
	await cms.destroy();
}

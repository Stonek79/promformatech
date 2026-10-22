import { APIError, type CollectionConfig } from "payload";
import { AUTH, COLLECTIONS, CONTEXT, ROLES } from "@/config/content";
import { HTTP } from "@/config/forms";
import { isOwner, isStaff, ownerOnly } from "../access";
import { helpDescription } from "../help/config";

export const Users: CollectionConfig = {
	slug: COLLECTIONS.users,
	labels: { singular: "Пользователь", plural: "Пользователи" },
	admin: {
		hideAPIURL: true,
		components: { Description: helpDescription(COLLECTIONS.users) },
		group: "Управление",
		useAsTitle: "email",
		defaultColumns: ["email", "name", "role"],
		hidden: ({ user }) => !isOwner(user),
	},
	auth: {
		tokenExpiration: AUTH.sessionSeconds,
		maxLoginAttempts: AUTH.maxLoginAttempts,
		lockTime: AUTH.lockMilliseconds,
		cookies: { secure: process.env.NODE_ENV === "production", sameSite: "Lax" },
	},
	access: {
		admin: ({ req }) => isStaff(req.user),
		create: ownerOnly,
		delete: ownerOnly,
		unlock: ownerOnly,
		read: ({ req }) =>
			isOwner(req.user) ||
			(isStaff(req.user) ? { id: { equals: req.user.id } } : false),
		update: ({ req }) =>
			isOwner(req.user) ||
			(isStaff(req.user) ? { id: { equals: req.user.id } } : false),
	},
	hooks: {
		beforeChange: [
			async ({ data, operation, originalDoc, req }) => {
				if (operation === "create" && !req.user) {
					if (
						process.env.NODE_ENV === "production" &&
						req.context[CONTEXT.bootstrap] !== true
					) {
						throw new APIError(
							"Первого владельца создаёт администратор сервера командой cms:create-owner.",
							HTTP.forbidden,
						);
					}
					const { totalDocs } = await req.payload.count({
						collection: COLLECTIONS.users,
						overrideAccess: true,
						req,
					});
					if (totalDocs === 0) {
						return { ...data, role: ROLES.owner };
					}
				}
				if (
					operation === "update" &&
					originalDoc.id === req.user?.id &&
					data.role &&
					data.role !== originalDoc.role
				) {
					throw new APIError(
						"Нельзя изменить собственную роль. Попросите другого владельца.",
						HTTP.badRequest,
					);
				}
				return data;
			},
		],
		beforeDelete: [
			({ id, req }) => {
				if (req.user?.id === id) {
					throw new APIError(
						"Нельзя удалить собственную учётную запись.",
						HTTP.badRequest,
					);
				}
			},
		],
	},
	fields: [
		{ name: "name", type: "text", label: "Имя" },
		{
			name: "role",
			type: "select",
			label: "Роль",
			required: true,
			defaultValue: ROLES.manager,
			saveToJWT: true,
			options: [
				{ label: "Владелец", value: ROLES.owner },
				{ label: "Менеджер", value: ROLES.manager },
			],
			access: {
				create: ({ req }) => isOwner(req.user),
				update: ({ req }) => isOwner(req.user),
			},
			admin: {
				condition: (_data, _siblingData, { user }) => isOwner(user),
				description:
					"Менеджер редактирует сайт и заявки. Владелец дополнительно управляет пользователями и служебными настройками.",
			},
		},
	],
};

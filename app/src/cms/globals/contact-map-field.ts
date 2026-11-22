import type { GroupField } from "payload";
import { COLLECTIONS } from "@/config/content";
import {
	CONTACT_MAP_POSITION,
	isMapLink,
	isMapPreviewPath,
} from "@/config/maps";
import { MEDIA_FIELDS } from "@/config/media";
import { MEDIA_KIND } from "@/config/media-assets";

export function contactMapField(): GroupField {
	return {
		name: "map",
		type: "group",
		label: "Карта в карточке",
		admin: {
			description:
				"Сначала укажите адрес офиса или производства. Чтобы добавить карту, вставьте ссылку на нужную точку и выберите изображение карты.",
		},
		fields: [
			{
				name: "visible",
				type: "checkbox",
				label: "Показывать карту или ссылку в адресе",
				defaultValue: true,
			},
			{
				name: "position",
				type: "select",
				label: "Расположение карты",
				defaultValue: CONTACT_MAP_POSITION.beside,
				options: [
					{ label: "Рядом с контактами", value: CONTACT_MAP_POSITION.beside },
					{ label: "Под адресом", value: CONTACT_MAP_POSITION.address },
					{ label: "Под контактами", value: CONTACT_MAP_POSITION.bottom },
				],
				admin: { condition: (_, map) => map.visible !== false },
			},
			{
				name: "url",
				type: "text",
				label: "Ссылка на точку на карте",
				validate: (value: unknown) =>
					!value || isMapLink(value) || "Вставьте https-ссылку на карту.",
				admin: {
					condition: (_, map) => map.visible !== false,
					description:
						"Скопируйте ссылку из функции «Поделиться» выбранной карты. Без ссылки адрес откроется в поиске по картам.",
				},
			},
			{
				name: MEDIA_FIELDS.mapPreview,
				type: "upload",
				label: "Изображение карты",
				relationTo: COLLECTIONS.media,
				filterOptions: { kind: { equals: MEDIA_KIND.image } },
				admin: {
					condition: (_, map) => map.visible !== false,
					description:
						"Выберите изображение карты из медиатеки. Без превью адрес будет ссылкой.",
				},
			},
			{
				name: "existingPreview",
				type: "text",
				label: "Прежнее изображение карты",
				validate: (value: unknown) =>
					!value ||
					isMapPreviewPath(value) ||
					"Выберите новое изображение в медиатеке.",
				admin: {
					condition: (_, map) =>
						map.visible !== false && Boolean(map.existingPreview),
					description:
						"Очистите это поле при смене адреса. Чтобы заменить превью, выберите изображение карты выше.",
				},
			},
		],
	};
}

import { DEFAULT_LOCALE, LOCALES, type Locale } from "./config";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { ru } from "./locales/ru";

export type Messages = typeof ru;
const dictionaries = {
	[LOCALES.ru]: ru,
	[LOCALES.en]: en,
	[LOCALES.de]: de,
} satisfies Record<Locale, Messages>;

export function getMessages(locale: Locale = DEFAULT_LOCALE): Messages {
	return dictionaries[locale];
}

export function getArrayLabels(key: keyof Messages["cms"]["arrays"]) {
	const { singular, plural } = ru.cms.arrays[key];
	return {
		singular: { [LOCALES.ru]: singular },
		plural: { [LOCALES.ru]: plural },
	};
}

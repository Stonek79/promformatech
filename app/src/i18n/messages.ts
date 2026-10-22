import { DEFAULT_LOCALE, LOCALES, type Locale } from "./config";
import { ru } from "./locales/ru";

export type Messages = typeof ru;
const dictionaries = { [LOCALES.ru]: ru } satisfies Record<Locale, Messages>;

export function getMessages(locale: Locale = DEFAULT_LOCALE): Messages {
	return dictionaries[locale];
}

export function getArrayLabels(key: keyof Messages["cms"]["arrays"]) {
	const translations = Object.entries(dictionaries);
	return {
		singular: Object.fromEntries(
			translations.map(([locale, messages]) => [
				locale,
				messages.cms.arrays[key].singular,
			]),
		),
		plural: Object.fromEntries(
			translations.map(([locale, messages]) => [
				locale,
				messages.cms.arrays[key].plural,
			]),
		),
	};
}

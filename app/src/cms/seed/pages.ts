import { BLOCK_TYPES } from "@/config/blocks";
import { PAGE_KINDS, PAGE_SLUGS, PUBLICATION } from "@/config/content";
import type { Page } from "@/payload-types";
import type { AssetLookup } from "./assets";
import { richText } from "./rich-text";

export function initialPages(
	asset: AssetLookup,
	services: readonly number[],
): Omit<Page, "id" | "createdAt" | "updatedAt">[] {
	const contact = { blockType: BLOCK_TYPES.contactForm, visible: true };
	return [
		{
			title: "Главная",
			heading: "Прямые поставки из Китая",
			slug: PAGE_SLUGS.home,
			kind: PAGE_KINDS.home,
			_status: PUBLICATION.published,
			blocks: [
				{
					blockType: BLOCK_TYPES.hero,
					visible: true,
					heading: "Прямые поставки из Китая",
					text: "Пресс-формы различных типов, автоматизация и роботизация производств, робототехника и промышленные комплектующие",
					image: asset("hero"),
					buttonLabel: "Заказать услугу",
					buttonURL: "/#contact",
				},
				{
					blockType: BLOCK_TYPES.textImage,
					visible: true,
					heading: "О нас",
					image: asset("about"),
					imagePosition: "left",
					body: richText(
						"«ПромФормаТех» — московское представительство группы Ningbo Linyue Machinery Technology. Помогаем заказывать оборудование, пресс-формы и комплектующие напрямую с производства в Китае.",
						"Московская команда сопровождает проект от обсуждения задачи и подбора решения до поставки, пусконаладки и дальнейшего обслуживания.",
					),
				},
				{
					blockType: BLOCK_TYPES.cards,
					visible: true,
					heading: "Услуги",
					items: services.map((value) => ({
						relationTo: "services" as const,
						value,
					})),
				},
				{
					blockType: BLOCK_TYPES.steps,
					visible: true,
					heading: "Этапы сотрудничества",
					items: [
						{
							title: "Техническое задание и проектирование",
							text: "Чертежи клиента или разработка изделия и 3D-модели",
							duration: "5–8 дней",
						},
						{
							title: "Разработка решения и расчёт стоимости",
							text: "Подбор решения, расчёт стоимости и сроков",
							duration: "1–2 дня",
						},
						{
							title: "Производство",
							text: "Изготовление пресс-формы и подготовка оборудования",
							duration: "Пресс-формы: 20–60 дней. Оборудование: 30–60 дней",
						},
						{
							title: "Контроль и тестирование",
							text: "Тестирование продукции и пробный запуск оборудования",
							duration: "2–5 дней",
						},
						{
							title: "Доставка и таможенное оформление",
							text: "Логистика из Китая и таможенное оформление",
							duration: "35–45 дней",
						},
						{
							title: "Монтаж и запуск производства",
							text: "Монтаж, настройка и запуск оборудования на площадке клиента",
							duration: "5–10 дней",
						},
					],
				},
				contact,
			],
		},
		{
			title: "О компании",
			slug: PAGE_SLUGS.about,
			kind: PAGE_KINDS.content,
			_status: PUBLICATION.published,
			blocks: [
				{
					blockType: BLOCK_TYPES.textImage,
					visible: true,
					heading: "ПромФормаТех в России",
					image: asset("company"),
					imagePosition: "right",
					body: richText(
						"«ПромФормаТех» — московское представительство группы, которое работает с российскими клиентами и обеспечивает полный цикл сотрудничества: от обсуждения задачи и подбора решения до поставки, пусконаладки и дальнейшего обслуживания.",
						"Мы входим в группу Ningbo Linyue Machinery Technology, которая развивается по модели трёх площадок: две производственные площадки в Китае и представительство в Москве. Китайские заводы отвечают за выпуск оборудования, пресс-форм и деталей, а московская команда работает непосредственно на российском рынке.",
					),
				},
				{
					blockType: BLOCK_TYPES.text,
					visible: true,
					heading: "Наши принципы",
					body: richText(
						"Китайско-российская команда координирует производство и локальный сервис. Московская команда берёт на себя коммуникацию с клиентом и сопровождение заказа, а после поставки — установку, наладку, техническое обслуживание и ремонт.",
						"Проводим обучение, чтобы клиенты могли уверенно эксплуатировать оборудование и самостоятельно решать текущие производственные задачи.",
					),
				},
				contact,
			],
		},
		{
			title: "Наша продукция",
			slug: PAGE_SLUGS.products,
			kind: PAGE_KINDS.products,
			_status: PUBLICATION.published,
			blocks: [contact],
		},
		{
			title: "Услуги",
			slug: PAGE_SLUGS.services,
			kind: PAGE_KINDS.services,
			_status: PUBLICATION.published,
			blocks: [contact],
		},
		{
			title: "Реализованные проекты",
			slug: PAGE_SLUGS.projects,
			kind: PAGE_KINDS.projects,
			_status: PUBLICATION.published,
			blocks: [contact],
		},
		{
			title: "Контакты",
			slug: PAGE_SLUGS.contacts,
			kind: PAGE_KINDS.contacts,
			_status: PUBLICATION.published,
			blocks: [contact],
		},
		{
			title: "Политика обработки персональных данных",
			slug: PAGE_SLUGS.privacy,
			kind: PAGE_KINDS.content,
			_status: PUBLICATION.draft,
			blocks: [
				{
					blockType: BLOCK_TYPES.text,
					visible: true,
					body: richText(
						"Владелец сайта должен добавить и согласовать политику обработки персональных данных перед публичным запуском. Укажите оператора, цели и основания обработки, сроки хранения и порядок обращения.",
					),
				},
			],
		},
	];
}

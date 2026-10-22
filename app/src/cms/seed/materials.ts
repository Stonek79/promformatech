import { BLOCK_TYPES } from "@/config/blocks";
import { PUBLICATION } from "@/config/content";
import type { Product, Service } from "@/payload-types";
import type { AssetLookup } from "./assets";
import { richText } from "./rich-text";

export function initialServices(
	asset: AssetLookup,
): Omit<Service, "id" | "createdAt" | "updatedAt">[] {
	return [
		{
			title: "Пресс-формы",
			slug: "molds",
			summary:
				"Разработка и изготовление пресс-форм под задачи вашего производства.",
			featuredImage: asset("molds"),
			order: 1,
			_status: PUBLICATION.published,
			blocks: [
				{
					blockType: BLOCK_TYPES.text,
					heading: "Решение под ваше изделие",
					visible: true,
					body: richText(
						"Обсуждаем задачу, подбираем технологическое решение и сопровождаем изготовление пресс-формы. Работаем по чертежам клиента или помогаем с разработкой изделия и 3D-модели.",
					),
				},
				{ blockType: BLOCK_TYPES.contactForm, visible: true },
			],
		},
		{
			title: "Оборудование",
			slug: "equipment",
			summary:
				"Поставка промышленного оборудования напрямую с производства в Китае.",
			featuredImage: asset("equipment"),
			order: 2,
			_status: PUBLICATION.published,
			blocks: [
				{
					blockType: BLOCK_TYPES.text,
					heading: "От подбора до запуска",
					visible: true,
					body: richText(
						"Подбираем оборудование под проект, согласовываем стоимость и сроки, организуем поставку. Московская команда сопровождает монтаж, наладку и обслуживание.",
					),
				},
				{ blockType: BLOCK_TYPES.contactForm, visible: true },
			],
		},
		{
			title: "Автоматизация",
			slug: "automation",
			summary:
				"Автоматизация и роботизация производств, робототехника и промышленные комплектующие.",
			featuredImage: asset("automation"),
			order: 3,
			_status: PUBLICATION.published,
			blocks: [
				{
					blockType: BLOCK_TYPES.text,
					heading: "Автоматизация производственных задач",
					visible: true,
					body: richText(
						"Обсуждаем производственные процессы и требования предприятия, подбираем оборудование и средства автоматизации. Сопровождаем внедрение решения и обучение работе с ним.",
					),
				},
				{ blockType: BLOCK_TYPES.contactForm, visible: true },
			],
		},
	];
}

export function initialProducts(
	asset: AssetLookup,
): Omit<Product, "id" | "createdAt" | "updatedAt">[] {
	return [
		{
			title: "Шариковая направляющая колонна A-TRP",
			slug: "ball-guide-pillar-a-trp",
			summary:
				"Внутренняя направляющая колонна в сборе для клеммного штампа. Применяется в высокоскоростной штамповке клемм и последовательных штампах.",
			category: "Металлические изделия",
			featuredImage: asset("guide"),
			order: 1,
			_status: PUBLICATION.published,
			specifications: [
				{ label: "Материал", value: "Подшипниковая сталь SUJ2" },
				{ label: "Твёрдость после закалки", value: "HRC 58–62" },
			],
			blocks: [{ blockType: BLOCK_TYPES.contactForm, visible: true }],
		},
		{
			title: "Пористые фильтрующие трубки",
			slug: "porous-filter-tubes",
			summary:
				"Каркас фильтрующего элемента и прямое грубое фильтрование масла, воды и других жидкостей. Применяется в термопластавтоматах, гидростанциях, промышленных трубопроводах и водоочистке.",
			category: "Металлические изделия",
			featuredImage: asset("filters"),
			order: 2,
			_status: PUBLICATION.published,
			specifications: [
				{ label: "Материал", value: "Нержавеющая сталь 304 / 316L" },
			],
			blocks: [{ blockType: BLOCK_TYPES.contactForm, visible: true }],
		},
	];
}

export const SOURCE_ASSETS = [
	{ key: "logo", file: "logo.png", title: "Логотип ПромФормаТех" },
	{
		key: "footerLogo",
		file: "logo2.png",
		title: "Логотип ПромФормаТех для тёмного фона",
	},
	{ key: "hero", file: "promo.jpg", title: "Производственная площадка" },
	{
		key: "about",
		file: "about.jpg",
		title: "Промышленные роботы на производстве",
	},
	{
		key: "company",
		file: "3d9e90e77d45a6dbe9ab106b01829cca.jpg",
		title: "Производство и команда компании",
	},
	{ key: "molds", file: "clip1/img1.jpg", title: "Пресс-формы" },
	{
		key: "equipment",
		file: "clip1/img2.jpg",
		title: "Промышленное оборудование",
	},
	{
		key: "automation",
		file: "clip1/img3.jpg",
		title: "Промышленная автоматизация",
	},
	{
		key: "guide",
		file: "clip1/1.jpg",
		title: "Шариковая направляющая колонна",
	},
	{ key: "filters", file: "3.jpg", title: "Пористые фильтрующие трубки" },
] as const;

export type AssetKey = (typeof SOURCE_ASSETS)[number]["key"];
export type AssetLookup = (key: AssetKey) => number;

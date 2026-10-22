<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Правила проекта

- Новые статические тексты интерфейса, подписи, aria-label и сообщения ошибок
  берутся по типизированным ключам из `src/i18n`, а не записываются в JSX.
  Исходный язык — русский. Для нового языка требуется полный словарь того же типа.
  Клиентские компоненты используют `useMessages`, серверные — `getMessages`.
  Редактируемый менеджером контент остаётся в Payload; встроенные действия CMS
  используют её i18n. Переводы контента/slug/SEO добавляются отдельной задачей.
- Сложные проверки готовности данных оформляются именованными предикатами
  с узкими типами; длинные цепочки условий не помещаются в компоненты.
  `switch` используется для вариантов одного признака, а не `switch (true)`.
- Функции раскладываются на смысловые шаги с именованными помощниками.
  Предпочтительны ранние возвраты и небольшая вложенность; не выносить строки
  механически ради количества функций. При рефакторинге кеша и прав доступа
  сохранять контракт и проверять инвалидирование/доступ отдельными тестами.

- У условий и циклов всегда есть блоки `{ ... }`, включая ранние `return`.
- Запрещён явный `any`; внешние неизвестные данные принимаются как `unknown`
  и проверяются перед использованием.
- Служебные значения, состояния, типы блоков, лимиты и маршруты задаются
  именованными константами в `src/config`. Числа не зашиваются в бизнес-логику.
- Файл кода, включая сгенерированные типы и тесты, — максимум 300 строк.
- Типы CMS генерируются командой `pnpm payload:types` в `src/payload-types/`.
  Исправлять их вручную нельзя: правятся схемы или генератор модулей.
- Проверки админки выполняются через настоящий интерфейс под менеджером.
  Для проверки приватности черновиков используется отдельная сессия посетителя.
- Браузерные тесты работают только с `promformatech_e2e`, отдельными медиа
  и отключённой SMTP. Данные и аккаунты основной локальной базы не меняются.

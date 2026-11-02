# ПромФормаТех

Сайт-витрина: Next.js 16, React 19, Payload 3, SQLite. Русская админка, черновики и предпросмотр, медиатека с фоновой обработкой. Docker и отдельный сервер базы больше не нужны.

## Разработка

Node.js 22.22.0, pnpm 10.12.4, FFmpeg/FFprobe в PATH.

```bash
pnpm install --frozen-lockfile
pnpm env:init
pnpm prepare:app
pnpm seed
pnpm dev
```

Сайт `http://localhost:3000`, админка `/admin`. На новой локальной базе создайте владельца при первом входе. Для новых фото/видео во втором терминале: `pnpm worker`. `pnpm worker:once` обрабатывает одну задачу и завершает процесс.

`env:init` не меняет существующий `.env`. При переходе со старой версии задайте `DATABASE_URL=file:./private/database/site.sqlite`, создайте `private/database` и используйте новый MEDIA_ROOT. Старые PostgreSQL и медиа остаются нетронутыми; перенос наполнения не требуется. Не запускайте dev и production на одном файле базы.
- [Домашний сервер и локальная сеть](../docs/deployment/home-server.md)
- [VPS: CI-релиз, systemd, Nginx/TLS, обновления и копии](../docs/deployment/native-vps.md)
- [Помощь менеджеру](../docs/admin/manager-guide.md), также встроена в `/admin/help`.

## Команды

| Команда                 | Назначение                                                     |
| ----------------------- | -------------------------------------------------------------- |
| `pnpm check`            | Biome, лимит 300 строк, типы, CSS, быстрые unit-проверки       |
| `pnpm test:e2e <файлы>` | Chromium и отдельная SQLite, без рабочего контента             |
| `pnpm test:integration` | Пустая SQLite, миграции, версии и восстановление медиа         |
| `pnpm test:media`       | Sharp/FFmpeg                                                   |
| `pnpm build`            | Production standalone без рабочей базы и секретов              |
| `pnpm release:build`    | Сборка плюс production-зависимости и CLI для текущей платформы |
| `pnpm release:verify`   | Проверка готового релиза вне исходного проекта                 |
| `pnpm db:migrate`       | Проверенные миграции; web/worker перед этим остановлены        |
| `pnpm cms:create-owner` | Первый владелец через OWNER_EMAIL/OWNER_PASSWORD               |

Для VPS берите артефакт Linux x64 из GitHub Actions, не локальный macOS build. На сервере запускаются `node server.js` и `node ops/worker.mjs once` под systemd; установка npm-пакетов там не требуется.

Контент, аккаунты и версии живут в SQLite; медиа — в MEDIA_ROOT, секреты — в `.env`. GitHub хранит код, но не эти данные. Нужны согласованные внешние копии и проверка восстановления.

Публичной формы, архива заявок и политики обработки данных нет. SMTP оставлена только как необязательная доставка восстановления паролей. Настройки сайта публикуются через черновик; служебный раздел владельца показывает состояние подключений.

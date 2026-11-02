# Домашний сервер: установка, запуск и обновление

Актуально после перехода на SQLite (30.10.2026). Docker/PostgreSQL для сайта больше не нужны. Старые контейнеры и тома автоматически не удаляются: они могут содержать прежние тестовые данные или обслуживать другие приложения.

## Первый запуск в домашней сети

Ubuntu, Node.js 22.22+, pnpm 10.12.4, Git и FFmpeg. Если `pnpm` не находится, добавьте установленный ранее каталог в PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
cd "$HOME/apps/promformatech/app"
pnpm install --frozen-lockfile
pnpm env:init
```

`env:init` создаёт только отсутствующий `.env`, не заменяя существующие секреты. При переходе со старой версии отредактируйте `.env`:

```dotenv
DATABASE_URL=file:./private/database/site.sqlite
MEDIA_ROOT=private/media-sqlite
SERVER_URL=http://192.168.1.130:3001
```

`PAYLOAD_SECRET` оставьте существующий. Строки `POSTGRES_*` больше не используются. `MEDIA_ROOT=private/media-sqlite` отделяет новую среду от прежних файлов. Создайте каталог базы:

```bash
mkdir -p private/database
pnpm prepare:app
pnpm seed
pnpm exec next dev --turbopack --hostname 0.0.0.0 --port 3001
```

Seed добавляет начальный контент. SQLite создаётся автоматически в режиме разработки; PostgreSQL не копируется. Пользователя создайте при первом открытии `/admin/create-first-user` **до выдачи доступа менеджеру**. Для последующих запусков seed и создание пользователя не нужны.

Во втором терминале:

```bash
export PATH="$HOME/.local/bin:$PATH"
cd "$HOME/apps/promformatech/app"
pnpm worker
```

Страницы: `http://192.168.1.130:3001/`, админка: `http://192.168.1.130:3001/admin`. Если IP сервера изменился — проверьте `hostname -I`, поменяйте SERVER_URL и перезапустите оба процесса. Туннель внутри домашней сети не требуется.

## Чтобы не останавливалось при закрытии SSH

```bash
sudo apt update
sudo apt install tmux
 tmux new -s promformatech
```

В первом окне tmux запустите сайт. `Ctrl+B`, затем `C` создаёт второе окно — запустите worker. `Ctrl+B`, затем `D` отключает терминал, сохраняя процессы. Вернуться: `tmux attach -t promformatech`. После перезагрузки сервера запуск потребуется повторить. Автозапуск production-версии через systemd описан в [инструкции VPS](native-vps.md).

## Проверка

```bash
ss -ltnp '( sport = :3001 )'
curl -I --max-time 10 http://127.0.0.1:3001/
curl --max-time 10 http://127.0.0.1:3001/api/health/ready
```

Ожидаются слушающий `0.0.0.0:3001`, ответ 200 и `{"status":"ready"}`. Пустой `ss` означает, что Next не работает; откройте его терминал. Если локально ответ есть, а на другом устройстве нет — проверяйте IP, доступ устройств к LAN и firewall. Worker нужен для новых файлов: без него сайт открывается, но загрузки остаются в очереди.

## Обновление тестового стенда

1. Остановите сайт и worker через `Ctrl+C` в их окнах.
2. При необходимости сохраните тестовый контент: скопируйте `.env`, весь каталог `private/database` и используемый каталог медиа при остановленных процессах. Копию храните вне Git, ещё одну — на другом устройстве.
3. Выполните:

```bash
cd "$HOME/apps/promformatech"
git pull --ff-only
cd app
pnpm install --frozen-lockfile
pnpm prepare:app
```

4. Запустите Next, затем worker прежними командами. Менять next.config.ts не нужно — origin берётся из SERVER_URL.

В dev-режиме Payload обновляет схему автоматически. Предупреждение о потере полей требует проверки разработчиком; не подтверждайте его наугад. Production использует отдельную команду миграции и готовый CI-релиз. Не запускайте dev и production на одном файле базы. Базу, `.env`, оригиналы фото/видео в Git не добавляйте.

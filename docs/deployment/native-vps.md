# VPS с доменом: SQLite, systemd, Nginx, готовый релиз

30.10.2026. Целевая среда: отдельный Ubuntu 24.04 x86_64, Node.js 22.22.0. Код и шаблоны подготовлены; реальные DNS, сертификат, systemd и внешний backup проверяются после покупки сервера. Docker, PostgreSQL, Redis и PM2 не нужны.

## Что запускается

Nginx → один Next.js/Payload на `127.0.0.1:3001` → локальная SQLite. WAL и busy timeout 5 секунд включены; блоки страниц хранятся штатным `blocksAsJSON`, отдельные связи медиатеки остаются в CMS. Файлы медиа не лежат в базе.

Worker запускается по timer: один файл, выход, следующая попытка через 15 секунд. Одновременно только один worker; блокировка принадлежит файлу базы. После аварийного завершения устаревшая блокировка освобождается через 60 секунд. При обычной остановке worker завершает задачу или останавливает FFmpeg, следующий запуск восстанавливает очередь.

На VPS не выполняются `pnpm install` и `next build`. RAM всё равно расходуют web, обработка изображений и FFmpeg. Лимит worker 1200 МБ и 1 CPU — начальный предохранитель, а не доказанное требование. На 2 ГБ возможна нехватка при тяжёлом видео; замерьте типовые загрузки на выбранном хосте. Для 4 ГБ есть больше запаса. Таймер увеличивает ожидание больших пачек загрузок.

## 1. Получить релиз из GitHub

Workflow `.github/workflows/release.yml` собирает на Ubuntu 24.04 x64, проверяет код, пустую SQLite и готовый релиз вне исходников. Запускается вручную или push в main. Production-секреты ему не нужны. Заберите из Actions артефакт `promformatech-<sha>` с tar.gz и sha256. Он рассчитан на Linux x64, не ARM и не Alpine/musl.

На сервере проверьте рядом с архивом:

```bash
sha256sum -c promformatech-linux-x64.tar.gz.sha256
```

Checksum защищает от повреждения передачи; источник архива — ваш доверенный GitHub Actions. Не распаковывайте архивы неизвестного происхождения от root.

## 2. Подготовить сервер

Настройте SSH-ключи, обновите Ubuntu. Установите Node.js 22.22.0 из официального дистрибутива с проверкой SHASUMS; команды служб используют `/usr/bin/node` (при установке в `/usr/local` скорректируйте путь во всех unit/scripts). Не используйте Node из nvm для системной службы.

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx ffmpeg sqlite3 restic
sudo useradd --system --home /srv/promformatech --shell /usr/sbin/nologin promformatech
sudo install -d -m 755 /srv/promformatech /srv/promformatech/releases
sudo install -d -m 750 -o promformatech -g promformatech /srv/promformatech/shared
sudo install -d -m 700 -o promformatech -g promformatech /srv/promformatech/shared/database /srv/promformatech/shared/media
sudo install -d -m 700 /srv/promformatech/backups
```

Проверьте `node --version`, `ffmpeg -version`, `ffprobe -version`, `sqlite3 --version`. На сервере с другими сайтами согласуйте порт, конфиги Nginx и firewall. Не меняйте действующие службы вслепую.

## 3. Каталоги и окружение

Распакуйте проверенный архив в новый `/srv/promformatech/releases/<полный-sha>`, не поверх текущего релиза. Код принадлежит root и доступен на чтение пользователю приложения; запись нужна только в `.next/cache` и shared. Не меняйте права каталогов SQLite на общедоступные.

Из `deploy/app.env.example` создайте `/srv/promformatech/shared/app.env`, владелец `root:promformatech`, права `640`. Укажите домен и новый PAYLOAD_SECRET (`openssl rand -hex 32`). Не публикуйте вывод с секретом. DATABASE_URL и MEDIA_ROOT сохраняйте как в шаблоне: скрипты копирования используют эти пути. Формат — простой `KEY=value`, без `export`, команд и shell-подстановок. SERVER_URL в production обязательно `https://...`.

ENV, база и медиа общие для релизов; обновление их не заменяет. Не добавляйте `NEXT_PHASE` и `NEXT_OUTPUT_DIR` в production env. SMTP необязателен, нужен для восстановления паролей; имя переменной пароля — `SMTP_PASSWORD`.

## 4. Схема, владелец и начальные материалы

Пока сайт не доступен извне, из каталога релиза выполните:

```bash
sudo -u promformatech env APP_PROCESS_ROLE=migrator NODE_ENV=production \
  /usr/bin/node --env-file=/srv/promformatech/shared/app.env ops/migrate.mjs
```

Команда работает с пустой SQLite и повторяется безопасно. База, которую раньше менял dev schema push, для production не подходит: создайте отдельную новую. Перенос PostgreSQL не предусмотрен, старые данные не удаляются автоматически.

Создайте владельца, передав `OWNER_EMAIL` и `OWNER_PASSWORD` только на время `ops/create-owner.mjs`. Пароль вводите через скрытый prompt в root-терминале, а не литералом в истории:

```bash
sudo -i
cd /srv/promformatech/releases/<sha>
read -r -p 'Email владельца: ' OWNER_EMAIL
read -r -s -p 'Пароль (от 16 символов): ' OWNER_PASSWORD
export OWNER_EMAIL OWNER_PASSWORD
runuser -u promformatech --preserve-environment -- env NODE_ENV=production \
  /usr/bin/node --env-file=/srv/promformatech/shared/app.env ops/create-owner.mjs
unset OWNER_EMAIL OWNER_PASSWORD
exit
```

Если нужны исходные демонстрационные материалы, выполните при остановленных web/worker:

```bash
sudo -u promformatech env NODE_ENV=production \
  /usr/bin/node --env-file=/srv/promformatech/shared/app.env ops/seed.mjs
```

Без seed владелец наполняет сайт в админке. При повторном seed существующий контент не перезаписывается.

## 5. Службы и первый запуск

Из каталога релиза:

```bash
sudo install -d /usr/local/lib/promformatech
sudo install -m 755 deploy/*.sh /usr/local/lib/promformatech/
sudo install -m 644 deploy/systemd/* /etc/systemd/system/
sudo systemctl daemon-reload
sudo /usr/local/lib/promformatech/update.sh /srv/promformatech/releases/<sha>
sudo systemctl enable promformatech-web.service promformatech-worker.timer
```

Проверка:

```bash
curl --fail http://127.0.0.1:3001/api/health/ready
sudo systemctl status promformatech-web.service promformatech-worker.timer
sudo journalctl -u promformatech-web -u promformatech-worker --since '10 minutes ago'
```

Не запускайте параллельно ручной worker. Для большой пачки можно временно уменьшить интервал timer; это повышает частоту запуска и нагрузку. Web не должен слушать публичный интерфейс в production.

## 6. DNS, Nginx и HTTPS

Создайте A-запись домена на IPv4 VPS. AAAA добавляйте только при рабочем IPv6. В `deploy/nginx/site.conf` замените `example.com`, затем установите конфиги:

```bash
sudo install -m 644 deploy/nginx/proxy.conf /etc/nginx/snippets/promformatech-proxy.conf
sudo install -m 644 deploy/nginx/site.conf /etc/nginx/sites-available/promformatech
sudo ln -s /etc/nginx/sites-available/promformatech /etc/nginx/sites-enabled/promformatech
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d example.com --redirect
sudo certbot renew --dry-run
```

Замените домен и в команде certbot. Не добавляйте `www`, пока для него нет DNS. HTTP нужен для выпуска/продления сертификата. Проверьте timer Certbot. Ограничьте входящий доступ SSH (сначала разрешите текущий порт), 80/443; 3001 извне не открывайте. Владелец должен быть создан **до** публикации админки.

Nginx передаёт правильные Host/Proto; сайт использует SERVER_URL при запросе. Оригиналы и черновики обслуживаются только через проверки Payload — не добавляйте alias на shared/media. Кеширование админки и предпросмотра не включено. Лимит загрузки 502 MiB оставляет место multipart поверх лимита файла 500 MiB. Настроено ограничение попыток входа; это не защита канала от объёмного DDoS. Такой фильтр предоставляет провайдер VPS/CDN, его выбираем отдельно.

## 7. Обновление

1. Скачать новый доверенный артефакт, проверить sha256, распаковать в новый каталог по SHA. Свободного диска должно хватать на новый релиз и полную локальную копию DB/media.
2. Установить изменённые unit/scripts осознанно, выполнить `systemctl daemon-reload`. Не затирать вручную настройки домена/TLS.
3. Запустить `update.sh <полный-путь-релиза>`.

Скрипт проверяет платформу и Node major, останавливает timer/worker/web, делает согласованную копию SQLite+медиа+env, применяет миграции, атомарно переключает current, проверяет readiness и включает timer. Короткий простой намеренный: два web-процесса не расходуют память одновременно. При ошибке миграции службы остаются остановленными; автоматического отката базы с потерей новых данных нет.

Проверьте HTTPS-главную, вход менеджера, сохранение черновика/предпросмотр/публикацию и новую фотографию. Храните предыдущий релиз. Сменить current на старый код можно только при совместимой схеме; иначе восстановление из копии выполняется отдельно и означает возврат данных на время копии.

## 8. Копии вне сервера и восстановление

`backup.sh` временно останавливает писателей, выполняет SQLite `.backup`, проверяет integrity и копирует медиа/env. Сайт запускается до сетевой отправки. На файловой системе без reflink копирование большого медиакаталога увеличивает простой и занимает полный объём на диске.

Для внешней копии выберите restic-репозиторий: S3-совместимый сервис, SFTP на другой сервер или отдельное устройство. Создайте `/etc/promformatech-backup.env` (root, 600) с RESTIC_REPOSITORY, RESTIC_PASSWORD_FILE и нужными переменными провайдера. Пароль restic храните отдельно от VPS; он нужен для восстановления. Для SFTP нужен ключ root с ограниченным доступом к каталогу копий, проверенный host key. Инициализируйте репозиторий через `restic init` с этим окружением. Настройте доступ перед включением timer:

```bash
sudo systemctl start promformatech-backup.service
sudo journalctl -u promformatech-backup --no-pager -n 30
sudo systemctl enable --now promformatech-backup.timer
```

Без внешнего репозитория команда создаёт локальную копию и завершает службу с ошибкой: локальная копия не считается внешней защитой. Retention/prune не включены автоматически, чтобы не удалять копии до первой проверки восстановления. Следите за диском; после принятой restore-проверки задайте политику, например 7 ежедневных и 4 еженедельных копии, и отдельно ограничьте локальный каталог backups.

Восстановление: выгрузить выбранный snapshot через `restic restore` **в отдельный каталог**, проверить `COMPLETE`, `PRAGMA integrity_check`, наличие оригиналов и derived, взять совместимый релиз из release.txt. Остановить timer/worker/web. Сохранить текущее shared отдельно. Перенести восстановленные site.sqlite, media и app.env на штатные пути, выдать владельца promformatech; не смешивать новый файл базы со старыми `-wal/-shm`. Запустить web, readiness, проверить контент и приватность черновика, затем timer. Только после этого удалять старую копию. Раз в месяц повторять пробное восстановление на отдельной среде.

## 9. Приёмка на реальном Linux

Проверить перезагрузку хоста, запуск служб, обновление двух релизов, ошибку readiness, остановку worker во время видео, восстановление копии, заполнение диска и продление TLS. Замерить суммарную RAM web+worker и самый тяжёлый разрешённый файл. Локальные проверки macOS не заменяют эти измерения и не доказывают конкретный минимум памяти VPS.

# Автодеплой и локальные резервные копии

Workflow `ci.yml` запускается для PR в `main`: проверяет формат, типы, CSS и синтаксис серверных скриптов. Модульные, интеграционные, браузерные тесты и тесты серверных скриптов запускаются локально по [инструкции проекта](../../app/README.md#проверка-перед-коммитом).

Workflow `release.yml` собирает Linux x86_64-артефакт при ручном запуске или пуше в `main` с изменениями файлов из фильтра релиза. Правки только в документации и локальных тестах сборку не запускают. Перед упаковкой GitHub Actions запускает готовый релиз вне исходного каталога и проверяет запуск, миграции SQLite, админку, вход, ассеты и CLI обработчика. Автоматическая выкладка после пуша требует `VPS_AUTO_DEPLOY=true`. Сборка и установка зависимостей выполняются в GitHub Actions. [Фильтр релиза](../../.github/workflows/release.yml)

Для сборки без выкладки откройте **Actions → Native Linux release → Run workflow** и оставьте `deploy_to_vps` выключенным. Для запуска сборки с выкладкой выполните `pnpm --dir app deploy:vps` из корня репозитория. Команда запускает ручной workflow для текущего `main` на GitHub. [Порядок обновления](../../README.md#деплой-и-обновления-vps) · [Условия ручного запуска GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch)

## Первый релиз с локализацией

1. Перед обновлением `main` проверьте `VPS_AUTO_DEPLOY` в GitHub Actions. Для сборки без выкладки переменная должна отсутствовать или иметь значение `false`. После пуша в `main` дождитесь успешной задачи `build` и проверьте архив и SHA коммита. При ручном запуске сборки оставьте `deploy_to_vps` выключенным.
2. Перед выкладкой проверьте на VPS свободное место, доступность restic и журнал миграций SQLite. Мигратор принимает базу с журналом, совпадающим с началом списка миграций релиза. Миграции переносят существующий текст в русскую локаль и сохраняют версии записей. Английский и немецкий показывают русский контент там, где перевод пуст. [Список миграций](../../app/src/config/migrations.ts)
3. В согласованное окно запустите **Native Linux release** для того же коммита в `main` с включённым `deploy_to_vps`. Скрипт остановит веб-службу и обработчик медиа, сохранит SQLite и медиатеку в restic, применит миграции, переключит релиз и проверит готовность. Используется текущая база VPS.
4. После запуска проверьте главную, каталоги `/en/products` и `/de/products`, контакты, вход менеджера и предпросмотр черновика. При ошибке миграции зафиксируйте журнал выкладки и снимок перед обновлением. Порядок восстановления базы, медиатеки и предыдущего релиза описан ниже.

## Резервное копирование

При обновлении и по расписанию службы временно останавливаются. SQLite копируется через `.backup` и проверяется, после чего restic сохраняет копию базы и текущую медиатеку в `/srv/promformatech/backups/restic`. Код и `app.env` в копии не включаются. Restic шифрует и дедуплицирует данные: первый снимок требует места для всех файлов, последующие сохраняют новые блоки. На время `prune` тоже нужен свободный диск. Сохраняются 7 ежедневных и 4 еженедельных снимка; старые снимки и их неиспользуемые блоки удаляются после успешного создания очередного снимка.

Это локальная копия: при потере VPS она недоступна. Для защиты от потери сервера нужна отдельная внешняя копия. Пароль restic и необходимые для восстановления настройки приложения храните отдельно от сервера и Git. Нельзя восстановить архив без пароля.

Первичная настройка выполняется root на VPS **после получения нового проверенного кода**. Не перезаписывать существующий пароль или репозиторий:

```bash
test ! -e /etc/promformatech-restic-password
test ! -e /srv/promformatech/backups/restic
umask 077
openssl rand -hex 32 > /etc/promformatech-restic-password
restic -r /srv/promformatech/backups/restic \
  --password-file /etc/promformatech-restic-password init
```

Команды `test` выполняются отдельно: если одна завершилась ненулевым кодом, остановиться и проверить существующую настройку. Установка скриптов и unit-файлов с доверенного проверенного коммита — ручная операция администратора:

```bash
install -m 755 /srv/promformatech/source/deploy/*.sh /usr/local/lib/promformatech/
install -m 755 /srv/promformatech/source/deploy/extract-release.py /usr/local/lib/promformatech/
install -m 644 /srv/promformatech/source/deploy/systemd/*.service \
  /srv/promformatech/source/deploy/systemd/*.timer /etc/systemd/system/
systemctl daemon-reload
systemctl start promformatech-backup.service
journalctl -u promformatech-backup.service -n 30 --no-pager
```

Проверить `restic snapshots` и восстановить снимок **в отдельный каталог**. Не включать таймер, пока проверка базы и содержимого медиа не завершена:

```bash
restic -r /srv/promformatech/backups/restic \
  --password-file /etc/promformatech-restic-password snapshots
PFT_RESTORE_DIR="$(mktemp -d /srv/promformatech/backups/restore-check.XXXXXXXX)"
restic -r /srv/promformatech/backups/restic \
  --password-file /etc/promformatech-restic-password restore latest --target "$PFT_RESTORE_DIR"
sqlite3 -readonly "$PFT_RESTORE_DIR/srv/promformatech/backup-staging/site.sqlite" 'PRAGMA integrity_check;'
du -sh "$PFT_RESTORE_DIR/srv/promformatech/shared/media"
```

Каталог проверки занимает место и содержит приватные данные; после проверки удалить **только его**. Затем `systemctl enable --now promformatech-backup.timer`. Ранее созданные полные каталоги и отдельные таймеры не удаляются и не отключаются автоматически: владелец сначала проверяет их содержимое и назначение.

При восстановлении выбрать конкретный снимок, распаковать его в отдельный каталог, проверить базу, файлы и совместимость релиза. Остановить worker и web, сохранить текущую базу с `-wal`/`-shm` и медиа отдельно, установить восстановленные данные на штатные пути с владельцем `promformatech`, проверить readiness и лишь затем запускать worker. Не совмещать восстановленную базу с прежними файлами WAL.

## Доступ GitHub Actions к VPS

Используется отдельный системный пользователь `pft-deploy`: его ключ не является ключом root. Ключу назначена принудительная команда, принимающая только доставку релиза. Архив передаётся по SSH в root-owned временный каталог без второй промежуточной копии. Только администратор создаёт пользователя и root-owned `authorized_keys`, затем разрешает через проверенный `visudo` **только** `/usr/local/lib/promformatech/receive-release.sh`. Скрипт проверяет SHA-256, revision и содержимое архива; проверка SSH host key обязательна.

На Mac создать отдельный ключ без парольной фразы только для CI, не перезаписывая существующие ключи:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_promformatech_actions -C promformatech-actions
```

На Mac передать **только публичный ключ** по уже проверенному root SSH:

```bash
scp -i ~/.ssh/id_promformatech_vps -o IdentitiesOnly=yes \
  ~/.ssh/id_promformatech_actions.pub root@45.10.218.41:/root/pft-actions.pub
```

На VPS, убедившись, что пользователь и файлы ещё не существуют:

```bash
! getent passwd pft-deploy
test ! -e /var/lib/pft-deploy/.ssh/authorized_keys
test ! -e /etc/sudoers.d/promformatech-deploy
```

Каждая команда должна завершиться с кодом 0; при любом другом результате остановиться для проверки. Затем создать учётную запись и root-owned публичный ключ:

```bash
useradd --system --user-group --home-dir /var/lib/pft-deploy --shell /bin/bash pft-deploy
install -d -m 755 -o root -g root /var/lib/pft-deploy /var/lib/pft-deploy/.ssh
{ printf 'restrict,command="/usr/local/lib/promformatech/deploy-gateway.sh" '; cat /root/pft-actions.pub; } > /var/lib/pft-deploy/.ssh/authorized_keys
chown root:root /var/lib/pft-deploy/.ssh/authorized_keys
chmod 644 /var/lib/pft-deploy/.ssh/authorized_keys
```

Подготовить и проверить отдельный sudoers-файл до установки:

```bash
PFT_SUDOERS="$(mktemp /etc/sudoers.d/.promformatech.XXXXXXXX)"
printf '%s\n' 'pft-deploy ALL=(root) NOPASSWD: /usr/local/lib/promformatech/receive-release.sh *' > "$PFT_SUDOERS"
visudo -cf "$PFT_SUDOERS" \
  && install -m 440 -o root -g root "$PFT_SUDOERS" /etc/sudoers.d/promformatech-deploy
```

Аккаунт deploy не должен иметь доступ к `shared`, `/root` или изменению файлов скриптов и sudoers. Скрипт строго проверяет число и формат аргументов.

Проверить с Mac, что ключ не позволяет выполнять обычные команды. Ожидается отказ `Invalid deployment command.`:

```bash
ssh -i ~/.ssh/id_promformatech_actions -o IdentitiesOnly=yes \
  -o PasswordAuthentication=no pft-deploy@45.10.218.41 \
  'echo should-not-run'
```

В настройках GitHub repository → Settings → Secrets and variables → Actions создать переменную `VPS_HOST`, secrets `VPS_DEPLOY_PRIVATE_KEY` и `VPS_KNOWN_HOSTS`. Последний содержит строку вида `адрес ssh-ed25519 публичный_ключ_сервера`; ключ берётся на VPS из `/etc/ssh/ssh_host_ed25519_key.pub` через уже доверенное соединение. Не подменять проверку `ssh-keyscan` без сравнения отпечатка. Приватный ключ только помещается в secret и не выводится в чат или Git.

Перед первым деплоем от root проверьте через `runuser`, что deploy-пользователь не читает `/srv/promformatech/shared/app.env`, и через `sudo -l -U pft-deploy` — что у него нет произвольного sudo. Укажите `VPS_HOST` после проверки ключа и резервных копий и добавления обоих secrets.

Перед ручным запуском проверьте на VPS, что приёмник поддерживает команду `df --block-size=1 --output=avail`. Сравните установленные скрипты и unit-файлы с доверенным релизом. Этот аудит можно провести при работающем сайте.

```bash
cd /srv/promformatech/source
df --block-size=1 --output=avail /srv/promformatech/releases
for script in maintenance.sh update.sh receive-release.sh deploy-gateway.sh extract-release.py; do
  cmp -s "deploy/$script" "/usr/local/lib/promformatech/$script" || printf 'Отличается скрипт %s\n' "$script"
done
for unit in deploy/systemd/*.service deploy/systemd/*.timer; do
  cmp -s "$unit" "/etc/systemd/system/${unit##*/}" || printf 'Отличается unit %s\n' "${unit##*/}"
done
nginx -t
curl --fail --silent --show-error http://127.0.0.1:3001/api/health/ready
```

Сравнивайте файлы после получения проверенного коммита `main`. Отличия разберите отдельно. Если отличается только `receive-release.sh`, обновите этот скрипт как root командой `install -m 755 deploy/receive-release.sh /usr/local/lib/promformatech/`. Для этого шага перезапуск сайта не требуется. Действующие конфиги Nginx, TLS, `shared/app.env` и systemd настраиваются администратором.

Первую выкладку запустите вручную командой `pnpm --dir app deploy:vps`. Проверьте публичный сайт, админку и резервную копию. Для следующих ручных выкладок достаточно этой же команды. Если хотите выкладывать автоматически после рабочих пушей в `main`, после проверки добавьте переменную GitHub Actions `VPS_AUTO_DEPLOY=true`.

Workflow выполняется последовательно на `main`; при новом запуске активное обновление не прерывается. Перед отправкой CI проверяет, что SHA релиза по-прежнему совпадает с вершиной `main`. Приёмник сверяет checksum, идентификатор коммита, установленные скрипты и unit-файлы до остановки сайта. Изменения серверной инфраструктуры применяются отдельно. При изменении unit-файлов требуется `systemctl daemon-reload`.

Защитные пределы приёма: архив до 1 ГиБ, распакованный релиз до 4 ГиБ и 200 000 элементов. Проверка приёма и распаковки оставляет минимум 2 ГиБ свободными; фактический backup также потребует дополнительного места. Если приложение перерастёт пределы, их нужно осознанно обновить в доверенных скриптах и повторно установить их на сервере. Параллельная запись другими процессами может уменьшить свободное место после проверки, поэтому мониторинг диска обязателен.

После успешного обновления удаляются только более старые автоматически созданные каталоги релизов: текущий и непосредственно предыдущий сохраняются для диагностики. Каталоги с другими именами автоматически не удаляются. Код релизов не входит в резервные снимки restic.

Перед переключением создаётся снимок базы и медиа. Если резервирование не удалось до миграции, скрипт пытается запустить прежний сайт; после ошибки миграции службы оставляются остановленными для ручного восстановления. Обновление исполняется отдельной службой systemd, поэтому обрыв SSH не должен прерывать уже запущенную операцию. При ошибке смотреть `journalctl -u promformatech-deploy-<run_id>-<attempt>` и текущий `/srv/promformatech/current`; не запускать повторную установку вслепую.

# Автодеплой и локальные резервные копии

Workflow `release.yml` проверяет код, собирает и проверяет Linux x86_64-релиз в GitHub Actions и отправляет его на VPS после успешной сборки `main`. На VPS не запускаются `pnpm install` или сборка. До установки ключа и серверных скриптов deploy не работает; до попадания workflow в `main` автоматический запуск невозможен.

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
install -m 644 /srv/promformatech/source/deploy/systemd/* /etc/systemd/system/
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

Перед первым запуском от root проверить через `runuser`, что deploy-пользователь не читает `/srv/promformatech/shared/app.env`, и через `sudo -l -U pft-deploy` — что у него нет произвольного sudo. Только после проверки ключа, резервирования и настройки secrets включать workflow в `main`.

Workflow выполняется последовательно на `main`; при новом запуске активное обновление не прерывается. В работу идут только артефакты текущего успешного build. Скрипт сверяет checksum, идентификатор коммита и серверную инфраструктуру; несоответствия останавливают обновление до выключения сайта. Server-owned скрипты и unit-файлы из архива автоматически не устанавливаются: при их изменении нужны ручная проверка, установка и `daemon-reload` перед повторным запуском.

Защитные пределы приёма: архив до 1 ГиБ, распакованный релиз до 4 ГиБ и 200 000 элементов. Проверка приёма и распаковки оставляет минимум 2 ГиБ свободными; фактический backup также потребует дополнительного места. Если приложение перерастёт пределы, их нужно осознанно обновить в доверенных скриптах и повторно установить их на сервере. Параллельная запись другими процессами может уменьшить свободное место после проверки, поэтому мониторинг диска обязателен.

После успешного обновления удаляются только более старые автоматически созданные каталоги релизов: текущий и непосредственно предыдущий сохраняются для диагностики. Каталоги с другими именами автоматически не удаляются. Код релизов не входит в резервные снимки restic.

Перед переключением создаётся снимок базы и медиа. Если резервирование не удалось до миграции, скрипт пытается запустить прежний сайт; после ошибки миграции службы оставляются остановленными для ручного восстановления. Обновление исполняется отдельной службой systemd, поэтому обрыв SSH не должен прерывать уже запущенную операцию. При ошибке смотреть `journalctl -u promformatech-deploy-<run_id>-<attempt>` и текущий `/srv/promformatech/current`; не запускать повторную установку вслепую.

# Portfolio API

API сайта-портфолио: работы, профиль, карточки услуг, загрузка медиа на диск сервера. NestJS 12 (ESM), SQLite (better-sqlite3), JWT.
Контракт — `../docs/ai/plans/001-backend-and-visual.md`, архитектура — `../docs/ai/ARCHITECTURE.md`.

## Запуск

```bash
npm install            # .npmrc включает legacy-peer-deps (обход бага npm 10.9 с peer-зависимостями vitest)
cp .env.example .env   # заполнить JWT_SECRET и ADMIN_PASSWORD_HASH
npm run build
npm run hash-password -- 'пароль от 12 символов'   # вставить результат в ADMIN_PASSWORD_HASH
npm run seed           # примерные работы и профиль, только в пустую БД
npm run start:dev      # http://localhost:4000/api
```

## Проверки

```bash
npm test          # unit
npm run test:e2e  # e2e на :memory: БД и временной папке загрузок
npm run lint
npm run build
```

## Как пользоваться admin API

```bash
TOKEN=$(curl -s localhost:4000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"…"}' | node -pe 'JSON.parse(fs.readFileSync(0)).accessToken')

curl -s localhost:4000/api/admin/uploads -H "Authorization: Bearer $TOKEN" -F file=@clip.mp4
# → {"url":"/media/<uuid>.mp4","kind":"video","size":…}

curl -s localhost:4000/api/admin/projects -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"slug":"new-spot","title":"Новый ролик","year":2026,"category":"motion","orientation":"vertical","videoUrl":"/media/<uuid>.mp4"}'
```

## Продакшен
- Один процесс за Caddy/nginx; `TRUST_PROXY=1`, чтобы лимиты считались по реальному IP.
- `DATABASE_PATH` и `UPLOAD_DIR` — на постоянном диске (в Docker — volume).

## Хранилище медиа (диск сервера)

Файлы лежат в `UPLOAD_DIR` под именами `<uuid>.<ext>` и отдаются по `/media/*`. Админка шлёт файл в `POST /api/admin/uploads`; multer пишет его потоком во временный `.upload-*`, сервер проверяет первые байты (mp4, webm, jpg, png, webp) и размер, затем переименовывает.

- **Лимиты:** видео — `MAX_VIDEO_MB` (по умолчанию 2048), картинки — 10 МБ. Загрузка отклоняется с 507, если после неё на диске останется меньше `MIN_FREE_MB` (по умолчанию 2048). Без `Content-Length` считается худший случай (`MAX_VIDEO_MB`). Таймаут запроса Node поднят до 2 ч для всех запросов, поэтому API — только за прокси.
- **Уборка:** раз в час (и при старте) удаляются файлы, на которые уже сутки не ссылается ни одна работа и ни одна настройка (шоурил в профиле и т. п.) — заменённое видео можно вернуть в течение суток; также брошенные `.upload-*` старше суток. Отсчёт идёт в памяти процесса, перезапуск его сбрасывает. Файлы с другими именами не трогаются.
- **Место:** `GET /api/admin/uploads/usage` — занято/свободно, видно в админке на вкладке «Работы».
- **Видео для веба:** перед загрузкой лучше перекодировать в H.264 1080p ~5–8 Мбит/с с `-movflags +faststart` (иначе браузер ждёт конец файла перед стартом):
  `ffmpeg -i in.mov -c:v libx264 -crf 22 -preset slow -vf scale=-2:1080 -c:a aac -b:a 128k -movflags +faststart out.mp4`

### Отдача через прокси
`/media/*` выгоднее отдавать прокси напрямую с диска (Range-запросы, sendfile), а не через Node. Пример для Caddy (папка смонтирована в контейнер Caddy только на чтение):

```
api.example.ru {
  handle_path /media/* {
    root * /srv/uploads
    header Cache-Control "public, max-age=2592000, immutable"
    header Cross-Origin-Resource-Policy cross-origin
    header Access-Control-Allow-Origin https://example.ru
    @hidden path_regexp hidden ^/\.
    respond @hidden 404
    file_server
  }
  reverse_proxy api:4000
}
```

`Access-Control-Allow-Origin` нужен: hero читает кадры видео в WebGL. У Caddy нет лимита на размер тела по умолчанию; в nginx — `client_max_body_size 2100m;`, `proxy_request_buffering off;` и `proxy_read_timeout 2h;` для `/api/admin/uploads`.

### Бэкап
Диск — единственная копия контента. Нужен бэкап **с историей**, а не зеркало: `rsync --delete` повторит на копии любое случайное удаление. Варианты: снапшоты диска у хостера, restic/borg (`restic backup uploads/ data/backup.db` по cron, хранить несколько недель) или `rsync -a --backup --backup-dir=../deleted-$(date +%F)`. БД перед копированием — `sqlite3 portfolio.db ".backup data/backup.db"`.

Уборка не удаляет ничего, если в БД нет ни одной работы или если «лишними» оказалась больше четверти файлов (признак не той БД — проверьте `DATABASE_PATH`); в лог пишется предупреждение.

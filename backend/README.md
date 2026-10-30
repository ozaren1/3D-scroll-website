# Portfolio API

API сайта-портфолио: работы, профиль, карточки услуг, загрузка медиа (локально или в S3). NestJS 12 (ESM), SQLite (better-sqlite3), JWT.
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
npm run test:e2e  # e2e на :memory: БД и временной папке загрузок (S3 проверяется unit-тестами с подменным клиентом)
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
- Один процесс за nginx; `TRUST_PROXY=1`, чтобы лимиты считались по реальному IP.
- `DATABASE_PATH` и `UPLOAD_DIR` — на постоянном диске; бэкап = копия файла БД (`sqlite3 portfolio.db ".backup out.db"`) и папки загрузок.
- `/media/*` лучше отдавать nginx-ом напрямую из `UPLOAD_DIR` (Range-запросы, кэш).

## Хранилище медиа (S3)

По умолчанию (`STORAGE_DRIVER=local`) файлы лежат в `UPLOAD_DIR` и отдаются по `/media/*`.
Для продакшена — S3-совместимый бакет (Yandex Object Storage, Selectel, VK Cloud):

1. Создать бакет и сервисный ключ с правом записи. Анонимное чтение (только `GetObject`, без листинга) открыть **только для префикса `media/`**. Для префикса `incoming/` добавить правило жизненного цикла «удалять через 1 день» — там лежат загрузки, которые ещё не прошли проверку.
2. В `.env`: `STORAGE_DRIVER=s3`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` (адрес бакета или его CDN без `/` на конце).
3. Разрешить CORS в бакете — админка загружает файлы прямо из браузера, а hero читает видео в WebGL:

```json
[
  { "AllowedOrigins": ["https://ваш-домен.ru"], "AllowedMethods": ["POST", "GET", "HEAD"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }
]
```

Как это работает: `POST /api/admin/uploads/presign` выдаёт подписанную форму (один ключ, один тип, лимит размера, 15 минут), браузер шлёт файл в бакет под `incoming/`, затем `POST /api/admin/uploads/confirm` проверяет размер и первые байты, копирует файл в публичный `media/` и удаляет из `incoming/`. Не прошедший проверку файл удаляется. В режиме s3 загрузка через API (`POST /api/admin/uploads`) выключена.

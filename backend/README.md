# Portfolio API

API сайта-портфолио: работы, профиль, заявки, загрузка медиа. NestJS 12 (ESM), SQLite (better-sqlite3), JWT.
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
- Один процесс за nginx; `TRUST_PROXY=1`, чтобы лимиты считались по реальному IP.
- `DATABASE_PATH` и `UPLOAD_DIR` — на постоянном диске; бэкап = копия файла БД (`sqlite3 portfolio.db ".backup out.db"`) и папки загрузок.
- `/media/*` лучше отдавать nginx-ом напрямую из `UPLOAD_DIR` (Range-запросы, кэш).

# 001 — Бэкенд на NestJS и переработка визуала
Статус: done · Дата: 2026-10-24

## Цель и границы
- Поднять API в `backend/`: публичные работы и профиль, приём заявок, admin API (JWT) для управления работами, профилем, заявками и загрузкой медиа.
- Переделать фронтенд: Z-полёт привязан к позиции скролла (без накопления дельты), имя и роль на первом экране, подписи к работам, плеер со звуком, «о себе», контакты с формой → API. Данные берутся из API с фолбэком на локальные.
- **Не входит:** UI админки, уведомления о заявках, транскодинг видео, деплой, i18n.

## Контракт API
Базовый префикс `/api`. Ошибки — стандартный формат Nest: `{ "statusCode": 400, "message": ["..."] | "...", "error": "Bad Request" }`.
Медиа отдаются статикой по `/media/<имя файла>`.

### Типы
```ts
type Category = "reels" | "ads" | "motion" | "corporate" | "clips"; // с плана 004
type Orientation = "horizontal" | "vertical";
type Project = {
  id: number; slug: string; title: string; client: string | null; year: number;
  category: Category; orientation: Orientation; summary: string;
  videoUrl: string; posterUrl: string | null; sortOrder: number;
  published: boolean;            // только в admin-ответах
  createdAt: string; updatedAt: string; // ISO, только в admin-ответах
};
type Profile = {
  name: string; role: string; tagline: string; about: string; location: string;
  email: string; showreelUrl: string | null; socials: { label: string; url: string }[];
};
type ContactRequest = {
  id: number; name: string; email: string; message: string; budget: string | null;
  status: "new" | "read" | "archived"; consentedAt: string | null; createdAt: string; // consentedAt — с плана 004
};
```

### Публичные
| Метод | Путь | Тело / query | Ответ |
|---|---|---|---|
| GET | `/api/health` | — | 200 `{ "status": "ok" }` |
| GET | `/api/profile` | — | 200 `Profile` |
| GET | `/api/projects` | `?category=reels\|ads\|motion\|corporate\|clips` | 200 `Project[]` (только published, по `sortOrder`, без `published/createdAt/updatedAt`); 400 при неизвестной категории |
| GET | `/api/projects/:slug` | — | 200 `Project`; 404 если нет или не опубликован |
| POST | `/api/contact` | `{ name 1..100, email, message 10..4000, budget? ≤100, consent: true, website? }` (consent — с плана 004) | 201 `{ "id": number }`; 400 валидация; 429 лимит (5 / 10 мин с IP). `website` — honeypot: если заполнен, отвечаем 201 `{id:0}` и ничего не сохраняем |

### Admin (заголовок `Authorization: Bearer <jwt>`, иначе 401)
| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` | 200 `{ accessToken, expiresIn }`; 401 неверные данные; 429 (5 / мин) |
| GET | `/api/admin/projects` | — | 200 `Project[]` (все, вкл. черновики) |
| POST | `/api/admin/projects` | `ProjectInput` (все поля кроме id/даты; `slug` `^[a-z0-9-]{1,80}$`) | 201 `Project`; 400; 409 slug занят |
| PATCH | `/api/admin/projects/:id` | частичный `ProjectInput` | 200 `Project`; 400; 404; 409 |
| DELETE | `/api/admin/projects/:id` | — | 204; 404 |
| PUT | `/api/admin/projects/order` | `{ ids: number[] }` — полный список id в новом порядке | 200 `Project[]`; 400 если набор id не совпадает с существующим |
| PUT | `/api/admin/profile` | `Profile` | 200 `Profile`; 400 |
| GET | `/api/admin/contacts` | `?status=` | 200 `ContactRequest[]` (новые сверху) |
| PATCH | `/api/admin/contacts/:id` | `{ status }` | 200 `ContactRequest`; 404 |
| POST | `/api/admin/uploads` | multipart, поле `file`; видео mp4/webm ≤ 300 МБ, изображения jpg/png/webp ≤ 10 МБ | 201 `{ url: "/media/<uuid>.<ext>", kind: "video"\|"image", size }`; 400 тип/нет файла; 413 размер |

`videoUrl`/`posterUrl` принимают путь, начинающийся с `/` (локальный: `/media/…`, `/assets/…`) или `https://` URL.

### Конфигурация (env, `backend/.env.example`)
`PORT=4000`, `DATABASE_PATH=./data/portfolio.db`, `UPLOAD_DIR=./uploads`, `CORS_ORIGINS=http://localhost:3000`, `JWT_SECRET` (≥ 32 символа), `JWT_EXPIRES_IN=12h`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (bcrypt). Фронт: `NEXT_PUBLIC_API_URL=http://localhost:4000`.

## Шаги
- [x] 1. [api] Каркас NestJS 12 в `backend/`, `ConfigModule` с валидацией env, helmet, CORS, `ValidationPipe` (whitelist, forbidNonWhitelisted, transform), префикс `/api`, health — файлы: `backend/src/main.ts`, `app.module.ts`, `config/*`, `health/*`
- [x] 2. [api] `DatabaseModule`: better-sqlite3, WAL, SQL-миграции по `user_version` — файлы: `backend/src/database/*` (зависит от 1)
- [x] 3. [api] Projects: репозиторий, сервис, публичный и admin-контроллеры, DTO, порядок — файлы: `backend/src/projects/*` (зависит от 2, 5)
- [x] 4. [api] Profile: хранение одной строкой JSON, GET/PUT — файлы: `backend/src/profile/*` (зависит от 2, 5)
- [x] 5. [api] Auth: login по env-учётке (bcrypt), JWT guard, throttler — файлы: `backend/src/auth/*` (зависит от 1)
- [x] 6. [api] Contact: приём заявок, honeypot, лимит, admin-список и смена статуса — файлы: `backend/src/contact/*` (зависит от 2, 5)
- [x] 7. [api] Uploads: multer на диск, проверка типа по сигнатуре файла, отдача `/media` — файлы: `backend/src/uploads/*`, `main.ts` (зависит от 5)
- [x] 8. [api] Seed текущих работ и профиля, скрипт хэша пароля, README — файлы: `backend/src/scripts/*`, `backend/README.md`
- [x] 9. [api] Тесты: unit (сервисы), e2e (supertest на `:memory:` БД) — файлы: `backend/test/*`, `backend/src/**/*.spec.ts`
- [x] 10. [web] API-клиент с фолбэком на локальные данные, серверный `page.tsx` → клиентская сцена — файлы: `src/lib/api.ts`, `src/app/data.ts`, `src/app/page.tsx`
- [x] 11. [web] Новая сцена Z-полёта: прогресс от `scrollTop`, rAF + сглаживание, затухание по глубине, play/pause видео по близости, reduced-motion — файлы: `src/components/DepthReel/*`
- [x] 12. [web] Визуал по `.taste-skill/direction.json` (pinned poster, TikTok Sans — см. DECISIONS, putty/black/teal): имя по углам, тайм-код, подписи, плеер, about, контакты с формой, футер — файлы: `src/components/*`, `src/app/globals.css`, `layout`
- [x] 13. [web] Проверка: `tsc`, `next build`, скриншоты desktop/phone

## Тесты
- e2e: health; публичный список скрывает черновики; фильтр по категории и 400 на неизвестную; 404 по slug черновика; contact 201/400/honeypot; admin без токена 401; login 401/200; CRUD проекта + 409 на дубликат slug; reorder; upload: подмена расширения (текст как .mp4) → 400.
- unit: `ProjectsService.reorder` валидирует набор id; `AuthService` не различает «нет пользователя» и «неверный пароль».

## Критерии готовности
- `npm run build`, `npm run lint`, `npm test`, `npm run test:e2e` в `backend/` — зелёные.
- Фронт: `npx tsc --noEmit` и `next build` зелёные; страница работает и без бэкенда (фолбэк).

## Риски и открытые вопросы
- **Открытый вопрос:** нужны ли уведомления о заявках (e-mail / Telegram)? Куда?
- **Открытый вопрос:** SQLite устраивает, или нужен Postgres (например, если будет хостинг без постоянного диска)?
- **Открытый вопрос:** реальные тексты: имя, роль, город, соцсети, описания работ, клиенты — сейчас образцы.
- Постеры сделаны разово через ffmpeg-static (`public/assets/posters/*.jpg`); для новых загрузок постер грузит владелец.
- Видео 25–28 МБ: нужно перекодировать (H.264, 1080p, ~5 Мбит/с) и/или отдавать через nginx/CDN.

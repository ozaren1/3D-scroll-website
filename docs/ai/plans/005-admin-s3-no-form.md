# 005 — Без формы заявок, S3-хранилище, админка, правки главной
Статус: done · Дата: 2026-10-30

## Цель и границы
Правки владельца:
1. Убрать форму заявок (не хочет становиться оператором персональных данных и подавать уведомление в Роскомнадзор).
2. Хранить видео и фото в S3-совместимом хранилище.
3. Админка: добавлять и удалять работы, править «Обо мне» и карточки «Что я делаю».
4. Указать: находится в Москве, работает по всей России.
5. Блок работ (спираль) визуально опущен — отцентровать по вертикали.
6. Баг: многократные клики по первому экрану «ломают» его.
7. Вопрос по деплою (Vercel или свой сервер) — ответ в отчёте, файлы деплоя — отдельным планом.

**Не входит:** деплой, аналитика, смена дизайна.

## Контракт API (изменения)
- Удаляются `POST /api/contact`, `GET/PATCH /api/admin/contacts*`. Миграция 3: `DROP TABLE contact_requests`.
- `Profile.availability?: string` (до 80 символов) — строка статуса в hero.
- `GET /api/services` → `Service[]`; `PUT /api/admin/services` `{ items: Service[] }` (до 12) → `Service[]`.
  `Service = { title 1..80, category: Category, fallback: Category, text ≤400, tags: string[] ≤6 × ≤24 }`. Хранится в `settings` (key `services`), по умолчанию — образцы.
- Загрузки:
  - `POST /api/admin/uploads/presign` `{ contentType, size }` →
    - при `STORAGE_DRIVER=s3`: `{ mode: "s3", url, fields, key, publicUrl }` (presigned POST с условиями на тип и размер, 15 минут);
    - при `local`: `{ mode: "local" }` — клиент шлёт файл на `POST /api/admin/uploads` (как раньше).
  - `POST /api/admin/uploads/confirm` `{ key }` → читает первые 16 байт объекта, проверяет сигнатуру; не совпало — удаляет объект и 400; ок — `{ url, kind, size }`.
  - Типы и лимиты как раньше: mp4/webm до 300 МБ, jpg/png/webp до 10 МБ.
- Env: `STORAGE_DRIVER=local|s3`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`, `S3_FORCE_PATH_STYLE`.

## Решения
- Без форм и аналитики сайт не собирает персональные данные → уведомление в РКН по 152-ФЗ не требуется. Cookie-баннер и галочка согласия удаляются; страница политики сокращается до заявления «данные не собираются». При подключении Метрики/форм — вернуться к вопросу.
- Контакты — прямые ссылки (Telegram, почта, соцсети).
- Маршруты: сайт в группе `app/(site)` со своей оболочкой, админка — `app/admin` без навигации сайта, `noindex`. Токен админа — в `sessionStorage`.
- Хранилище для РФ: Yandex Object Storage / Selectel / VK Cloud (S3 API). Загрузка идёт из браузера прямо в бакет, сервер только подписывает запрос — большие видео не проходят через бэкенд.

## Шаги
- [x] 1. [api] Удалить заявки, миграция 3 — файлы: `backend/src/contact/*`, `app.module.ts`, `migrations.ts`, тесты
- [x] 2. [api] `availability` в профиле, модуль услуг — файлы: `backend/src/profile/*`, `backend/src/services/*`
- [x] 3. [api] S3: presign/confirm, env, тесты — файлы: `backend/src/uploads/*`, `config/env.validation.ts`
- [x] 4. [web] Контакты без формы, Москва, политика, убрать cookie-баннер, услуги и статус из API — файлы: `Contact`, `privacy`, `Shell`, `lib/api.ts`, `data.ts`
- [x] 5. [web] Админка `/admin` — файлы: `src/app/admin/*`, `src/components/admin/*`, `src/lib/adminApi.ts`
- [x] 6. [web] Баг кликов в hero, центровка спирали — файлы: `Hero`, `WorkSpiral`, `globals.css`
- [x] 7. Проверки и ревью

## Риски и открытые вопросы
- Бакет должен разрешать CORS: `POST` с адреса админки и `GET` с адреса сайта (halftone читает видео в WebGL).
- **Открытый вопрос:** хостинг (рекомендация — VPS в РФ, см. отчёт).

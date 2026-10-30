# Портфолио видеомонтажёра и моушен-дизайнера

Одностраничный сайт: камера пролетает по оси Z сквозь работы, имя закреплено по углам экрана, тайм-код показывает позицию на «таймлайне». Под ним — «Обо мне», форма заявки и футер.

- Фронтенд — корень репозитория, Next.js 15 (App Router, SCSS modules).
- Бэкенд — [`backend/`](backend/README.md), NestJS 12 + SQLite.
- Документы процесса — [`docs/ai/`](docs/ai/) (план, решения, статус, ревью).

## Запуск локально

```bash
cd backend && npm install && cp .env.example .env   # заполнить секреты, см. backend/README.md
npm run build && npm run seed && npm run start:dev  # API на http://localhost:4000

cd .. && npm install && cp .env.example .env.local
npx next dev -p 3001                                # сайт на http://localhost:3001
```

Без запущенного API сайт берёт работы и профиль из `src/app/data.ts`, форма заявки предлагает написать на почту.

## Переменные фронта
- `API_URL` — адрес API для сервера Next (может быть внутренним).
- `NEXT_PUBLIC_API_URL` — адрес API для браузера (админка, загруженные медиа `/media/*`). Адрес сайта нужно добавить в `CORS_ORIGINS` бэкенда.
- `SITE_URL` — публичный адрес сайта (`https://…`): canonical, `og:url`, абсолютные адреса в микроразметке и `sitemap.xml`. Обязателен на проде, иначе эти адреса будут указывать на localhost.

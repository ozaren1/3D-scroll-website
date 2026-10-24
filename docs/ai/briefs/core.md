# Brief: core (читать первым)

- Проект: портфолио видеомонтажёра/моушен-дизайнера. Суть — `docs/ai/PROJECT.md`.
- Фронт — корень репозитория (Next.js 15, App Router, SCSS modules). Бэкенд — `backend/` (NestJS 12, better-sqlite3, JWT).
- Контракт API — `docs/ai/plans/001-backend-and-visual.md` → «Контракт API». Меняется только через planner, с записью в `DECISIONS.md`.
- Арт-дирекция фронта — `.taste-skill/direction.json` (`node ~/.claude/skills/design-taste-frontend/scripts/draw.mjs --show`). Домашние правила: без eyebrow-лейблов, моноширинных шрифтов, 01/02/03, тонких линеек, градиентов, теней в покое; заголовки ≤ 2 строк.
- Документы в `docs/ai/` — по-русски, комментарии в коде — по-английски.

## Команды
- Бэкенд: `cd backend && npm run start:dev` · `npm test` · `npm run test:e2e` · `npm run lint` · `npm run build`.
- Сид: `npm run seed` (создаёт работы и профиль, если БД пустая). Хэш пароля: `npm run hash-password -- 'пароль'`.
- Фронт: `npm run dev` (порт 3000) · `npx tsc --noEmit` · `npm run build`.

## Запреты
- Секреты не печатать (`cat .env`, `env`); наличие проверять `grep -c '^ИМЯ=.' backend/.env`.
- Тесты бэкенда — только на `:memory:` БД (`DATABASE_PATH=:memory:`), рабочий файл `backend/data/*.db` не трогать.
- Не коммитить и не выкладывать — это делает координатор по команде владельца.

# 009 — Деплой на VPS
Статус: in-progress · Дата: 2026-10-31

## Цель и границы
Выложить сайт на VPS владельца (Ubuntu 22.04, 2 vCPU, 1,8 ГБ RAM + 3,7 ГБ swap, диск 60 ГБ, `91.218.246.140`). Пока без домена — по IP и HTTP; домен и HTTPS — сменой `SITE_ADDRESS`.

**Не входит:** CI, внешний бэкап медиа, мониторинг, CSP.

## Решения
- Docker Compose: `web` (Next `output: standalone`), `api` (Nest), `caddy:2.8`. Образы собираются на сервере (архитектура amd64, кросс-сборка с Mac не нужна; swap хватает на `next build`).
- Один origin: `/media/*` — Caddy с диска (`/opt/portfolio/uploads`, только чтение), `/api/*` → api, остальное → web. `NEXT_PUBLIC_API_URL` пустой, `API_URL=http://api:4000` для серверного рендеринга.
- Состояние вне кода: `/opt/portfolio/{.env,data,uploads}`; код — `git archive HEAD` в `/opt/portfolio/app`.
- Секреты генерируются на сервере (`openssl rand`), пароль админа задаёт владелец скриптом `set-admin.sh` (хэш через bcryptjs в контейнере, пароль не в argv).
- ufw: 22, 80, 443. Чужие контейнеры (Portainer) не трогаем.

## Шаги
- [x] 1. [infra] Dockerfile (web, api), `.dockerignore`, `next.config.mjs` standalone
- [x] 2. [infra] `deploy/compose.yaml`, `Caddyfile`, `deploy.sh`, `set-admin.sh`, `backup-db.sh`, `deploy/README.md`
- [x] 3. [infra] Сервер: каталоги, `.env`, сборка, запуск, seed, ufw, cron бэкапа
- [x] 4. Проверка: главная, `/works`, `/api/health`, `/media` (Range), вход в админку (401 без токена)
- [x] 5. Документы: ARCHITECTURE, DECISIONS, STATUS

## Риски
- 1,8 ГБ RAM: сборка Next идёт со swap, медленно; при нехватке — собирать образ на Mac (`buildx --platform linux/amd64`).
- Медиа и БД — на одном диске без внешней копии.
- Без HTTPS вход в админку идёт открытым текстом — до подключения домена пароль задавать только из доверенной сети.

## Итог (2026-11-01)
Сайт работает на `http://91.218.246.140`: страницы, `/api/health`, `/api/projects`, видео (Range 206), sitemap — 200; `/media/.x` — 404; admin API без токена — 401. Залит seed (3 работы, профиль). ufw: 22/80/443. Бэкап БД — cron 04:00. Админ — временный хэш случайного пароля, владелец задаёт свой через `set-admin.sh`.
- Обрыв SSH через VPN убивает сборку — длинные команды на сервере запускать через `nohup`.

# Деплой на VPS

Сервер: Ubuntu 22.04, `root@91.218.246.140`, домен `scramble-videoedit.ru`, вход по ключу `~/.ssh/zotov_vps`. Docker Compose: `web` (Next standalone), `api` (Nest), `caddy` (вход 80/443).

Всё на одном адресе: Caddy отдаёт `/media/*` прямо с диска, `/api/*` проксирует в API, остальное — в Next. Браузер ходит на свой же origin (`NEXT_PUBLIC_API_URL` пустой), поэтому CORS не нужен.

## Где что лежит на сервере
| Путь | Что |
|---|---|
| `/opt/portfolio/app` | код (распакованный `git archive HEAD`), `deploy/compose.yaml` |
| `/opt/portfolio/.env` | секреты и адрес сайта (права 600; в git не попадает) |
| `/opt/portfolio/data` | SQLite (`portfolio.db`), `backups/` — ежедневные копии БД |
| `/opt/portfolio/uploads` | медиа из админки (~60 ГБ) |

`.env`: `SITE_ADDRESS` (`:80` или `домен.ru, www.домен.ru`), `SITE_URL`, `CORS_ORIGINS`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `MAX_VIDEO_MB`, `MIN_FREE_MB`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (в одинарных кавычках).

## Выкладка новой версии
С Mac, из корня репозитория, после коммита:
```bash
deploy/deploy.sh
```
Скрипт отправляет `HEAD` на сервер, пересобирает образы и перезапускает контейнеры. Данные (`data`, `uploads`, `.env`) не трогаются. Предыдущий код лежит в `/opt/portfolio/app.old`.

## Админка: e-mail и пароль
На сервере (пароль вводится там и в чат/историю не попадает):
```bash
bash /opt/portfolio/app/deploy/set-admin.sh
```

## Домен и HTTPS
1. A-записи домена (и `www`) → `91.218.246.140`.
2. В `/opt/portfolio/.env`: `SITE_ADDRESS=домен.ru`, `REDIRECT_ADDRESS=www.домен.ru` (301 на основной адрес), `SITE_URL=https://домен.ru`, `CORS_ORIGINS=https://домен.ru`. AAAA-записи у домена быть не должно, если у сервера нет IPv6: иначе Let's Encrypt проверяет чужой адрес.
3. `cd /opt/portfolio/app/deploy && docker compose --env-file /opt/portfolio/.env up -d` — Caddy сам получит сертификаты Let's Encrypt.

## Обслуживание
- Логи: `docker compose --env-file /opt/portfolio/.env logs -f api` (из `/opt/portfolio/app/deploy`).
- Бэкап БД: `deploy/backup-db.sh` по cron в 04:00, хранится 14 дней. Это копии на том же диске; для защиты от потери сервера нужен внешний бэкап `data/` и `uploads/` (снапшоты у хостера или restic в другое хранилище).
- Файрвол (ufw): открыты 22, 80, 443. Docker публикует порты в обход ufw — у Portainer (`:9000`, ставил хостер/владелец) доступ открыт всему интернету по HTTP.

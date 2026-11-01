# Архитектура

```
браузер ──► Next.js (корень, :3000) ──► fetch NEXT_PUBLIC_API_URL ──► NestJS (backend/, :4000)
                │  фолбэк: src/app/data.ts                               ├─ /api/*   JSON
                └─ /assets/video/* (public)                               ├─ /media/* статика из UPLOAD_DIR
                                                                          └─ SQLite (DATABASE_PATH)
```

## Бэкенд (`backend/src`)
| Модуль | Ответственность |
|---|---|
| `config/` | схема env (class-validator), типизированный доступ |
| `database/` | соединение better-sqlite3 (`DATABASE` токен), миграции по `PRAGMA user_version` |
| `health/` | `GET /api/health` |
| `auth/` | `POST /api/auth/login`, `JwtAuthGuard` для `/api/admin/*` |
| `projects/` | репозиторий + сервис; `ProjectsController` (публичный), `AdminProjectsController` |
| `profile/` | одна запись в таблице `settings` (key=`profile`, JSON) |
| `categories/` | категории работ: CRUD, порядок, видимость, SEO; `projects.category` → FK на `categories(slug)` с каскадом |
| `services/` | карточки «Что я делаю» (settings, key `services`; id категорий и работы) |
| `seo/` | мета-теги страниц `/`, `/works`, `/about`, `/privacy` (settings, key `seo`) |
| `uploads/` | multer → `UPLOAD_DIR` (диск сервера), проверка сигнатуры, лимиты и свободное место (507), `usage`; `MediaSweeper` раз в час удаляет файлы без ссылок старше суток |

Таблицы: `categories`, `projects`, `settings` (профиль, услуги, SEO). Слой SQL только в `*.repository.ts`.

## Фронтенд (`src/`)
| Файл | Роль |
|---|---|
| `app/page.tsx` | серверный компонент: грузит профиль и работы (ISR 60 c), отдаёт клиентским компонентам |
| `lib/api.ts` | fetch к API с таймаутом и фолбэком на `app/data.ts` |
| `components/WorkSpiral` | закреплённая спираль карточек работ, поворот от скролла |
| `components/HalftoneVideo` | WebGL: шоурил точечным растром в hero |
| `components/WorksGrid` | страница всех работ с фильтром |
| `components/Player` | полноэкранный плеер со звуком |
| `components/Services`, `Process`, `Contact`, `About`, `Footer` | секции; About — на `/about` |

## Маршруты фронта (с плана 004)
| Путь | Что |
|---|---|
| `/` | hero, спираль работ, услуги с примерами, этапы, контакты |
| `/works`, `/works/<slug>` | все работы и страница категории (старый `?category=` → 308) |
| `/about` | обо мне и этапы работы |
| `/privacy` | политика конфиденциальности и cookie |

Общая оболочка (`components/Shell`): навигация, футер, плеер (`lib/player.tsx`, контекст), cookie-баннер — подключена в `app/layout.tsx`.

## Админка (план 005)
`/admin` — Next-страница без оболочки сайта: вход, «Работы» (CRUD, порядок, публикация, загрузка видео/постеров), «Категории» (CRUD, адреса, SEO, видимость), «Обо мне» (профиль, ссылки, шоурил), «Что я делаю» (карточки, работа под карточкой), «Страницы и SEO». Клиент — `src/lib/adminApi.ts`.

## Деплой
VPS `91.218.246.140`, Docker Compose (`deploy/`): `caddy` (80/443, `/media/*` с диска, `/api/*` → api, остальное → web), `web` (Next standalone), `api` (Nest). Состояние — `/opt/portfolio/{.env,data,uploads}`. Подробно — `deploy/README.md`.

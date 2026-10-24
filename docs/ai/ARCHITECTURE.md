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
| `contact/` | заявки, honeypot, троттлинг |
| `uploads/` | multer → `UPLOAD_DIR`, проверка сигнатуры (mp4/webm/jpg/png/webp) |

Таблицы: `projects`, `contact_requests`, `settings`. Слой SQL только в `*.repository.ts`.

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
| `/works?category=` | все работы с фильтром по категориям |
| `/about` | обо мне и этапы работы |
| `/privacy` | политика конфиденциальности и cookie |

Общая оболочка (`components/Shell`): навигация, футер, плеер (`lib/player.tsx`, контекст), cookie-баннер — подключена в `app/layout.tsx`.

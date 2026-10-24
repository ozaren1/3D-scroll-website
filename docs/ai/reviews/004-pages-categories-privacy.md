# Ревью 004 — страницы, категории, политика и cookie
Дата: 2026-10-24 · Ревьюер: reviewer · План: `docs/ai/plans/004-pages-categories-privacy.md`

## Вердикт: CHANGES REQUESTED (1 блокирующее)

Бэкенд сделан аккуратно: миграция 2 атомарна, данные и индекс переносятся, согласие проверяется на сервере строго (`@Equals(true)`, без неявного приведения типов). Фронт в целом соответствует плану. Блокирует одно: специально подобранный `?category=` роняет рендер `/works`.

## Проверки (реальный вывод)

| Команда | Результат |
|---|---|
| `backend: npx tsc --noEmit -p tsconfig.json` | без ошибок |
| `backend: npm run lint` (oxlint src/ test/) | exit 0, замечаний нет |
| `backend: npm test` | `Test Files 3 passed (3) · Tests 17 passed (17)` |
| `backend: npm run test:e2e` | `Test Files 1 passed (1) · Tests 20 passed (20)` (БД `:memory:` из `test/setup-env.ts`) |
| `root: npx tsc --noEmit` | без ошибок |
| `root: npx next lint` | `✔ No ESLint warnings or errors` |

Дополнительно миграция 2 прогнана скриптом из scratchpad на in-memory БД версии 1 (схема v1 из `MIGRATIONS[0]`, `foreign_keys = ON`, 5 работ, из них 2 удалены, 1 заявка). Результат: `user_version` = 2; `editing` → `corporate`, остальные поля и `created_at` сохранились; `projects_public_idx` и уникальный индекс slug на месте; `integrity_check` = ok; `foreign_key_check` пуст; новая колонка `consented_at` у старой заявки равна NULL; повторный `runMigrations` ничего не делает. **Но** `sqlite_sequence` для `projects` сбросился с 5 до 3, и следующая работа получила id 4 (см. Н1).

`next build/dev/start` не запускались: так сказано в задаче.

## Блокирующие

**Б1. `src/lib/types.ts:51-53`: `isCategory` пропускает ключи прототипа, и `/works?category=__proto__` падает с 500.**
`value in CATEGORY_LABEL` даёт true для `__proto__`, `constructor`, `toString` и т. п. На `/works?category=__proto__` в `WorksGrid.tsx:63` рендерится `CATEGORY_TITLE["__proto__"]` (это `Object.prototype`). Проверено через `renderToString`: `Objects are not valid as a React child`. SSR падает, а `app/error.tsx` в проекте нет, поэтому посетитель видит стандартную страницу ошибки Next. При `constructor` и `toString` страница не падает, но в консоль летит предупреждение, а фильтр показывает пустую категорию без заголовка. Последствие: публичный URL ломает страницу, хотя по плану неизвестная категория должна сбрасываться на «все».
Исправление: `return typeof value === "string" && (CATEGORIES as string[]).includes(value);` (или `Object.hasOwn(CATEGORY_LABEL, value)`). Нужен тест на `isCategory("__proto__") === false`.

## Неблокирующие

**Н1. `backend/src/database/migrations.ts:62-67`: при пересборке `projects` сбрасывается счётчик AUTOINCREMENT.**
Новая таблица берёт `seq = max(id)` из скопированных строк, поэтому id ранее удалённых работ будут выданы повторно. Это проверено: seq 5 → 3, новая работа получила id 4. Ради этого гарантия AUTOINCREMENT и нужна. Последствие небольшое: старые ссылки и кэши по id могут указать на другую работу. Исправление: перед `DROP TABLE projects` выполнить `UPDATE sqlite_sequence SET seq = (SELECT seq FROM sqlite_sequence WHERE name = 'projects') WHERE name = 'projects_v2';` (строка для `projects_v2` появится после INSERT; если таблица пустая, нужен `INSERT ... SELECT`). Миграция ещё не применена на проде, так что текст записи 2 можно поправить. В `migrations.spec.ts` стоит добавить проверку seq и наличия `projects_public_idx`.

**Н2. `src/components/WorksGrid/WorksGrid.tsx:18`: состояние фильтра не синхронизируется с URL при навигации внутри `/works`.**
`useState(initialCategory)` читает пропс только при монтировании. Если на `/works?category=ads` нажать «Работы» в Nav или Footer (`/works`), сервер пришлёт `initialCategory=null`, но компонент останется смонтирован и продолжит показывать «Реклама» при URL `/works`. Исправление: в `works/page.tsx` передать `key={category ?? "all"}` или держать состояние в `useSearchParams()`.

**Н3. `src/components/CookieBanner/CookieBanner.tsx:44-45`: текст расходится с поведением.**
«сохраняется только ваш выбор в этом окне»: на деле выбор лежит в `localStorage`, переживает закрытие окна и действует во всех вкладках. Нужно «в этом браузере». В остальном текст честный: сам сайт cookie не ставит (шрифты подключены через `next/font` и раздаются самим сайтом, сторонних скриптов и iframe нет, middleware нет, в бэкенде нет cookie). Ошибки хранилища обрабатываются (try/catch и при чтении, и при записи). Баннер немодальный, фокус не перехватывает, кнопки нативные, для такого уведомления это правильно.

**Н4. `CookieBanner.tsx:48-53`: «Принять все» сейчас ничего не меняет, а сохранённое `all` будет считаться согласием и на будущую аналитику.**
Согласие, данное до того, как аналитика появилась, нельзя считать информированным. Исправление: версионировать ключ (`cookie-consent:v1`) и при подключении аналитики спрашивать заново. Это стоит записать в DECISIONS вместе с правилом «только при `all`».

**Н5. `src/app/privacy/page.tsx:77-79` и `backend/src/contact/contact.controller.ts:25-38`: политика обещает удаление, которого система не умеет.**
В тексте сказано: «не дольше одного года… после чего удаляются, или раньше — по вашему запросу». При этом в API нет удаления заявок (есть только `PATCH status`) и нет задачи, которая чистит старые записи. Выполнить обещание сейчас можно только ручным SQL на проде. Исправление: добавить `DELETE /api/admin/contacts/:id` и периодическую очистку либо поменять текст на фактическую процедуру. Это решение для planner и владельца, его стоит вынести в «Открытые вопросы».
Остальные утверждения политики сверены с кодом и верны: IP в БД не пишется, он живёт только в in-memory throttler; хранятся дата отправки и `consented_at`; почтовых, Telegram- и иных интеграций, которые передавали бы данные третьим лицам, нет; логирования запросов с IP в приложении нет. Логи reverse proxy, если он есть, политика не упоминает: это вопрос к деплою.

**Н6. `privacy/page.tsx:77`: локализация данных.** По ст. 12 Закона РК № 94-V базы с персональными данными граждан РК должны храниться на территории РК. Поле «хостинг-провайдер и страна» — заглушка, при заполнении это надо учесть. Вопрос к юристу (в плане уже есть пометка о проверке).

**Н7. Контракт в `docs/ai/plans/001-backend-and-visual.md` обновлён не до конца:** в строке 39 осталось `?category=editing|motion`, в `ContactRequest` (строки 28-30) нет `consentedAt: string | null`. Код соответствует плану 004, нужно поправить документ.

**Н8. `backend/test/app.e2e-spec.ts:293`: проверено только `consent: false`.** Нет кейса, где поля нет вовсе, и кейса со строкой `"true"`. Сейчас оба отклоняются (`@Equals(true)`, `transform` без `enableImplicitConversion`), но тест защитил бы от регрессии при смене настроек `ValidationPipe`.

**Н9. Мелочи фронта:**
- `src/components/Contact/Contact.tsx:100`: комментарий «Honeypot» стоит над чекбоксом согласия, а не над ловушкой (строка 108). Его стоит перенести, чтобы чекбокс не приняли за скрытое поле. Доступность чекбокса в порядке: нативный `input` внутри `label`, ссылка на политику входит в доступное имя, `required` даёт нативную валидацию.
- `src/app/works/page.tsx:6`: `revalidate = 60` ничего не делает, потому что страница читает `searchParams` и рендерится динамически. Кэширование всё равно работает на уровне `fetch` (`next.revalidate: 60` в `lib/api.ts`), и в пределах запроса вызовы `loadContent()` в `generateMetadata`, layout и page дедуплицируются. Экспорт можно убрать, чтобы он не вводил в заблуждение.
- `CookieBanner.module.scss`: анимация `rise` не отключается при `prefers-reduced-motion`.
- `Nav.tsx` / `Footer.tsx`: у ссылки на текущую страницу нет `aria-current="page"`.
- `WorksGrid.tsx:62`: `aria-live` висит на заголовке, и объявляется только название категории. Можно добавить число найденных работ.

## Что проверено и в порядке
- Границы клиент/сервер: `readCookieConsent`/`CONSENT_KEY` используются только внутри `CookieBanner`; `PlayerContext` и `usePlayer` из `"use client"` модуля `lib/player.tsx` используются только в клиентских компонентах (Shell, Hero, WorkSpiral, WorksGrid, Services); `lib/showreel.ts` и `lib/api.ts` (кроме `sendContact`, который вызывается из клиентского Contact) без client-only API. Серверные `About`, `Footer`, `Process` не импортируют клиентские хуки.
- Layout: профиль загружается в `RootLayout` и `generateMetadata`; fetch с `revalidate: 60` и таймаутом 3 с; если API недоступен, подставляются данные из `data.ts`.
- API: `CATEGORIES` в бэкенде и фронте совпадают; `GET /api/projects?category=editing` → 400 (e2e); `consentedAt` есть в admin-ответе (e2e); сид переведён на новые категории.
- Миграция: выполняется в транзакции (DDL в SQLite транзакционен), FK на `projects` нет, триггеров и view нет, CHECK у новой таблицы строгий (e2e и unit проверяют вставку `editing`).

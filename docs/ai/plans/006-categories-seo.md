# 006 — Категории и мета-теги в админке, ЧПУ, работа под карточкой
Статус: done · Дата: 2026-10-30

## Цель и границы
1. Hero: убрать кнопку «Обсудить проект»; кнопку «Шоурил» показывать, только если шоурил задан в профиле.
2. «Что я делаю»: под карточку можно выбрать конкретную работу.
3. Категории работ — в админке: создать, переименовать, сменить адрес, скрыть, упорядочить, удалить (если в ней нет работ).
4. ЧПУ: `/works/motion` вместо `/works?category=motion` (старые адреса — 308-редирект).
5. Мета-теги (title, description) — для каждой категории и для страниц `/`, `/works`, `/about`, `/privacy`.

**Не входит:** Open Graph-картинки, sitemap (можно следующим шагом).

## Контракт API (изменения)
- `Category = { id, slug, label, title, seoTitle, seoDescription }` (+ `visible`, `sortOrder`, `projectCount` в admin).
  - `label` — короткое имя (фильтр, подписи), `title` — заголовок страницы категории.
  - `GET /api/categories` — видимые, по порядку.
  - `GET /api/admin/categories`; `POST /api/admin/categories` → 201 / 409 (slug занят); `PATCH /api/admin/categories/:id` → 200 / 404 / 409; `DELETE /api/admin/categories/:id` → 204 / 404 / 409 (есть работы); `PUT /api/admin/categories/order` `{ ids }`.
- `Project.category` — slug категории (строка). Неизвестный slug при создании/правке работы → 400.
  `GET /api/projects?category=<slug>` — работы категории (неизвестная → пустой список).
- Карточка услуги: `{ title, text, tags, categoryId, fallbackId, projectId }` (id или null).
  `GET /api/services` дополнительно отдаёт `category` и `fallback` (slug или null).
- `GET /api/seo` → `{ home, works, about, privacy }`, у каждой `{ title, description }`; `PUT /api/admin/seo`.
- Миграция 4: таблица `categories` (5 текущих категорий), `projects.category` → внешний ключ на `categories(slug)` с `ON UPDATE CASCADE ON DELETE RESTRICT`.

## Решения
- Скрытая категория пропадает из фильтра и её страница отдаёт 404; её работы остаются в «Все работы».
- Пустые мета-поля → разумные значения по умолчанию (заголовок категории, описание из профиля).
- Подписи категорий на клиенте берутся из контекста (`CategoriesContext`), а не из констант.

## Шаги
- [x] 1. [api] Миграция 4, модуль категорий, слаги работ через FK, тесты — `backend/src/categories/*`, `projects/*`, `migrations.ts`
- [x] 2. [api] Карточки услуг с id категорий и работы; модуль SEO — `services/*`, `seo/*`
- [x] 3. [web] `/works/[category]`, редирект со старых адресов, `generateMetadata` из SEO, контекст категорий, hero — `src/app/(site)/*`, `lib/*`, компоненты
- [x] 4. [web] Админка: «Категории», «Страницы (SEO)», выбор работы в карточке, категории в форме работы
- [x] 5. Проверки и ревью

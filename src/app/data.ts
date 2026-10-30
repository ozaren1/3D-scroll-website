import type { Category, Profile, Project, Seo, Service } from "@/lib/types";

// Fallback content, used when the API is unreachable. Keep in sync with backend/src/scripts/seed-data.ts.
// Names, clients and texts are samples for the owner to replace.
export const fallbackProfile: Profile = {
  name: "Кирилл Зотов",
  role: "Видеомонтажёр и моушен-дизайнер",
  tagline: "Монтирую рекламу, клипы и вертикальные ролики, которые досматривают до конца.",
  about:
    "Восемь лет в монтаже: реклама, музыкальные клипы, ролики для соцсетей и титры. " +
    "Собираю историю из исходников, делаю цвет, звук и графику в одном месте, " +
    "поэтому ролик не ходит по трём подрядчикам. Работаю в Premiere Pro, After Effects и DaVinci Resolve.",
  location: "Москва · работаю по всей России",
  availability: "Беру проекты на ноябрь",
  email: "hello@example.com",
  showreelUrl: null,
  socials: [
    { label: "Telegram", url: "https://t.me/example" },
    { label: "ВКонтакте", url: "https://vk.com/example" },
    { label: "VK Видео", url: "https://vkvideo.ru/@example" },
  ],
};

export const fallbackProjects: Project[] = [
  {
    id: 1,
    slug: "line-of-light",
    title: "Свет в линию",
    client: "Производитель светильников",
    year: 2025,
    category: "motion",
    orientation: "horizontal",
    summary: "Продуктовый 3D-ролик в 4K: светильник собирается из темноты и включается в кадре.",
    videoUrl: "/assets/video/1.mp4",
    posterUrl: "/assets/posters/1.jpg",
    sortOrder: 0,
  },
  {
    id: 2,
    slug: "comic-drive",
    title: "Комикс-драйв",
    client: "Автомастерская",
    year: 2025,
    category: "reels",
    orientation: "vertical",
    summary: "Вертикальный ролик для Reels: живая съёмка машины и графика в стиле комикса, три секунды на крючок.",
    videoUrl: "/assets/video/2.mp4",
    posterUrl: "/assets/posters/2.jpg",
    sortOrder: 1,
  },
  {
    id: 3,
    slug: "from-orbit",
    title: "С орбиты на завод",
    client: "Промышленная компания",
    year: 2024,
    category: "corporate",
    orientation: "horizontal",
    summary: "Открывающий шот корпоративного фильма: пролёт от Земли до заводского двора, съёмка с дрона и композитинг.",
    videoUrl: "/assets/video/3.mp4",
    posterUrl: "/assets/posters/3.jpg",
    sortOrder: 2,
  },
];

// Fallbacks for when the API is unreachable; the live values are edited in the admin panel.
export const fallbackCategories: Category[] = [
  { id: 1, slug: "reels", label: "Рилсы", title: "Рилсы и вертикальные видео", seoTitle: "", seoDescription: "" },
  { id: 2, slug: "ads", label: "Реклама", title: "Рекламные ролики", seoTitle: "", seoDescription: "" },
  { id: 3, slug: "motion", label: "Моушен", title: "Моушен-дизайн", seoTitle: "", seoDescription: "" },
  { id: 4, slug: "corporate", label: "Корпоративное", title: "Корпоративное видео", seoTitle: "", seoDescription: "" },
  { id: 5, slug: "clips", label: "Клипы", title: "Музыкальные клипы", seoTitle: "", seoDescription: "" },
];

const card = (title: string, category: Category, fallback: Category, text: string, tags: string[]): Service => ({
  title,
  text,
  tags,
  projectId: null,
  categoryId: category.id,
  fallbackId: fallback.id,
  category: category.slug,
  fallback: fallback.slug,
});

const [reels, ads, motion, corporate] = fallbackCategories;

export const fallbackServices: Service[] = [
  card("Рекламные ролики", ads, motion, "От монтажного плана до экспорта под каждую площадку: 6, 15 и 30 секунд из одних исходников.", ["ТВ", "Digital", "Cutdowns"]),
  card("Вертикальные видео", reels, motion, "Reels, Shorts и TikTok: крючок в первые три секунды, титры, обложка.", ["9:16", "Субтитры", "Обложки"]),
  card("Моушен-дизайн", motion, ads, "Анимация логотипа, инфографика, титры и продуктовые 3D-шоты.", ["2D", "3D", "Логотипы"]),
  card("Цвет и звук", corporate, ads, "Цветокоррекция в DaVinci Resolve, чистка и сведение звука, подбор музыки.", ["Грейдинг", "Звук", "Музыка"]),
];

const blank = { title: "", description: "" };
export const fallbackSeo: Seo = { home: blank, works: blank, about: blank, privacy: blank };

export const processSteps = [
  { title: "Бриф и референсы", time: "1 день" },
  { title: "Черновой монтаж", time: "2–4 дня" },
  { title: "Две итерации правок", time: "входят в цену" },
  { title: "Экспорт под площадки", time: "в день сдачи" },
];

export const tools = ["Premiere Pro", "After Effects", "DaVinci Resolve", "Cinema 4D", "Blender"];

export const navLinks = [
  { href: "/works", label: "Работы" },
  { href: "/about", label: "Обо мне" },
  { href: "/#services", label: "Услуги" },
  { href: "/#contact", label: "Контакты" },
];

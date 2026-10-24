import type { Category, Profile, Project } from "@/lib/types";

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
  location: "Алматы, работаю удалённо",
  email: "hello@example.com",
  showreelUrl: null,
  socials: [
    { label: "Telegram", url: "https://t.me/example" },
    { label: "Instagram", url: "https://instagram.com/example" },
    { label: "Vimeo", url: "https://vimeo.com/example" },
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

export type Service = {
  title: string;
  category: Category; // the example under the card comes from this category
  fallback: Category; // ...or from this one while the first has no works
  text: string;
  tags: string[];
};

export const services: Service[] = [
  {
    title: "Рекламные ролики",
    category: "ads",
    fallback: "motion",
    text: "От монтажного плана до экспорта под каждую площадку: 6, 15 и 30 секунд из одних исходников.",
    tags: ["ТВ", "Digital", "Cutdowns"],
  },
  {
    title: "Вертикальные видео",
    category: "reels",
    fallback: "motion",
    text: "Reels, Shorts и TikTok: крючок в первые три секунды, титры, обложка.",
    tags: ["9:16", "Субтитры", "Обложки"],
  },
  {
    title: "Моушен-дизайн",
    category: "motion",
    fallback: "ads",
    text: "Анимация логотипа, инфографика, титры и продуктовые 3D-шоты.",
    tags: ["2D", "3D", "Логотипы"],
  },
  {
    title: "Цвет и звук",
    category: "corporate",
    fallback: "ads",
    text: "Цветокоррекция в DaVinci Resolve, чистка и сведение звука, подбор музыки.",
    tags: ["Грейдинг", "Звук", "Музыка"],
  },
];

export const processSteps = [
  { title: "Бриф и референсы", time: "1 день" },
  { title: "Черновой монтаж", time: "2–4 дня" },
  { title: "Две итерации правок", time: "входят в цену" },
  { title: "Экспорт под площадки", time: "в день сдачи" },
];

export const budgetOptions = [
  "до 100 000 ₸",
  "100 000 – 300 000 ₸",
  "больше 300 000 ₸",
  "пока не знаю",
];

export const availability = "Беру проекты на ноябрь";

export const tools = ["Premiere Pro", "After Effects", "DaVinci Resolve", "Cinema 4D", "Blender"];

export const navLinks = [
  { href: "/works", label: "Работы" },
  { href: "/about", label: "Обо мне" },
  { href: "/#services", label: "Услуги" },
  { href: "/#contact", label: "Контакты" },
];

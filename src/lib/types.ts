export type Category = "reels" | "ads" | "motion" | "corporate" | "clips";
export type Orientation = "horizontal" | "vertical";

// Mirrors the public Project shape of the API (docs/ai/plans/001-backend-and-visual.md).
export type Project = {
  id: number;
  slug: string;
  title: string;
  client: string | null;
  year: number;
  category: Category;
  orientation: Orientation;
  summary: string;
  videoUrl: string;
  posterUrl: string | null;
  sortOrder: number;
};

export type SocialLink = { label: string; url: string };

export type Profile = {
  name: string;
  role: string;
  tagline: string;
  about: string;
  location: string;
  email: string;
  showreelUrl: string | null;
  socials: SocialLink[];
};

// Short labels for captions and the long ones for filters and headings, in display order.
export const CATEGORY_LABEL: Record<Category, string> = {
  reels: "Рилсы",
  ads: "Реклама",
  motion: "Моушен",
  corporate: "Корпоративное",
  clips: "Клипы",
};

export const CATEGORY_TITLE: Record<Category, string> = {
  reels: "Рилсы и вертикальные видео",
  ads: "Рекламные ролики",
  motion: "Моушен-дизайн",
  corporate: "Корпоративное видео",
  clips: "Музыкальные клипы",
};

export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

// Own keys only: `in` would also accept prototype names such as "__proto__".
export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as string[]).includes(value);
}

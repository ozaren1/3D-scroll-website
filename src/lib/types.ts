export type Orientation = "horizontal" | "vertical";

// Mirrors the public Project shape of the API (docs/ai/plans/001-backend-and-visual.md).
export type Project = {
  id: number;
  slug: string;
  title: string;
  client: string | null;
  year: number;
  category: string; // slug of a Category
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
  availability?: string;
  email: string;
  showreelUrl: string | null;
  socials: SocialLink[];
};

// Work categories are edited in the admin panel; `label` is the short name, `title` the page heading.
export type Category = {
  id: number;
  slug: string;
  label: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
};

export type ProcessStep = { title: string; time: string };

export type Service = {
  title: string;
  text: string;
  tags: string[];
  projectId: number | null; // a chosen work for the example under the card…
  categoryId: number | null; // …else the first work of this category…
  fallbackId: number | null; // …else of this one
  category: string | null; // slugs of the two categories, resolved by the API
  fallback: string | null;
};

export type PageMeta = { title: string; description: string };

export type Seo = { home: PageMeta; works: PageMeta; about: PageMeta; privacy: PageMeta };

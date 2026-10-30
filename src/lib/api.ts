import { fallbackCategories, fallbackProfile, fallbackProjects, fallbackSeo, fallbackServices } from "@/app/data";
import type { Category, PageMeta, Profile, Project, Seo, Service } from "./types";

// Server-side base URL (may be an internal address); the browser uses NEXT_PUBLIC_API_URL.
const SERVER_API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const REVALIDATE_SECONDS = 60;
const TIMEOUT_MS = 3000;

async function getJson<T>(path: string): Promise<T | null> {
  if (!SERVER_API_URL) return null;
  try {
    const res = await fetch(`${SERVER_API_URL}/api${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Media uploaded with the local storage driver lives on the API host; S3 URLs are absolute
// already, and everything else is served by Next from /public.
export function resolveMediaUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/media/") ? `${PUBLIC_API_URL}${url}` : url;
}

function withMedia(project: Project): Project {
  return {
    ...project,
    videoUrl: resolveMediaUrl(project.videoUrl) ?? project.videoUrl,
    posterUrl: resolveMediaUrl(project.posterUrl),
  };
}

export type Content = {
  profile: Profile;
  projects: Project[];
  services: Service[];
  categories: Category[];
  seo: Seo;
};

// Next deduplicates these fetches within one render, so every page and layout can call this freely.
export async function loadContent(): Promise<Content> {
  const [profile, projects, services, categories, seo] = await Promise.all([
    getJson<Profile>("/profile"),
    getJson<Project[]>("/projects"),
    getJson<Service[]>("/services"),
    getJson<Category[]>("/categories"),
    getJson<Seo>("/seo"),
  ]);
  // Fallbacks only when the API is unreachable: an empty list from the API stays empty.
  const resolvedProfile = profile ?? fallbackProfile;
  return {
    profile: { ...resolvedProfile, showreelUrl: resolveMediaUrl(resolvedProfile.showreelUrl) },
    projects: (projects ?? fallbackProjects).map(withMedia),
    services: services ?? fallbackServices,
    categories: categories ?? fallbackCategories,
    seo: seo ?? fallbackSeo,
  };
}

// Meta tags of a page: the admin's values where filled in, otherwise the given defaults.
// A title written in the admin panel is used as is; a default one gets the "· Name" suffix.
export function pageMeta(meta: PageMeta, defaults: PageMeta, profileName: string) {
  return {
    title: meta.title ? { absolute: meta.title } : defaults.title,
    description: meta.description || defaults.description,
    // The title as the browser will show it, for Open Graph.
    fullTitle: meta.title || `${defaults.title} · ${profileName}`,
  };
}

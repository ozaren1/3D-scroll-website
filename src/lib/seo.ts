import { siteUrl } from "./site";
import type { Category, Profile, Project } from "./types";

// Absolute URL for structured data and the sitemap; local address while SITE_URL is not set.
export function absoluteUrl(path: string): string {
  const base = siteUrl() ?? new URL("http://localhost:3001");
  return new URL(path, base).toString();
}

// JSON for a <script type="application/ld+json">; "<" is escaped so content can never close the tag.
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export type Crumb = { name: string; path: string };

export function breadcrumbList(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function personAndSite(profile: Profile) {
  const sameAs = profile.socials.map((s) => s.url).filter((url) => url.startsWith("https://"));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        url: absoluteUrl("/"),
        name: profile.name,
        inLanguage: "ru-RU",
      },
      {
        "@type": "Person",
        "@id": absoluteUrl("/#person"),
        name: profile.name,
        jobTitle: profile.role,
        description: profile.tagline,
        url: absoluteUrl("/"),
        email: `mailto:${profile.email}`,
        address: { "@type": "PostalAddress", addressLocality: profile.location.split("·")[0].trim() },
        ...(sameAs.length ? { sameAs } : {}),
      },
    ],
  };
}

// The works of a page as videos; uploadDate is only known to the year.
export function videoList(projects: Project[], categories: Category[]) {
  const label = (slug: string) => categories.find((c) => c.slug === slug)?.label;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    // Google requires a thumbnail for VideoObject: works without a poster are left out.
    itemListElement: projects.filter((p) => p.posterUrl).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "VideoObject",
        name: p.title,
        description: p.summary || p.title,
        uploadDate: `${p.year}-01-01`,
        contentUrl: absoluteUrl(p.videoUrl),
        ...(p.posterUrl ? { thumbnailUrl: absoluteUrl(p.posterUrl) } : {}),
        ...(label(p.category) ? { genre: label(p.category) } : {}),
      },
    })),
  };
}

// Open Graph and Twitter tags of a page. Next replaces nested metadata objects instead of merging
// them, so every page passes the full set; the picture is the poster of the first work.
export function socialMeta(
  content: { profile: Profile; projects: Project[] },
  page: { title: string; description: string; path: string },
) {
  const poster = content.projects.find((p) => p.posterUrl)?.posterUrl;
  const images = poster ? [{ url: absoluteUrl(poster) }] : undefined;
  return {
    openGraph: {
      type: "website" as const,
      locale: "ru_RU",
      siteName: content.profile.name,
      url: absoluteUrl(page.path),
      title: page.title,
      description: page.description,
      images,
    },
    twitter: {
      card: images ? ("summary_large_image" as const) : ("summary" as const),
      title: page.title,
      description: page.description,
      images: images?.map((i) => i.url),
    },
  };
}

import type { MetadataRoute } from "next";
import { loadContent } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";

// SITE_URL is known only at runtime, so this must not be prerendered during the image build.
export const dynamic = "force-dynamic";

export const revalidate = 3600;

// Public pages only: the fixed pages and every visible category.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categories } = await loadContent();
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(path),
    changeFrequency: "monthly",
    priority,
  });
  return [
    page("/", 1),
    page("/works", 0.9),
    ...categories.map((c) => page(`/works/${c.slug}`, 0.8)),
    page("/about", 0.7),
    page("/privacy", 0.2),
  ];
}

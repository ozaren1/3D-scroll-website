import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

// Everything but the admin panel; the sitemap is announced only once the real address is known.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    ...(siteUrl() ? { sitemap: absoluteUrl("/sitemap.xml") } : {}),
  };
}

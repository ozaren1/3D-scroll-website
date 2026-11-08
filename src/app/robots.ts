import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

// SITE_URL is known only at runtime, so this must not be prerendered during the image build.
export const dynamic = "force-dynamic";

// Everything but the admin panel; the sitemap is announced only once the real address is known.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    ...(siteUrl() ? { sitemap: absoluteUrl("/sitemap.xml") } : {}),
  };
}

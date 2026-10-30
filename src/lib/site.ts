// Public address of the site (SITE_URL): canonical links, og:url, absolute URLs in structured data
// and the sitemap. Without a valid https/http URL no canonical is emitted; the rest uses localhost.
export function siteUrl(): URL | undefined {
  const raw = process.env.SITE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url : undefined;
  } catch {
    return undefined;
  }
}

export function canonical(path: string) {
  return siteUrl() ? { alternates: { canonical: path } } : {};
}

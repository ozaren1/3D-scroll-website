import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";
import WorksGrid from "@/components/WorksGrid/WorksGrid";
import { loadContent, pageMeta } from "@/lib/api";
import { jsonLd, socialMeta, videoList } from "@/lib/seo";
import { canonical } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  const { fullTitle, ...meta } = pageMeta(
    content.seo.works,
    { title: "Все работы", description: "Рилсы, реклама, моушен-дизайн, корпоративное видео и клипы." },
    content.profile.name,
  );
  return {
    ...meta,
    ...canonical("/works"),
    ...socialMeta(content, { title: fullTitle, description: meta.description, path: "/works" }),
  };
}

export default async function WorksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const [{ projects, categories }, params] = await Promise.all([loadContent(), searchParams]);
  // Old links used /works?category=<slug>; send them to the clean address.
  if (typeof params.category === "string" && categories.some((c) => c.slug === params.category)) {
    permanentRedirect(`/works/${params.category}`);
  }
  return (
    <>
      <Breadcrumbs items={[{ name: "Работы", path: "/works" }]} />
      <WorksGrid projects={projects} categories={categories} active={null} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(videoList(projects, categories)) }} />
    </>
  );
}

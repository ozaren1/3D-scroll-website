import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";
import WorksGrid from "@/components/WorksGrid/WorksGrid";
import { loadContent } from "@/lib/api";
import { jsonLd, socialMeta, videoList } from "@/lib/seo";
import { canonical } from "@/lib/site";

export const revalidate = 60;

type Params = Promise<{ category: string }>;

// Unknown or hidden categories are not pages.
async function find(params: Params) {
  const [{ category: slug }, content] = await Promise.all([params, loadContent()]);
  const category = content.categories.find((c) => c.slug === slug);
  return { category, content };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, content } = await find(params);
  if (!category) return {};
  const description =
    category.seoDescription ||
    `${category.title} — примеры работ. ${content.profile.role}, ${content.profile.location}.`;
  const path = `/works/${category.slug}`;
  return {
    title: category.seoTitle ? { absolute: category.seoTitle } : category.title,
    description,
    ...canonical(path),
    ...socialMeta(content, {
      title: category.seoTitle || `${category.title} · ${content.profile.name}`,
      description,
      path,
    }),
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { category, content } = await find(params);
  if (!category) notFound();
  const works = content.projects.filter((p) => p.category === category.slug);
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Работы", path: "/works" },
          { name: category.label, path: `/works/${category.slug}` },
        ]}
      />
      <WorksGrid projects={content.projects} categories={content.categories} active={category} />
      {works.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(videoList(works, content.categories)) }}
        />
      )}
    </>
  );
}

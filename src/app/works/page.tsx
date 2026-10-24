import type { Metadata } from "next";
import WorksGrid from "@/components/WorksGrid/WorksGrid";
import { loadContent } from "@/lib/api";
import { isCategory } from "@/lib/types";

export const metadata: Metadata = {
  title: "Все работы",
  description: "Рилсы, реклама, моушен-дизайн, корпоративное видео и клипы.",
};

export default async function WorksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const [{ projects }, params] = await Promise.all([loadContent(), searchParams]);
  const category = isCategory(params.category) ? params.category : null;
  // key: navigating between /works?category=… links remounts the grid with the new filter.
  return <WorksGrid key={category ?? "all"} projects={projects} initialCategory={category} />;
}

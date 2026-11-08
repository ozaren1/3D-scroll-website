import type { Metadata } from "next";
import About from "@/components/About/About";
import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";
import Process from "@/components/Process/Process";
import { loadContent, pageMeta } from "@/lib/api";
import { socialMeta } from "@/lib/seo";
import { canonical } from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  const { profile } = content;
  const { fullTitle, ...meta } = pageMeta(
    content.seo.about,
    { title: "Обо мне", description: `${profile.role}. ${profile.location}.` },
    profile.name,
  );
  return {
    ...meta,
    ...canonical("/about"),
    ...socialMeta(content, { title: fullTitle, description: meta.description, path: "/about" }),
  };
}

export default async function AboutPage() {
  const { profile, projects, process } = await loadContent();
  const still = projects.find((p) => p.orientation === "vertical") ?? projects[0] ?? null;
  return (
    <>
      <Breadcrumbs items={[{ name: "Обо мне", path: "/about" }]} />
      <About profile={profile} still={still} />
      <Process steps={process} />
    </>
  );
}

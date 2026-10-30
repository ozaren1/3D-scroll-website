import Contact from "@/components/Contact/Contact";
import Hero from "@/components/Hero/Hero";
import Process from "@/components/Process/Process";
import Services from "@/components/Services/Services";
import WorkSpiral from "@/components/WorkSpiral/WorkSpiral";
import type { Metadata } from "next";
import { loadContent } from "@/lib/api";
import { canonical } from "@/lib/site";
import { jsonLd, personAndSite, socialMeta } from "@/lib/seo";
import { pickShowreel } from "@/lib/showreel";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  const { seo, profile } = content;
  // The home title stands alone, without the "· Name" suffix of inner pages.
  const title = seo.home.title || `${profile.name} — ${profile.role.toLowerCase()}`;
  const description = seo.home.description || profile.tagline;
  return {
    title: { absolute: title },
    description,
    ...canonical("/"),
    ...socialMeta(content, { title, description, path: "/" }),
  };
}

export default async function Home() {
  const { profile, projects, services } = await loadContent();
  return (
    <>
      <Hero profile={profile} background={pickShowreel(profile, projects)} />
      <WorkSpiral projects={projects} />
      <Services projects={projects} services={services} />
      <Process />
      <Contact profile={profile} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personAndSite(profile)) }} />
    </>
  );
}

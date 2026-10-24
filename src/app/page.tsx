import Contact from "@/components/Contact/Contact";
import Hero from "@/components/Hero/Hero";
import Process from "@/components/Process/Process";
import Services from "@/components/Services/Services";
import WorkSpiral from "@/components/WorkSpiral/WorkSpiral";
import { loadContent } from "@/lib/api";
import { pickShowreel } from "@/lib/showreel";

export const revalidate = 60;

export default async function Home() {
  const { profile, projects } = await loadContent();
  return (
    <>
      <Hero profile={profile} showreel={pickShowreel(profile, projects)} />
      <WorkSpiral projects={projects} />
      <Services projects={projects} />
      <Process />
      <Contact profile={profile} />
    </>
  );
}

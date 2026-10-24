import type { Metadata } from "next";
import About from "@/components/About/About";
import Process from "@/components/Process/Process";
import { loadContent } from "@/lib/api";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Обо мне",
};

export default async function AboutPage() {
  const { profile, projects } = await loadContent();
  const still = projects.find((p) => p.orientation === "vertical") ?? projects[0] ?? null;
  return (
    <>
      <About profile={profile} still={still} />
      <Process />
    </>
  );
}

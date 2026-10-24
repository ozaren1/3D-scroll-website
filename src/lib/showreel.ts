import type { Profile, Project } from "./types";

// The profile's showreel when set, otherwise the first work stands in for it.
export function pickShowreel(profile: Profile, projects: Project[]): Project | null {
  const first = projects[0];
  if (!profile.showreelUrl) return first ?? null;
  return {
    id: 0,
    slug: "showreel",
    title: "Шоурил",
    client: null,
    year: new Date().getFullYear(),
    category: first?.category ?? "ads",
    orientation: "horizontal",
    summary: profile.tagline,
    videoUrl: profile.showreelUrl,
    posterUrl: null,
    sortOrder: -1,
  };
}

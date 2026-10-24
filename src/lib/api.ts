import { fallbackProfile, fallbackProjects } from "@/app/data";
import type { Profile, Project } from "./types";

// Server-side base URL (may be an internal address); the browser uses NEXT_PUBLIC_API_URL.
const SERVER_API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const REVALIDATE_SECONDS = 60;
const TIMEOUT_MS = 3000;

async function getJson<T>(path: string): Promise<T | null> {
  if (!SERVER_API_URL) return null;
  try {
    const res = await fetch(`${SERVER_API_URL}/api${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Uploaded media lives on the API host; everything else is served by Next from /public.
export function resolveMediaUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/media/") ? `${PUBLIC_API_URL}${url}` : url;
}

function withMedia(project: Project): Project {
  return {
    ...project,
    videoUrl: resolveMediaUrl(project.videoUrl) ?? project.videoUrl,
    posterUrl: resolveMediaUrl(project.posterUrl),
  };
}

export async function loadContent(): Promise<{ profile: Profile; projects: Project[] }> {
  const [profile, projects] = await Promise.all([
    getJson<Profile>("/profile"),
    getJson<Project[]>("/projects"),
  ]);
  // Fallbacks only when the API is unreachable: an empty list from the API stays empty.
  const resolvedProfile = profile ?? fallbackProfile;
  return {
    profile: { ...resolvedProfile, showreelUrl: resolveMediaUrl(resolvedProfile.showreelUrl) },
    projects: (projects ?? fallbackProjects).map(withMedia),
  };
}

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
  budget?: string;
  consent: boolean;
  website?: string;
};

export type ContactResult = { ok: true } | { ok: false; reason: "invalid" | "limit" | "network" };

export async function sendContact(payload: ContactPayload): Promise<ContactResult> {
  if (!PUBLIC_API_URL) return { ok: false, reason: "network" };
  try {
    const res = await fetch(`${PUBLIC_API_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return { ok: true };
    if (res.status === 400) return { ok: false, reason: "invalid" };
    if (res.status === 429) return { ok: false, reason: "limit" };
    return { ok: false, reason: "network" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

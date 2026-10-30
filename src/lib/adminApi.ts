"use client";

import { PUBLIC_API_URL } from "./api";
import type { Category, Orientation, Profile, Seo, Service } from "./types";

// Client for the admin API. The token lives in sessionStorage: it is gone when the tab closes.
const TOKEN_KEY = "admin-token";

export type AdminProject = {
  id: number;
  slug: string;
  title: string;
  client: string | null;
  year: number;
  category: string; // category slug
  orientation: Orientation;
  summary: string;
  videoUrl: string;
  posterUrl: string | null;
  sortOrder: number;
  published: boolean;
};

export type ProjectInput = Omit<AdminProject, "id" | "sortOrder">;

export type AdminCategory = Category & { visible: boolean; sortOrder: number; projectCount: number };
export type CategoryInput = Omit<AdminCategory, "id" | "sortOrder" | "projectCount">;

// What the admin saves for a card; the API adds the category slugs on read.
export type ServiceInput = Omit<Service, "category" | "fallback">;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function getToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string | null) {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked: the session simply will not survive a reload.
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${PUBLIC_API_URL}/api${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && path !== "/auth/login") {
    setToken(null);
    window.dispatchEvent(new Event("admin-logout"));
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = Array.isArray(data?.message) ? data.message.join("; ") : (data?.message ?? res.statusText);
    throw new ApiError(res.status, message);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export async function login(email: string, password: string) {
  const { accessToken } = await request<{ accessToken: string }>("POST", "/auth/login", { email, password });
  setToken(accessToken);
}

export function logout() {
  setToken(null);
}

export const admin = {
  projects: () => request<AdminProject[]>("GET", "/admin/projects"),
  createProject: (input: ProjectInput) => request<AdminProject>("POST", "/admin/projects", input),
  updateProject: (id: number, input: Partial<ProjectInput>) =>
    request<AdminProject>("PATCH", `/admin/projects/${id}`, input),
  deleteProject: (id: number) => request<void>("DELETE", `/admin/projects/${id}`),
  reorder: (ids: number[]) => request<AdminProject[]>("PUT", "/admin/projects/order", { ids }),
  profile: () => request<Profile>("GET", "/profile"),
  saveProfile: (profile: Profile) => request<Profile>("PUT", "/admin/profile", profile),
  services: () => request<Service[]>("GET", "/services"),
  saveServices: (items: ServiceInput[]) => request<Service[]>("PUT", "/admin/services", { items }),
  categories: () => request<AdminCategory[]>("GET", "/admin/categories"),
  createCategory: (input: CategoryInput) => request<AdminCategory>("POST", "/admin/categories", input),
  updateCategory: (id: number, input: Partial<CategoryInput>) =>
    request<AdminCategory>("PATCH", `/admin/categories/${id}`, input),
  deleteCategory: (id: number) => request<void>("DELETE", `/admin/categories/${id}`),
  reorderCategories: (ids: number[]) => request<AdminCategory[]>("PUT", "/admin/categories/order", { ids }),
  seo: () => request<Seo>("GET", "/seo"),
  saveSeo: (seo: Seo) => request<Seo>("PUT", "/admin/seo", seo),
};

type Presign =
  | { mode: "local" }
  | { mode: "s3"; url: string; fields: Record<string, string>; key: string };

// Sends a form with upload progress; fetch cannot report it.
function send(url: string, form: FormData, headers: Record<string, string>, onProgress: (p: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve(xhr.responseText);
      if (xhr.status === 401 && headers.Authorization) {
        setToken(null);
        window.dispatchEvent(new Event("admin-logout"));
      }
      reject(new ApiError(xhr.status, xhr.responseText.slice(0, 200) || "Загрузка не удалась"));
    };
    xhr.onerror = () => reject(new ApiError(0, "Сеть недоступна или хранилище не разрешает загрузку (CORS)"));
    xhr.send(form);
  });
}

// Uploads a video or image: straight to the S3 bucket when it is configured, else through the API.
// Returns the URL to store in the project or profile.
export async function uploadMedia(file: File, onProgress: (p: number) => void): Promise<string> {
  const presign = await request<Presign>("POST", "/admin/uploads/presign", {
    contentType: file.type,
    size: file.size,
  });

  if (presign.mode === "s3") {
    const form = new FormData();
    Object.entries(presign.fields).forEach(([k, v]) => form.append(k, v));
    form.append("file", file); // must be the last field of an S3 POST
    await send(presign.url, form, {}, onProgress);
    const { url } = await request<{ url: string }>("POST", "/admin/uploads/confirm", { key: presign.key });
    return url;
  }

  const form = new FormData();
  form.append("file", file);
  const token = getToken();
  const body = await send(
    `${PUBLIC_API_URL}/api/admin/uploads`,
    form,
    token ? { Authorization: `Bearer ${token}` } : {},
    onProgress,
  );
  return (JSON.parse(body) as { url: string }).url;
}

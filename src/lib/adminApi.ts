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

export type DiskUsage = {
  usedBytes: number;
  files: number;
  freeBytes: number;
  totalBytes: number;
  minFreeBytes: number;
  maxVideoBytes: number;
  maxImageBytes: number;
};

export const diskUsage = () => request<DiskUsage>("GET", "/admin/uploads/usage");

export function formatBytes(bytes: number): string {
  const units = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

// Sends a form with upload progress; fetch cannot report it.
function send(url: string, form: FormData, onProgress: (p: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const token = getToken();
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve(xhr.responseText);
      if (xhr.status === 401) {
        setToken(null);
        window.dispatchEvent(new Event("admin-logout"));
      }
      let message = "Загрузка не удалась";
      try {
        message = (JSON.parse(xhr.responseText) as { message?: string }).message ?? message;
      } catch {
        // Not JSON, e.g. an error page from the proxy.
      }
      reject(new ApiError(xhr.status, message));
    };
    xhr.onerror = () => reject(new ApiError(0, "Сеть недоступна или соединение оборвалось"));
    xhr.send(form);
  });
}

// Uploads a video or image to the server's disk and returns the URL to store in the project or profile.
// Limits are checked first, so a too-large file is not sent for nothing.
export async function uploadMedia(file: File, onProgress: (p: number) => void): Promise<string> {
  const usage = await diskUsage();
  const limit = file.type.startsWith("video/") ? usage.maxVideoBytes : usage.maxImageBytes;
  if (file.size > limit) throw new ApiError(413, `Файл больше ${formatBytes(limit)}`);
  if (file.size > usage.freeBytes - usage.minFreeBytes) throw new ApiError(507, "На сервере не хватает места");

  const form = new FormData();
  form.append("file", file);
  const body = await send(`${PUBLIC_API_URL}/api/admin/uploads`, form, onProgress);
  return (JSON.parse(body) as { url: string }).url;
}

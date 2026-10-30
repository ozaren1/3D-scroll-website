"use client";

import { useCallback, useEffect, useState } from "react";
import { admin, type AdminCategory, type AdminProject, type ProjectInput } from "@/lib/adminApi";
import { resolveMediaUrl } from "@/lib/api";
import MediaField from "./MediaField";
import { slugify } from "./slugify";
import styles from "./admin.module.scss";

const EMPTY: ProjectInput = {
  slug: "",
  title: "",
  client: null,
  year: new Date().getFullYear(),
  category: "",
  orientation: "horizontal",
  summary: "",
  videoUrl: "",
  posterUrl: null,
  published: true,
};

export default function WorksAdmin() {
  const [projects, setProjects] = useState<AdminProject[] | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [editing, setEditing] = useState<{ id: number | null; input: ProjectInput } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, cats] = await Promise.all([admin.projects(), admin.categories()]);
      setProjects(list);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить работы");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function move(index: number, delta: number) {
    if (!projects) return;
    const next = [...projects];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setProjects(next);
    try {
      setProjects(await admin.reorder(next.map((p) => p.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось изменить порядок");
      void load();
    }
  }

  async function togglePublished(project: AdminProject) {
    try {
      const updated = await admin.updateProject(project.id, { published: !project.published });
      setProjects((list) => list?.map((p) => (p.id === updated.id ? updated : p)) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
    }
  }

  async function remove(project: AdminProject) {
    if (!window.confirm(`Удалить «${project.title}»? Это нельзя отменить.`)) return;
    try {
      await admin.deleteProject(project.id);
      setProjects((list) => list?.filter((p) => p.id !== project.id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить");
    }
  }

  if (editing) {
    return (
      <ProjectForm
        categories={categories}
        initial={editing.input}
        isNew={editing.id === null}
        onCancel={() => setEditing(null)}
        onSave={async (input) => {
          if (editing.id === null) await admin.createProject(input);
          else await admin.updateProject(editing.id, input);
          setEditing(null);
          await load();
        }}
      />
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h1 className={styles.h1}>Работы</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setEditing({ id: null, input: { ...EMPTY, category: categories[0]?.slug ?? "" } })}
        >
          + Добавить работу
        </button>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {projects === null ? (
        <p className={styles.muted}>Загрузка…</p>
      ) : projects.length === 0 ? (
        <p className={styles.muted}>Работ пока нет.</p>
      ) : (
        <ul className={styles.list}>
          {projects.map((p, i) => (
            <li key={p.id} className={styles.row} data-draft={!p.published || undefined}>
              <div className={styles.thumb}>
                {p.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveMediaUrl(p.posterUrl) ?? ""} alt="" />
                ) : (
                  <video src={`${resolveMediaUrl(p.videoUrl)}#t=0.5`} muted playsInline preload="metadata" />
                )}
              </div>
              <div className={styles.rowText}>
                <strong>{p.title}</strong>
                <span className={styles.muted}>
                  {p.year} · {categories.find((c) => c.slug === p.category)?.label ?? p.category}{" "}
                  {p.client ? `· ${p.client}` : ""}
                  {!p.published && " · черновик"}
                </span>
              </div>
              <div className={styles.rowActions}>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Выше">
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === projects.length - 1}
                  aria-label="Ниже"
                >
                  ↓
                </button>
                <button type="button" onClick={() => togglePublished(p)}>
                  {p.published ? "Скрыть" : "Показать"}
                </button>
                <button type="button" onClick={() => setEditing({ id: p.id, input: toInput(p) })}>
                  Изменить
                </button>
                <button type="button" className={styles.danger} onClick={() => remove(p)}>
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function toInput(p: AdminProject): ProjectInput {
  const { id: _id, sortOrder: _sortOrder, ...rest } = p;
  return rest;
}

function ProjectForm({
  categories,
  initial,
  isNew,
  onSave,
  onCancel,
}: {
  categories: AdminCategory[];
  initial: ProjectInput;
  isNew: boolean;
  onSave: (input: ProjectInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [input, setInput] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) =>
    setInput((v) => ({ ...v, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSave({ ...input, client: input.client?.trim() || null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
      setBusy(false);
    }
  }

  return (
    <form className={styles.section} onSubmit={submit}>
      <div className={styles.sectionHead}>
        <h1 className={styles.h1}>{isNew ? "Новая работа" : `Работа: ${initial.title}`}</h1>
      </div>

      {categories.length === 0 && (
        <p className={styles.error}>Сначала создайте хотя бы одну категорию во вкладке «Категории».</p>
      )}
      <div className={styles.grid2}>
        <label className={styles.field}>
          <span>Название</span>
          <input
            className={styles.input}
            value={input.title}
            required
            maxLength={120}
            onChange={(e) => {
              set("title", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
          />
        </label>
        <label className={styles.field}>
          <span>Адрес (slug, латиницей)</span>
          <input
            className={styles.input}
            value={input.slug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={80}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
          />
        </label>
        <label className={styles.field}>
          <span>Клиент</span>
          <input
            className={styles.input}
            value={input.client ?? ""}
            maxLength={120}
            onChange={(e) => set("client", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Год</span>
          <input
            className={styles.input}
            type="number"
            min={1990}
            max={2100}
            required
            value={input.year}
            onChange={(e) => set("year", Number(e.target.value))}
          />
        </label>
        <label className={styles.field}>
          <span>Категория</span>
          <select
            className={styles.input}
            value={input.category}
            required
            onChange={(e) => set("category", e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.label}
                {c.visible ? "" : " (скрыта)"}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Кадр</span>
          <select
            className={styles.input}
            value={input.orientation}
            onChange={(e) => set("orientation", e.target.value as ProjectInput["orientation"])}
          >
            <option value="horizontal">Горизонтальный 16:9</option>
            <option value="vertical">Вертикальный 9:16</option>
          </select>
        </label>
      </div>

      <label className={styles.field}>
        <span>Описание</span>
        <textarea
          className={styles.input}
          rows={3}
          maxLength={600}
          value={input.summary}
          onChange={(e) => set("summary", e.target.value)}
        />
      </label>

      <MediaField label="Видео" kind="video" value={input.videoUrl || null} required onChange={(url) => set("videoUrl", url ?? "")} />
      <MediaField label="Постер (обложка)" kind="image" value={input.posterUrl} onChange={(url) => set("posterUrl", url)} />

      <label className={styles.check}>
        <input type="checkbox" checked={input.published} onChange={(e) => set("published", e.target.checked)} />
        <span>Показывать на сайте</span>
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.formActions}>
        <button type="submit" className="btn btn-primary" disabled={busy || !input.videoUrl}>
          {busy ? "Сохраняю…" : "Сохранить"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { admin, type AdminCategory, type CategoryInput } from "@/lib/adminApi";
import { slugify } from "./slugify";
import styles from "./admin.module.scss";

const EMPTY: CategoryInput = { slug: "", label: "", title: "", seoTitle: "", seoDescription: "", visible: true };

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [editing, setEditing] = useState<{ id: number | null; input: CategoryInput } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCategories(await admin.categories());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить категории");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не получилось");
    }
  }

  function move(index: number, delta: number) {
    if (!categories) return;
    const ids = categories.map((c) => c.id);
    const [id] = ids.splice(index, 1);
    ids.splice(index + delta, 0, id);
    void run(() => admin.reorderCategories(ids));
  }

  if (editing) {
    return (
      <CategoryForm
        initial={editing.input}
        isNew={editing.id === null}
        onCancel={() => setEditing(null)}
        onSave={async (input) => {
          if (editing.id === null) await admin.createCategory(input);
          else await admin.updateCategory(editing.id, input);
          setEditing(null);
          await load();
        }}
      />
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h1 className={styles.h1}>Категории работ</h1>
        <button type="button" className="btn btn-primary" onClick={() => setEditing({ id: null, input: EMPTY })}>
          + Добавить категорию
        </button>
      </div>
      <p className={styles.muted}>
        Скрытая категория не показывается в фильтре, а её страница недоступна; работы из неё остаются в «Все
        работы». Удалить можно только пустую категорию.
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {categories === null ? (
        <p className={styles.muted}>Загрузка…</p>
      ) : (
        <ul className={styles.list}>
          {categories.map((c, i) => (
            <li key={c.id} className={`${styles.row} ${styles.rowNoThumb}`} data-draft={!c.visible || undefined}>
              <div className={styles.rowText}>
                <strong>{c.label}</strong>
                <span className={styles.muted}>
                  /works/{c.slug} · работ: {c.projectCount}
                  {!c.visible && " · скрыта"}
                </span>
              </div>
              <div className={styles.rowActions}>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Выше">
                  ↑
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === categories.length - 1} aria-label="Ниже">
                  ↓
                </button>
                <button type="button" onClick={() => run(() => admin.updateCategory(c.id, { visible: !c.visible }))}>
                  {c.visible ? "Скрыть" : "Показать"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const { id: _id, sortOrder: _s, projectCount: _p, ...input } = c;
                    setEditing({ id: c.id, input });
                  }}
                >
                  Изменить
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  disabled={c.projectCount > 0}
                  title={c.projectCount > 0 ? "Сначала перенесите работы в другую категорию" : undefined}
                  onClick={() => {
                    if (window.confirm(`Удалить категорию «${c.label}»?`)) void run(() => admin.deleteCategory(c.id));
                  }}
                >
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

function CategoryForm({
  initial,
  isNew,
  onSave,
  onCancel,
}: {
  initial: CategoryInput;
  isNew: boolean;
  onSave: (input: CategoryInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [input, setInput] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof CategoryInput>(key: K, value: CategoryInput[K]) =>
    setInput((v) => ({ ...v, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSave(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
      setBusy(false);
    }
  }

  return (
    <form className={styles.section} onSubmit={submit}>
      <div className={styles.sectionHead}>
        <h1 className={styles.h1}>{isNew ? "Новая категория" : `Категория: ${initial.label}`}</h1>
      </div>
      <div className={styles.grid2}>
        <label className={styles.field}>
          <span>Название в фильтре</span>
          <input
            className={styles.input}
            value={input.label}
            required
            maxLength={40}
            placeholder="Моушен"
            onChange={(e) => {
              set("label", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
          />
        </label>
        <label className={styles.field}>
          <span>Адрес: /works/…</span>
          <input
            className={styles.input}
            value={input.slug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={60}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
          />
        </label>
      </div>
      <label className={styles.field}>
        <span>Заголовок страницы категории</span>
        <input className={styles.input} value={input.title} required maxLength={120} placeholder="Моушен-дизайн" onChange={(e) => set("title", e.target.value)} />
      </label>
      {!isNew && initial.slug !== input.slug && (
        <p className={styles.muted}>Старый адрес /works/{initial.slug} перестанет открываться — проверьте ссылки, если где-то им делились.</p>
      )}

      <fieldset className={styles.fieldset}>
        <legend>SEO</legend>
        <label className={styles.field}>
          <span>Title (пусто — заголовок страницы)</span>
          <input className={styles.input} value={input.seoTitle} maxLength={120} onChange={(e) => set("seoTitle", e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Description</span>
          <textarea className={styles.input} rows={3} maxLength={300} value={input.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
        </label>
        <span className={styles.muted}>{input.seoDescription.length} / 300 · в поиске обычно видно ~160 символов</span>
      </fieldset>

      <label className={styles.check}>
        <input type="checkbox" checked={input.visible} onChange={(e) => set("visible", e.target.checked)} />
        <span>Показывать на сайте</span>
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.formActions}>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Сохраняю…" : "Сохранить"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  );
}

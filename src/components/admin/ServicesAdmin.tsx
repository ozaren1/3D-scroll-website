"use client";

import { useEffect, useState } from "react";
import { admin, type AdminCategory, type AdminProject, type ServiceInput } from "@/lib/adminApi";
import styles from "./admin.module.scss";

const NEW_CARD: ServiceInput = { title: "", text: "", tags: [], projectId: null, categoryId: null, fallbackId: null };

const toId = (value: string) => (value ? Number(value) : null);

export default function ServicesAdmin() {
  const [items, setItems] = useState<ServiceInput[] | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([admin.services(), admin.categories(), admin.projects()])
      .then(([services, cats, works]) => {
        setItems(services.map(({ category: _c, fallback: _f, ...rest }) => rest));
        setCategories(cats);
        setProjects(works);
      })
      .catch((err) => setStatus({ kind: "error", text: err.message }));
  }, []);

  if (!items) return <p className={styles.muted}>{status?.text ?? "Загрузка…"}</p>;

  const update = (i: number, patch: Partial<ServiceInput>) =>
    setItems((list) => list?.map((s, j) => (j === i ? { ...s, ...patch } : s)) ?? null);
  const move = (i: number, delta: number) =>
    setItems((list) => {
      if (!list) return list;
      const next = [...list];
      const [item] = next.splice(i, 1);
      next.splice(i + delta, 0, item);
      return next;
    });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!items) return;
    setBusy(true);
    setStatus(null);
    try {
      const saved = await admin.saveServices(items);
      setItems(saved.map(({ category: _c, fallback: _f, ...rest }) => rest));
      setStatus({ kind: "ok", text: "Сохранено" });
    } catch (err) {
      setStatus({ kind: "error", text: err instanceof Error ? err.message : "Не удалось сохранить" });
    } finally {
      setBusy(false);
    }
  }

  const categorySelect = (value: number | null, onChange: (id: number | null) => void, empty: string) => (
    <select className={styles.input} value={value ?? ""} onChange={(e) => onChange(toId(e.target.value))}>
      <option value="">{empty}</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.label}
          {c.visible ? "" : " (скрыта)"}
        </option>
      ))}
    </select>
  );

  return (
    <form className={styles.section} onSubmit={submit}>
      <div className={styles.sectionHead}>
        <h1 className={styles.h1}>Что я делаю</h1>
        {items.length < 12 && (
          <button type="button" className="btn btn-ghost" onClick={() => setItems([...items, NEW_CARD])}>
            + Добавить карточку
          </button>
        )}
      </div>
      <p className={styles.muted}>
        Под карточкой показывается выбранная работа. Если работа не выбрана — первая работа категории, а если в
        ней пусто — из запасной категории. Ссылка «Все работы» ведёт на страницу категории.
      </p>

      <ol className={styles.cards}>
        {items.map((s, i) => (
          <li key={i} className={`${styles.cardEdit} panel`}>
            <div className={styles.grid2}>
              <label className={styles.field}>
                <span>Заголовок</span>
                <input className={styles.input} value={s.title} required maxLength={80} onChange={(e) => update(i, { title: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Теги через запятую (до 6)</span>
                <input
                  className={styles.input}
                  value={s.tags.join(", ")}
                  onChange={(e) =>
                    update(i, {
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trimStart().slice(0, 24))
                        .slice(0, 6),
                    })
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Работа под карточкой</span>
                <select className={styles.input} value={s.projectId ?? ""} onChange={(e) => update(i, { projectId: toId(e.target.value) })}>
                  <option value="">Автоматически — по категории</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                      {p.published ? "" : " (скрыта)"}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Категория (ссылка «Все работы»)</span>
                {categorySelect(s.categoryId, (id) => update(i, { categoryId: id }), "Без категории")}
              </label>
              <label className={styles.field}>
                <span>Запасная категория</span>
                {categorySelect(s.fallbackId, (id) => update(i, { fallbackId: id }), "Нет")}
              </label>
            </div>
            <label className={styles.field}>
              <span>Текст</span>
              <textarea className={styles.input} rows={2} maxLength={400} value={s.text} onChange={(e) => update(i, { text: e.target.value })} />
            </label>
            <div className={styles.rowActions}>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Выше">
                ↑
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Ниже">
                ↓
              </button>
              <button type="button" className={styles.danger} onClick={() => setItems(items.filter((_, j) => j !== i))}>
                Удалить карточку
              </button>
            </div>
          </li>
        ))}
      </ol>

      {status && (
        <p className={status.kind === "ok" ? styles.ok : styles.error} role="status">
          {status.text}
        </p>
      )}
      <div className={styles.formActions}>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Сохраняю…" : "Сохранить карточки"}
        </button>
      </div>
    </form>
  );
}

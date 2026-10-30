"use client";

import { useEffect, useState } from "react";
import { admin } from "@/lib/adminApi";
import type { Seo } from "@/lib/types";
import styles from "./admin.module.scss";

const PAGES: { key: keyof Seo; label: string; path: string }[] = [
  { key: "home", label: "Главная", path: "/" },
  { key: "works", label: "Все работы", path: "/works" },
  { key: "about", label: "Обо мне", path: "/about" },
  { key: "privacy", label: "Конфиденциальность", path: "/privacy" },
];

// Meta tags of the fixed pages; categories have their own in «Категории».
export default function SeoAdmin() {
  const [seo, setSeo] = useState<Seo | null>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    admin
      .seo()
      .then(setSeo)
      .catch((err) => setStatus({ kind: "error", text: err.message }));
  }, []);

  if (!seo) return <p className={styles.muted}>{status?.text ?? "Загрузка…"}</p>;

  const set = (page: keyof Seo, field: "title" | "description", value: string) =>
    setSeo((s) => (s ? { ...s, [page]: { ...s[page], [field]: value } } : s));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!seo) return;
    setBusy(true);
    setStatus(null);
    try {
      setSeo(await admin.saveSeo(seo));
      setStatus({ kind: "ok", text: "Сохранено" });
    } catch (err) {
      setStatus({ kind: "error", text: err instanceof Error ? err.message : "Не удалось сохранить" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.section} onSubmit={submit}>
      <div className={styles.sectionHead}>
        <h1 className={styles.h1}>Страницы и SEO</h1>
      </div>
      <p className={styles.muted}>Пустые поля заполняются автоматически: из имени, роли и текстов профиля.</p>

      {PAGES.map(({ key, label, path }) => (
        <fieldset key={key} className={styles.fieldset}>
          <legend>
            {label} · {path}
          </legend>
          <label className={styles.field}>
            <span>Title</span>
            <input className={styles.input} value={seo[key].title} maxLength={120} onChange={(e) => set(key, "title", e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Description</span>
            <textarea
              className={styles.input}
              rows={2}
              maxLength={300}
              value={seo[key].description}
              onChange={(e) => set(key, "description", e.target.value)}
            />
          </label>
          <span className={styles.muted}>{seo[key].description.length} / 300 · в поиске обычно видно ~160 символов</span>
        </fieldset>
      ))}

      {status && (
        <p className={status.kind === "ok" ? styles.ok : styles.error} role="status">
          {status.text}
        </p>
      )}
      <div className={styles.formActions}>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Сохраняю…" : "Сохранить"}
        </button>
      </div>
    </form>
  );
}

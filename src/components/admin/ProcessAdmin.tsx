"use client";

import { useEffect, useState } from "react";
import { admin } from "@/lib/adminApi";
import type { ProcessStep } from "@/lib/types";
import styles from "./admin.module.scss";

const MAX_STEPS = 8;

export default function ProcessAdmin() {
  const [items, setItems] = useState<ProcessStep[] | null>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    admin
      .process()
      .then(setItems)
      .catch((err) => setStatus({ kind: "error", text: err.message }));
  }, []);

  if (!items) return <p className={styles.muted}>{status?.text ?? "Загрузка…"}</p>;

  const update = (i: number, patch: Partial<ProcessStep>) =>
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
      setItems(await admin.saveProcess(items));
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
        <h1 className={styles.h1}>Как идёт работа</h1>
        {items.length < MAX_STEPS && (
          <button type="button" className="btn btn-ghost" onClick={() => setItems([...items, { title: "", time: "" }])}>
            + Добавить этап
          </button>
        )}
      </div>
      <p className={styles.muted}>Этапы показываются на главной и на странице «Обо мне». Без этапов блок скрыт.</p>

      <ol className={styles.cards}>
        {items.map((step, i) => (
          <li key={i} className={`${styles.cardEdit} panel`}>
            <div className={styles.grid2}>
              <label className={styles.field}>
                <span>Этап</span>
                <input className={styles.input} value={step.title} required maxLength={80} onChange={(e) => update(i, { title: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Срок или примечание</span>
                <input className={styles.input} value={step.time} maxLength={40} onChange={(e) => update(i, { time: e.target.value })} />
              </label>
            </div>
            <div className={styles.rowActions}>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Выше">
                ↑
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Ниже">
                ↓
              </button>
              <button type="button" className={styles.danger} onClick={() => setItems(items.filter((_, j) => j !== i))}>
                Удалить этап
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
          {busy ? "Сохраняю…" : "Сохранить этапы"}
        </button>
      </div>
    </form>
  );
}

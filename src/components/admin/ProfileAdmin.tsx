"use client";

import { useEffect, useState } from "react";
import { admin } from "@/lib/adminApi";
import type { Profile } from "@/lib/types";
import MediaField from "./MediaField";
import styles from "./admin.module.scss";

// Meta platforms (Instagram, Facebook, WhatsApp) — see the note above the links.
const RISKY = /(^|\.|\/)(instagram\.com|instagr\.am|facebook\.com|fb\.com|whatsapp\.com|wa\.me)(\/|$)/i;

export default function ProfileAdmin() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    admin
      .profile()
      .then(setProfile)
      .catch((err) => setStatus({ kind: "error", text: err.message }));
  }, []);

  if (!profile) return <p className={styles.muted}>{status?.text ?? "Загрузка…"}</p>;

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((p) => (p ? { ...p, [key]: value } : p));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    setStatus(null);
    try {
      setProfile(
        await admin.saveProfile({ ...profile, socials: profile.socials.filter((s) => s.label && s.url) }),
      );
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
        <h1 className={styles.h1}>Обо мне</h1>
      </div>

      <div className={styles.grid2}>
        <label className={styles.field}>
          <span>Имя и фамилия</span>
          <input
            className={styles.input}
            value={profile.name}
            required
            maxLength={80}
            onChange={(e) => set("name", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Роль</span>
          <input
            className={styles.input}
            value={profile.role}
            required
            maxLength={120}
            onChange={(e) => set("role", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Город и география</span>
          <input
            className={styles.input}
            value={profile.location}
            maxLength={120}
            placeholder="Москва · работаю по всей России"
            onChange={(e) => set("location", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Статус в шапке (пусто — скрыть)</span>
          <input
            className={styles.input}
            value={profile.availability ?? ""}
            maxLength={80}
            placeholder="Беру проекты на ноябрь"
            onChange={(e) => set("availability", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Почта</span>
          <input
            className={styles.input}
            type="email"
            value={profile.email}
            required
            onChange={(e) => set("email", e.target.value)}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span>Короткое заявление (первый экран)</span>
        <input
          className={styles.input}
          value={profile.tagline}
          maxLength={200}
          onChange={(e) => set("tagline", e.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span>Текст «Обо мне»</span>
        <textarea
          className={styles.input}
          rows={6}
          maxLength={3000}
          value={profile.about}
          onChange={(e) => set("about", e.target.value)}
        />
      </label>

      <MediaField
        label="Шоурил (пусто — первая работа)"
        kind="video"
        value={profile.showreelUrl}
        onChange={(url) => set("showreelUrl", url)}
      />

      <fieldset className={styles.fieldset}>
        <legend>Ссылки</legend>
        <p className={styles.muted}>
          Не размещайте Instagram и Facebook: Meta признана в России экстремистской, их логотипы и реклама
          запрещены. WhatsApp с 2026 года доступен только через VPN. Надёжнее: Telegram, ВКонтакте, VK Видео,
          Rutube.
        </p>
        {profile.socials.map((s, i) => (
          <div key={i} className={styles.socialBlock}>
            <div className={styles.socialRow}>
              <input
                className={styles.input}
                value={s.label}
                placeholder="Telegram"
                maxLength={40}
                aria-label="Название"
                onChange={(e) =>
                  set(
                    "socials",
                    profile.socials.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                  )
                }
              />
              <input
                className={styles.input}
                value={s.url}
                placeholder="https://t.me/…"
                aria-label="Ссылка"
                onChange={(e) =>
                  set(
                    "socials",
                    profile.socials.map((x, j) => (j === i ? { ...x, url: e.target.value.trim() } : x)),
                  )
                }
              />
              <button
                type="button"
                className={styles.danger}
                onClick={() =>
                  set(
                    "socials",
                    profile.socials.filter((_, j) => j !== i),
                  )
                }
                aria-label="Убрать ссылку"
              >
                ✕
              </button>
            </div>
            {RISKY.test(s.url) && (
              <p className={styles.error}>
                Эта площадка запрещена или заблокирована в России — лучше убрать ссылку.
              </p>
            )}
          </div>
        ))}
        {profile.socials.length < 12 && (
          <button
            type="button"
            className={styles.link}
            onClick={() => set("socials", [...profile.socials, { label: "", url: "" }])}
          >
            + Добавить ссылку
          </button>
        )}
      </fieldset>

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

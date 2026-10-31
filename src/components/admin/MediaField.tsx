"use client";

import { useState } from "react";
import { uploadMedia } from "@/lib/adminApi";
import { resolveMediaUrl } from "@/lib/api";
import styles from "./admin.module.scss";

const ACCEPT = {
  video: "video/mp4,video/webm",
  image: "image/jpeg,image/png,image/webp",
};

// A media URL with an upload button: the file goes to the server's disk and the field gets its URL.
export default function MediaField({
  label,
  kind,
  value,
  onChange,
  required = false,
}: {
  label: string;
  kind: "video" | "image";
  value: string | null;
  onChange: (url: string | null) => void;
  required?: boolean;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preview = resolveMediaUrl(value);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      onChange(await uploadMedia(file, setProgress));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Загрузка не удалась");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className={styles.media}>
      <span className={styles.mediaLabel}>{label}</span>
      <div className={styles.mediaRow}>
        <div className={styles.mediaPreview}>
          {preview &&
            (kind === "video" ? (
              <video src={`${preview}#t=0.5`} muted playsInline preload="metadata" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" />
            ))}
        </div>
        <div className={styles.mediaControls}>
          <input
            className={styles.input}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value.trim() || null)}
            placeholder={kind === "video" ? "https://… или /media/….mp4" : "https://… или /media/….jpg"}
            required={required}
            aria-label={`${label}: адрес файла`}
          />
          <div className={styles.mediaButtons}>
            <label className={styles.upload}>
              <input type="file" accept={ACCEPT[kind]} onChange={pick} disabled={progress !== null} />
              {progress === null ? "Загрузить файл" : `Загрузка ${Math.round(progress * 100)}%`}
            </label>
            {value && !required && (
              <button type="button" className={styles.link} onClick={() => onChange(null)}>
                Убрать
              </button>
            )}
          </div>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

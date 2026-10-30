"use client";

import { useEffect, useRef } from "react";
import { useCategoryLabel } from "@/lib/categories";
import type { Project } from "@/lib/types";
import styles from "./Player.module.scss";

// Full-screen viewer with sound; a native <dialog> gives focus trapping and Esc for free.
export default function Player({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const label = useCategoryLabel();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (project && !dialog.open) dialog.showModal();
    if (!project && dialog.open) dialog.close();
  }, [project]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="player-title"
    >
      {project && (
        <div className={styles.body}>
          <video
            className={styles.video}
            data-orientation={project.orientation}
            src={project.videoUrl}
            poster={project.posterUrl ?? undefined}
            controls
            autoPlay
            playsInline
          />
          <div className={styles.meta}>
            <h2 id="player-title" className={styles.title}>
              {project.title}
            </h2>
            <p className={styles.facts}>
              {project.year} · {label(project.category)}
              {project.client ? ` · ${project.client}` : ""}
            </p>
            {project.summary && <p className={styles.summary}>{project.summary}</p>}
            <button type="button" className={styles.close} onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

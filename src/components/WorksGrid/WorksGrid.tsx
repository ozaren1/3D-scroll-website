"use client";

import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";
import { usePlayer } from "@/lib/player";
import { CATEGORIES, CATEGORY_LABEL, CATEGORY_TITLE, type Category, type Project } from "@/lib/types";
import styles from "./WorksGrid.module.scss";

// All works with a category filter; the choice is mirrored in ?category= so it can be shared.
export default function WorksGrid({
  projects,
  initialCategory,
}: {
  projects: Project[];
  initialCategory: Category | null;
}) {
  const [category, setCategory] = useState<Category | null>(initialCategory);
  const play = usePlayer();

  const counts = new Map<Category, number>();
  projects.forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1));
  const shown = category ? projects.filter((p) => p.category === category) : projects;

  const choose = (next: Category | null) => {
    setCategory(next);
    const url = next ? `/works?category=${next}` : "/works";
    window.history.replaceState(null, "", url);
  };

  return (
    <section className={styles.works} aria-labelledby="works-title">
      <p className={`${styles.index} hud`} aria-hidden="true">
        {`ARCHIVE // ${projects.length} FILES`}
      </p>
      <h1 id="works-title" className={`${styles.title} display glitch`} data-text="Все работы">
        Все работы
      </h1>

      <div className={styles.filters} role="group" aria-label="Категории">
        <button
          type="button"
          className={clsx(styles.filter, !category && styles.active)}
          aria-pressed={!category}
          onClick={() => choose(null)}
        >
          Все <span className="hud">{projects.length}</span>
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={clsx(styles.filter, category === c && styles.active)}
            aria-pressed={category === c}
            onClick={() => choose(c)}
          >
            {CATEGORY_LABEL[c]} <span className="hud">{counts.get(c) ?? 0}</span>
          </button>
        ))}
      </div>

      <h2 className={styles.subtitle} aria-live="polite">
        {category ? CATEGORY_TITLE[category] : "Все категории"}
      </h2>

      {shown.length === 0 ? (
        <p className={`${styles.empty} panel`}>
          В этой категории работ пока нет. Посмотрите{" "}
          <button type="button" className={styles.link} onClick={() => choose(null)}>
            все работы
          </button>{" "}
          или <Link href="/#contact">напишите</Link>, если нужен такой ролик.
        </p>
      ) : (
        <ul className={styles.grid}>
          {shown.map((project) => (
            <li key={project.id} className={clsx(project.orientation === "vertical" && styles.tall)}>
              <button
                type="button"
                className={styles.card}
                onClick={() => play(project)}
                aria-label={`Смотреть «${project.title}» со звуком`}
              >
                <span className={styles.media}>
                  {project.posterUrl ? (
                    // Posters may live on the API host; plain <img> avoids configuring next/image domains.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={project.posterUrl} alt="" loading="lazy" />
                  ) : (
                    <video src={`${project.videoUrl}#t=0.5`} muted playsInline preload="metadata" />
                  )}
                  <span className={styles.play} aria-hidden="true">
                    ▶
                  </span>
                </span>
                <span className={`${styles.meta} hud`}>
                  {project.year}
                  {" // "}
                  {CATEGORY_LABEL[project.category]}
                  {project.client ? ` // ${project.client}` : ""}
                </span>
                <strong className={styles.cardTitle}>{project.title}</strong>
                {project.summary && <span className={styles.summary}>{project.summary}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

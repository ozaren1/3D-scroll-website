"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePlayer } from "@/lib/player";
import type { Category, Project } from "@/lib/types";
import styles from "./WorksGrid.module.scss";

// All works, or the works of one category; the filter is a row of links to /works/<slug>.
export default function WorksGrid({
  projects,
  categories,
  active,
}: {
  projects: Project[];
  categories: Category[];
  active: Category | null;
}) {
  const play = usePlayer();

  const counts = new Map<string, number>();
  projects.forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1));
  const shown = active ? projects.filter((p) => p.category === active.slug) : projects;
  const labelOf = (slug: string) => categories.find((c) => c.slug === slug)?.label ?? "";

  return (
    <section className={styles.works} aria-labelledby="works-title">
      <p className={`${styles.index} hud`} aria-hidden="true">
        {`ARCHIVE // ${projects.length} FILES`}
      </p>
      <h1 id="works-title" className={`${styles.title} display glitch`} data-text={active ? active.title : "Все работы"}>
        {active ? active.title : "Все работы"}
      </h1>

      <nav className={styles.filters} aria-label="Категории">
        <Link
          href="/works"
          className={clsx(styles.filter, !active && styles.active)}
          aria-current={!active ? "page" : undefined}
          scroll={false}
        >
          Все <span className="hud">{projects.length}</span>
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/works/${c.slug}`}
            className={clsx(styles.filter, active?.slug === c.slug && styles.active)}
            aria-current={active?.slug === c.slug ? "page" : undefined}
            scroll={false}
          >
            {c.label} <span className="hud">{counts.get(c.slug) ?? 0}</span>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className={`${styles.empty} panel`}>
          В этой категории работ пока нет. Посмотрите <Link href="/works">все работы</Link> или{" "}
          <Link href="/#contact">напишите</Link>, если нужен такой ролик.
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
                  {labelOf(project.category) ? ` // ${labelOf(project.category)}` : ""}
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

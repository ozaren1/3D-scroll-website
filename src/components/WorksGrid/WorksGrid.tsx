"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRef } from "react";
import { usePlayer } from "@/lib/player";
import type { Category, Project } from "@/lib/types";
import { usePrefersReducedMotion } from "@/lib/useReveal";
import { TiltCard } from "../TiltCard/TiltCard";
import styles from "./WorksGrid.module.scss";

// One work: the card leans towards the mouse and its video plays while the mouse is over it
// (or the card has keyboard focus). Leaving reloads the video, which restores the poster and
// stops the download. Touch screens just open the player.
function WorkCard({ project, meta, onOpen }: { project: Project; meta: string; onOpen: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const start = () => {
    if (!reduced) ref.current?.play().catch(() => undefined);
  };
  const stop = () => ref.current?.load();

  return (
    <button
      type="button"
      className={styles.card}
      onClick={onOpen}
      onPointerEnter={(e) => e.pointerType === "mouse" && start()}
      onPointerLeave={(e) => e.pointerType === "mouse" && stop()}
      onFocus={(e) => e.currentTarget.matches(":focus-visible") && start()}
      onBlur={stop}
      aria-label={`Смотреть «${project.title}» со звуком`}
    >
      <TiltCard className={styles.tilt} max={8}>
        <span className={styles.media}>
          <video
            ref={ref}
            src={`${project.videoUrl}#t=0.5`}
            poster={project.posterUrl ?? undefined}
            muted
            loop
            playsInline
            preload="metadata"
          />
          <span className={styles.play} aria-hidden="true">
            ▶
          </span>
        </span>
      </TiltCard>
      <span className={`${styles.meta} hud`}>{meta}</span>
      <strong className={styles.cardTitle}>{project.title}</strong>
      {project.summary && <span className={styles.summary}>{project.summary}</span>}
    </button>
  );
}

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
              <WorkCard
                project={project}
                meta={[String(project.year), labelOf(project.category), project.client ?? ""].filter(Boolean).join(" // ")}
                onOpen={() => play(project)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

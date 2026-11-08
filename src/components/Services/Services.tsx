"use client";

import Link from "next/link";
import { useRef } from "react";
import { usePlayer } from "@/lib/player";
import { useCategories } from "@/lib/categories";
import { usePrefersReducedMotion } from "@/lib/useReveal";
import type { Project, Service } from "@/lib/types";
import { TiltCard } from "../TiltCard/TiltCard";
import styles from "./Services.module.scss";

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

// The work shown under a service: the one chosen in the admin panel, else the first of its category,
// else the first of the fallback category. `own` is false only for the last case.
function exampleFor(service: Service, projects: Project[]) {
  const chosen = service.projectId ? projects.find((p) => p.id === service.projectId) : undefined;
  if (chosen) return { project: chosen, own: true };
  const own = projects.find((p) => p.category === service.category);
  if (own) return { project: own, own: true };
  const near = projects.find((p) => p.category === service.fallback) ?? projects[0];
  return near ? { project: near, own: false } : null;
}

// The example video: still until the mouse is over it or the card has keyboard focus. Leaving reloads
// the element, which brings the poster back and stops the download. Touch screens just open the player.
function ExampleButton({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const start = () => {
    if (!reduced) ref.current?.play().catch(() => undefined);
  };
  const stop = () => ref.current?.load();

  return (
    <button
      type="button"
      className={styles.media}
      onClick={onOpen}
      onPointerEnter={(e) => e.pointerType === "mouse" && start()}
      onPointerLeave={(e) => e.pointerType === "mouse" && stop()}
      onFocus={(e) => e.currentTarget.matches(":focus-visible") && start()}
      onBlur={stop}
      aria-label={`Смотреть пример: «${project.title}»`}
    >
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
    </button>
  );
}

export default function Services({ projects, services }: { projects: Project[]; services: Service[] }) {
  const play = usePlayer();
  const categories = useCategories();
  const categoryOf = (slug: string | null) => categories.find((c) => c.slug === slug);

  return (
    <section id="services" className={styles.services} aria-labelledby="services-title">
      <p className={`${styles.index} hud`} aria-hidden="true">
        {"MODULES // SERVICES"}
      </p>
      <h2 id="services-title" className={`${styles.title} display glitch`} data-text="Что я делаю" data-reveal>
        Что я делаю
      </h2>

      <ul className={styles.grid}>
        {services.map((service, i) => {
          const example = exampleFor(service, projects);
          const category = categoryOf(service.category);
          return (
            <li key={service.title} className={styles.item} data-reveal style={delay(i + 1)}>
              {example && (
                <TiltCard className={styles.tilt} max={6}>
                  <ExampleButton project={example.project} onOpen={() => play(example.project)} />
                </TiltCard>
              )}

              <article className={styles.body}>
                <h3 className={styles.cardTitle}>{service.title}</h3>
                <p className={styles.cardText}>{service.text}</p>
                {service.tags.length > 0 && (
                  <div className={styles.tags}>
                    {service.tags.map((tag) => (
                      <span key={tag} className="hud">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {example && (
                  <p className={styles.exampleLine}>
                    <span className="hud">
                      {example.own ? "Пример" : `Пока пример из «${categoryOf(example.project.category)?.label ?? ""}»`}
                    </span>{" "}
                    {example.project.title}
                  </p>
                )}
                {category && (
                  <Link className={styles.more} href={`/works/${category.slug}`}>
                    Все работы: {category.label} →
                  </Link>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

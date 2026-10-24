"use client";

import Link from "next/link";
import { services, type Service } from "@/app/data";
import { usePlayer } from "@/lib/player";
import { CATEGORY_LABEL, type Project } from "@/lib/types";
import { TiltCard, TiltItem } from "../TiltCard/TiltCard";
import styles from "./Services.module.scss";

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

// The work shown under a service: one of its own category, else one of the fallback category.
function exampleFor(service: Service, projects: Project[]) {
  const own = projects.find((p) => p.category === service.category);
  if (own) return { project: own, own: true };
  const near = projects.find((p) => p.category === service.fallback) ?? projects[0];
  return near ? { project: near, own: false } : null;
}

export default function Services({ projects }: { projects: Project[] }) {
  const play = usePlayer();

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
          return (
            <li key={service.title} className={styles.item} data-reveal style={delay(i + 1)}>
              <TiltCard className={styles.tilt} max={10}>
                <article className={styles.card}>
                  <TiltItem depth={50}>
                    <h3 className={styles.cardTitle}>{service.title}</h3>
                  </TiltItem>
                  <TiltItem depth={30}>
                    <p className={styles.cardText}>{service.text}</p>
                  </TiltItem>
                  <TiltItem depth={70} className={styles.tags}>
                    {service.tags.map((tag) => (
                      <span key={tag} className="hud">
                        {tag}
                      </span>
                    ))}
                  </TiltItem>
                </article>
              </TiltCard>

              {example && (
                <div className={styles.example}>
                  <button
                    type="button"
                    className={styles.exampleMedia}
                    onClick={() => play(example.project)}
                    aria-label={`Смотреть пример: «${example.project.title}»`}
                  >
                    {example.project.posterUrl ? (
                      // Posters may live on the API host; plain <img> avoids configuring next/image domains.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={example.project.posterUrl} alt="" loading="lazy" />
                    ) : (
                      <video src={`${example.project.videoUrl}#t=0.5`} muted playsInline preload="metadata" />
                    )}
                    <span className={styles.play} aria-hidden="true">
                      ▶
                    </span>
                  </button>
                  <div className={styles.exampleText}>
                    <span className={`${styles.exampleLabel} hud`}>
                      {example.own ? "Пример" : `Пока пример из «${CATEGORY_LABEL[example.project.category]}»`}
                    </span>
                    <strong>{example.project.title}</strong>
                    <Link className={styles.more} href={`/works?category=${service.category}`}>
                      Все работы: {CATEGORY_LABEL[service.category]} →
                    </Link>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

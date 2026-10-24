"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePlayer } from "@/lib/player";
import { CATEGORY_LABEL, type Project } from "@/lib/types";
import { usePrefersReducedMotion } from "@/lib/useReveal";
import styles from "./WorkSpiral.module.scss";

// Works as cards on a helix that turns around a central line while the page scrolls,
// after the "Our work" section of sybiosme.com. Scroll drives it; nothing is hijacked.
const PER_TURN = 7; // cards per full turn
const MIN_CARDS = 14; // repeat the works until the helix is this dense
const FRONT_DROP = 0.1; // the card facing the camera rides this far below the centre line (viewport heights)
const RISE = 0.16; // vertical step between cards, in viewport heights

function plural(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "работа";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "работы";
  return "работ";
}

export default function WorkSpiral({ projects }: { projects: Project[] }) {
  const onOpen = usePlayer();
  const wrapRef = useRef<HTMLElement>(null);
  const helixRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [front, setFront] = useState(0);
  const reduced = usePrefersReducedMotion();

  const cards = useMemo(() => {
    if (projects.length === 0) return [];
    const count = Math.max(MIN_CARDS, projects.length);
    return Array.from({ length: count }, (_, i) => ({ key: i, project: projects[i % projects.length] }));
  }, [projects]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const helix = helixRef.current;
    if (!wrap || !helix || reduced || cards.length === 0) return;

    const step = 360 / PER_TURN;
    const els = cardRefs.current;
    let target = 0;
    let current = -1;
    let raf = 0;
    let shown = -1;

    const measure = () => {
      const rect = wrap.getBoundingClientRect();
      const travel = Math.max(1, wrap.offsetHeight - window.innerHeight);
      target = Math.min(1, Math.max(0, -rect.top / travel));
    };

    const render = () => {
      current = current < 0 ? target : current + (target - current) * 0.1;
      if (Math.abs(target - current) < 0.0005) current = target;

      // The card at index `at` faces the camera just under the central line; later cards wait below and rise.
      const vh = window.innerHeight;
      const rise = RISE * vh;
      const at = current * (cards.length - 1);
      const turn = at * step;
      helix.style.setProperty("--rise", `${rise.toFixed(1)}px`); // same unit as the JS math, unlike svh
      helix.style.transform = `translateY(${(-at * rise + FRONT_DROP * vh).toFixed(1)}px) rotateY(${(-turn).toFixed(2)}deg)`;

      // Fade cards that face away from the camera; the one facing it gets the caption.
      let best = 0;
      let bestCos = -2;
      els.forEach((el, i) => {
        if (!el) return;
        const angle = ((i * step - turn) * Math.PI) / 180;
        const facing = Math.cos(angle);
        const vertical = 1 - Math.min(1, Math.abs((i - at) * rise) / (vh * 0.6));
        el.style.opacity = Math.max(0.08, (0.25 + 0.75 * Math.max(0, facing)) * (0.35 + 0.65 * vertical)).toFixed(3);
        const score = facing + vertical;
        if (score > bestCos) {
          bestCos = score;
          best = i;
        }
      });
      if (best !== shown) {
        shown = best;
        setFront(best);
      }

      raf = current === target ? 0 : requestAnimationFrame(render);
    };

    const onScroll = () => {
      measure();
      if (!raf) raf = requestAnimationFrame(render);
    };

    measure();
    render();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      helix.style.removeProperty("transform");
      els.forEach((el) => el?.style.removeProperty("opacity"));
    };
  }, [cards, reduced]);

  const frontProject = cards[front]?.project;

  // Keyboard focus: scroll the page so the focused card turns to face the camera.
  // The stage uses overflow: clip, so the browser cannot scroll it to reveal the card.
  const focusCard = (i: number) => {
    const wrap = wrapRef.current;
    if (!wrap || reduced || cards.length < 2) return;
    // The browser then scrolls the card into view on its own, asynchronously and smoothly; place
    // the page once that scroll has ended (or after a short wait when it does not happen).
    const place = () => {
      window.removeEventListener("scrollend", place);
      const travel = wrap.offsetHeight - window.innerHeight;
      const top = wrap.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + (i / (cards.length - 1)) * travel, behavior: "instant" });
    };
    window.addEventListener("scrollend", place, { once: true });
    window.setTimeout(place, 900);
  };

  return (
    <section
      id="work"
      ref={wrapRef}
      className={clsx(styles.work, reduced && styles.flat)}
      aria-labelledby="work-title"
    >
      <div className={styles.stage}>
        <div className={styles.center}>
          <h2 id="work-title" className={`${styles.title} display glitch`} data-text="Работы">
            Работы
          </h2>
          <p className={styles.line}>
            Монтаж, который <span className="accent">досматривают.</span>
          </p>
          <p className={`${styles.count} hud`}>
            {projects.length} {plural(projects.length)} · нажмите на карточку
          </p>
        </div>

        <div className={styles.space}>
          <div ref={helixRef} className={styles.helix}>
            {cards.map(({ key, project }, i) => (
              <button
                key={key}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                type="button"
                className={clsx(styles.card, project.orientation === "vertical" && styles.vertical)}
                style={
                  {
                    "--angle": `${(i * 360) / PER_TURN}deg`,
                    "--i": i,
                  } as React.CSSProperties
                }
                onClick={() => onOpen(project)}
                onFocus={() => focusCard(i)}
                aria-label={`Смотреть «${project.title}» со звуком`}
                tabIndex={i < projects.length ? 0 : -1}
                aria-hidden={i >= projects.length || undefined}
              >
                {project.posterUrl ? (
                  // Posters may live on the API host; plain <img> avoids configuring next/image domains.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.posterUrl} alt="" loading="lazy" />
                ) : (
                  <video src={`${project.videoUrl}#t=0.5`} muted playsInline preload="metadata" />
                )}
                <span className={`${styles.cardMeta} hud`}>
                  {project.year}{" // "}{CATEGORY_LABEL[project.category]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={`${styles.caption} panel`} aria-hidden="true">
          {frontProject && (
            <>
              <span className={`${styles.captionMeta} hud`}>
                {frontProject.year}{" // "}{CATEGORY_LABEL[frontProject.category]}
                {frontProject.client ? ` // ${frontProject.client}` : ""}
              </span>
              <strong>{frontProject.title}</strong>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

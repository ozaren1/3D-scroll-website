"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/lib/player";
import { useCategories, useCategoryLabel } from "@/lib/categories";
import type { Project, Service } from "@/lib/types";
import { usePrefersReducedMotion } from "@/lib/useReveal";
import styles from "./WorkReel.module.scss";

// The works as a vertical reel pinned to the screen while the page scrolls. Each work in turn
// stops in place, large, with the others hidden, and its details slide out from under it to the
// right. Scrolling on, the details slide back under the card, the reel moves up and the next work
// arrives from below. Scroll drives everything; nothing is hijacked.
const HOLD = 0.24; // share of each work's scroll run (either side of its stop) where it stands still
const FADE = 0.1; // the details slide in or out over the last part of the hold, so they are gone
// before the card moves and never show between the cards
const SETTLE_MS = 250; // a card must stay in front this long before its video loads

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function plural(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "работа";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "работы";
  return "работ";
}

// Plays one work muted over its card's poster. Clearing the source on unmount drops the download,
// so scrolling past many cards does not leave them all fetching.
function LiveVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.src = src;
    video.play().catch(() => undefined);
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  return (
    <video
      ref={ref}
      className={styles.live}
      muted
      loop
      playsInline
      aria-hidden="true"
      onPlaying={(e) => {
        e.currentTarget.dataset.playing = "";
      }}
    />
  );
}

// Which service a work illustrates: the one it was chosen for, else the one of its category,
// else the one that falls back to its category.
function serviceIndexOf(project: Project, services: Service[]) {
  const tests = [
    (s: Service) => s.projectId === project.id,
    (s: Service) => s.category === project.category,
    (s: Service) => s.fallback === project.category,
  ];
  for (const test of tests) {
    const i = services.findIndex(test);
    if (i >= 0) return i;
  }
  return -1;
}

export default function WorkReel({ projects, services }: { projects: Project[]; services: Service[] }) {
  const onOpen = usePlayer();
  const label = useCategoryLabel();
  const categories = useCategories();
  const wrapRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLUListElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [front, setFront] = useState(0);
  const [live, setLive] = useState<number | null>(null);
  // The service last chosen and the work it brought up. While that work is in front the chosen
  // service stays lit, even when the work belongs to another one (a fallback category); without
  // the animation (reduced motion) nothing is in front, so the chosen service is simply lit.
  const [picked, setPicked] = useState<{ service: number; card: number } | null>(null);
  const reduced = usePrefersReducedMotion();
  const count = projects.length;

  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage || reduced || count === 0) return;

    const els = cardRefs.current;
    let target = 0;
    let current = -1;
    let raf = 0;
    let shown = -1;

    const measure = () => {
      const rect = wrap.getBoundingClientRect();
      const travel = Math.max(1, wrap.offsetHeight - window.innerHeight);
      target = clamp(-rect.top / travel, 0, 1);
    };

    // The details column starts right of the card in front, whatever its width.
    const fitColumn = () => {
      const el = els[shown];
      if (el) stage.style.setProperty("--half", `${Math.round(el.offsetWidth / 2)}px`);
    };

    const render = () => {
      current = current < 0 ? target : current + (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0005) current = target;

      const at = current * (count - 1);
      const k = Math.round(at);
      const d = at - k; // -0.5…0.5 around the stop of work k
      const away = Math.abs(d);
      // Still during the hold, then moving half a step towards the neighbour by the end of the run.
      const pos = away <= HOLD ? 0 : Math.sign(d) * ((away - HOLD) / (0.5 - HOLD)) * 0.5;
      const reveal = clamp((HOLD - away) / FADE, 0, 1);
      const gap = window.innerHeight * (window.innerWidth >= 1000 ? 0.92 : 0.62);
      stage.style.setProperty("--reveal", reveal.toFixed(3));
      // Fully tucked away: out of reach of clicks, the keyboard and screen readers too.
      stage.toggleAttribute("data-tucked", reveal === 0);

      els.forEach((el, i) => {
        if (!el) return;
        const off = i - (k + pos);
        const isFront = i === k;
        const scale = isFront ? 0.86 + 0.14 * reveal : 0.86;
        el.style.transform = `translate(-50%, -50%) translateY(${(off * gap).toFixed(1)}px) scale(${scale.toFixed(3)})`;
        // One curve for all cards, so nothing jumps when the front changes hands half-way.
        const opacity = clamp(1.3 - Math.abs(off), 0, 1) * (isFront ? 1 : 1 - reveal);
        el.style.opacity = opacity.toFixed(3);
        // Invisible cards must not catch taps (on phones they slide over the heading); they stay
        // in the tab order and the accessibility tree, so every work can still be reached.
        el.style.pointerEvents = opacity < 0.05 ? "none" : "";
      });

      if (k !== shown) {
        shown = k;
        setFront(k);
        fitColumn();
      }
      raf = current === target ? 0 : requestAnimationFrame(render);
    };

    const onScroll = () => {
      measure();
      if (!raf) raf = requestAnimationFrame(render);
    };
    const onResize = () => {
      fitColumn();
      onScroll();
    };

    measure();
    render();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      stage.style.removeProperty("--reveal");
      stage.style.removeProperty("--half");
      stage.removeAttribute("data-tucked");
      els.forEach((el) => {
        el?.style.removeProperty("transform");
        el?.style.removeProperty("opacity");
        el?.style.removeProperty("pointer-events");
      });
    };
  }, [count, reduced]);

  // The front card starts playing once the reel settles on it, and only while the section is on screen.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || reduced) return;
    let timer = 0;
    const observer = new IntersectionObserver(([entry]) => {
      window.clearTimeout(timer);
      if (entry.isIntersecting) timer = window.setTimeout(() => setLive(front), SETTLE_MS);
      else setLive(null);
    });
    observer.observe(wrap);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [front, reduced]);

  const frontProject = projects[front];
  const activeService =
    picked && (reduced || picked.card === front)
      ? picked.service
      : !reduced && frontProject
        ? serviceIndexOf(frontProject, services)
        : -1;
  const service = services[activeService];
  const serviceCategory = service ? categories.find((c) => c.slug === service.category) : undefined;

  // On a phone the services are one swipeable line: keep the lit one in view.
  // Only the list scrolls, never the page.
  useEffect(() => {
    const list = servicesRef.current;
    const item = list?.children[activeService] as HTMLElement | undefined;
    if (!list || !item || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: item.offsetLeft - list.offsetLeft - 12, behavior: reduced ? "auto" : "smooth" });
  }, [activeService, reduced]);

  // The page offset at which work `i` stands still in front.
  const offsetOf = (i: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return 0;
    const travel = wrap.offsetHeight - window.innerHeight;
    const top = wrap.getBoundingClientRect().top + window.scrollY;
    return top + (i / Math.max(1, count - 1)) * travel;
  };

  // Keyboard focus: scroll the page so the focused card comes to the front.
  // The stage uses overflow: clip, so the browser cannot scroll it to reveal the card.
  // Mouse clicks focus too, but need no scrolling: only :focus-visible counts.
  const focusCard = (e: React.FocusEvent<HTMLButtonElement>, i: number) => {
    if (reduced || count < 2 || !e.currentTarget.matches(":focus-visible")) return;
    // The browser then scrolls the card into view on its own, asynchronously and smoothly; place
    // the page once that scroll has ended (or after a short wait when it does not happen), once.
    let timer = 0;
    const place = () => {
      window.removeEventListener("scrollend", place);
      window.clearTimeout(timer);
      window.scrollTo({ top: offsetOf(i), behavior: "instant" });
    };
    window.addEventListener("scrollend", place, { once: true });
    timer = window.setTimeout(place, 900);
  };

  // The work a service leads to: its chosen work, else the nearest of its category, else the
  // nearest of its fallback category (nearest to the one in front, so the reel moves little).
  const cardOfService = (s: number) => {
    const { projectId, category, fallback } = services[s];
    const tests = [(p: Project) => p.id === projectId, (p: Project) => p.category === category, (p: Project) => p.category === fallback];
    for (const test of tests) {
      let found = -1;
      projects.forEach((project, i) => {
        if (!test(project)) return;
        if (found < 0 || Math.abs(i - front) < Math.abs(found - front)) found = i;
      });
      if (found >= 0) return found;
    }
    return -1;
  };

  const goToService = (s: number) => {
    const i = cardOfService(s);
    if (i < 0) return;
    setPicked({ service: s, card: i });
    if (reduced) cardRefs.current[i]?.scrollIntoView({ block: "center" });
    else window.scrollTo({ top: offsetOf(i), behavior: "smooth" });
  };

  const meta = (p: Project) =>
    [String(p.year), label(p.category), p.client ?? ""].filter(Boolean).join(" // ");

  return (
    <section
      id="work"
      ref={wrapRef}
      className={clsx(styles.work, reduced && styles.flat)}
      style={{ "--n": Math.max(1, count) } as React.CSSProperties}
      aria-labelledby="work-title"
    >
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.side}>
          <div className={styles.head}>
            <h2 id="work-title" className={`${styles.title} display glitch`} data-text="Работы">
              Работы
            </h2>
            <p className={styles.line}>
              Монтаж, который <span className="accent">досматривают.</span>
            </p>
            {reduced || !frontProject ? (
              <p className={`${styles.count} hud`}>
                {count} {plural(count)} · нажмите на карточку
              </p>
            ) : (
              <p className={styles.caption} aria-hidden="true">
                <strong>{frontProject.title}</strong>
                <span className="hud">{meta(frontProject)}</span>
              </p>
            )}
          </div>

          {frontProject && !reduced && (
            <div className={`${styles.workInfo} ${styles.slide} panel`}>
              <p className={`${styles.workMeta} hud`}>{meta(frontProject)}</p>
              <h3 className={styles.workTitle}>{frontProject.title}</h3>
              {frontProject.summary && <p className={styles.workSummary}>{frontProject.summary}</p>}
              <button type="button" className="btn btn-primary" onClick={() => onOpen(frontProject)}>
                <span aria-hidden="true">▶</span> Смотреть со звуком
              </button>
            </div>
          )}

          {services.length > 0 && (
            <nav
              id="services"
              className={`${styles.rail} ${styles.slide} panel`}
              aria-labelledby="services-title"
            >
              <h3 id="services-title" className={`${styles.railLabel} hud`}>
                Что я делаю
              </h3>
              <ul ref={servicesRef} className={styles.services}>
                {services.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className={styles.service}
                      aria-current={i === activeService || undefined}
                      disabled={cardOfService(i) < 0}
                      onClick={() => goToService(i)}
                    >
                      {s.title}
                    </button>
                  </li>
                ))}
              </ul>
              {service && (
                <p className={styles.serviceText}>
                  {service.text}
                  {serviceCategory && (
                    <>
                      {" "}
                      <Link href={`/works/${serviceCategory.slug}`}>Все работы: {serviceCategory.label} →</Link>
                    </>
                  )}
                </p>
              )}
            </nav>
          )}
        </div>

        <div className={styles.reel}>
          {projects.map((project, i) => (
            <button
              key={project.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              type="button"
              className={clsx(styles.card, project.orientation === "vertical" && styles.vertical)}
              onClick={() => onOpen(project)}
              onFocus={(e) => focusCard(e, i)}
              aria-label={`Смотреть «${project.title}» со звуком`}
            >
              {project.posterUrl ? (
                // Posters may live on the API host; plain <img> avoids configuring next/image domains.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.posterUrl} alt="" loading="lazy" />
              ) : (
                <video src={`${project.videoUrl}#t=0.5`} muted playsInline preload="metadata" />
              )}
              {i === live && <LiveVideo src={project.videoUrl} />}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

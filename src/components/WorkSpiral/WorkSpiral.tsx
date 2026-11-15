"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePlayer } from "@/lib/player";
import { useCategories, useCategoryLabel } from "@/lib/categories";
import type { Project, Service } from "@/lib/types";
import { usePrefersReducedMotion } from "@/lib/useReveal";
import styles from "./WorkSpiral.module.scss";

// Works as cards on a helix that turns around a central line while the page scrolls,
// after the "Our work" section of sybiosme.com. Scroll drives it; nothing is hijacked.
// The services ride along at the bottom: the one the front work belongs to lights up,
// and choosing a service turns the helix to its work.
const PER_TURN = 7; // cards per full turn
const MIN_CARDS = 14; // repeat the works until the helix is this dense
const FRONT_DROP = 0.08; // on screen, the front card's centre sits this far below the middle (viewport heights)
const PERSPECTIVE = 1500; // px, same as .space in the stylesheet
const RISE = 0.16; // vertical step between cards, in viewport heights
const SETTLE_MS = 250; // a card must stay in front this long before its video loads

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

export default function WorkSpiral({ projects, services }: { projects: Project[]; services: Service[] }) {
  const onOpen = usePlayer();
  const label = useCategoryLabel();
  const categories = useCategories();
  const wrapRef = useRef<HTMLElement>(null);
  const helixRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLUListElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [front, setFront] = useState(0);
  const [live, setLive] = useState<number | null>(null);
  // Without the helix (reduced motion) nothing is "in front": the chosen service is lit instead.
  const [picked, setPicked] = useState<number | null>(null);
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
    const stage = helix.closest<HTMLElement>(`.${styles.stage}`);
    let placed = "";
    let target = 0;
    let current = -1;
    let raf = 0;
    let shown = -1;

    // The side panels hug the front card, whatever its size and orientation. Coordinates are
    // relative to the stage, which is not pinned yet while the section slides in or out.
    const placePanels = (el: HTMLElement | null | undefined) => {
      if (!el || !stage || window.innerWidth < 1000) return;
      const box = el.getBoundingClientRect();
      const origin = stage.getBoundingClientRect();
      const left = Math.round(box.left - origin.left);
      const right = Math.round(box.right - origin.left);
      const mid = Math.round((box.top + box.bottom) / 2 - origin.top);
      const key = `${left} ${right} ${mid}`;
      if (key === placed) return;
      placed = key;
      stage.style.setProperty("--front-left", `${left}px`);
      stage.style.setProperty("--front-right", `${right}px`);
      stage.style.setProperty("--front-mid", `${mid}px`);
    };
    // The front card grows over 0.4 s after the helix stops; measure again once it has.
    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === "transform" && e.target === els[shown]) placePanels(els[shown]);
    };

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
      // The front card is nearer than the helix axis, so perspective enlarges it and its offset by `depth`.
      const vw = window.innerWidth;
      const radius = vw <= 700 ? 0.46 * vw : Math.min(620, 0.42 * vw);
      const depth = PERSPECTIVE / (PERSPECTIVE - radius);
      helix.style.setProperty("--rise", `${rise.toFixed(1)}px`); // same unit as the JS math, unlike svh
      helix.style.setProperty("--r", `${radius.toFixed(1)}px`);
      helix.style.setProperty("--depth", depth.toFixed(3));
      helix.style.transform = `translateY(${(-at * rise + (FRONT_DROP * vh) / depth).toFixed(1)}px) rotateY(${(-turn).toFixed(2)}deg)`;

      // The card facing the camera is the only bright one; the rest stay dim in the background.
      let best = 0;
      let bestCos = -2;
      els.forEach((el, i) => {
        if (!el) return;
        const angle = ((i * step - turn) * Math.PI) / 180;
        const facing = Math.cos(angle);
        const vertical = 1 - Math.min(1, Math.abs((i - at) * rise) / (vh * 0.6));
        el.style.opacity = Math.max(0.05, (0.1 + 0.35 * Math.max(0, facing)) * (0.35 + 0.65 * vertical)).toFixed(3);
        const score = facing + vertical;
        if (score > bestCos) {
          bestCos = score;
          best = i;
        }
      });
      if (els[best]) els[best]!.style.opacity = "1";
      placePanels(els[best]);
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
    helix.addEventListener("transitionend", onTransitionEnd);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      helix.removeEventListener("transitionend", onTransitionEnd);
      helix.style.removeProperty("transform");
      helix.style.removeProperty("--r");
      helix.style.removeProperty("--depth");
      els.forEach((el) => el?.style.removeProperty("opacity"));
    };
  }, [cards, reduced]);

  // The front card starts playing once the helix settles on it, and only while the section is on screen.
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

  const frontProject = cards[front]?.project;
  const activeService = reduced ? (picked ?? -1) : frontProject ? serviceIndexOf(frontProject, services) : -1;
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

  // The page offset at which card `i` faces the camera.
  const offsetOf = (i: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return 0;
    const travel = wrap.offsetHeight - window.innerHeight;
    const top = wrap.getBoundingClientRect().top + window.scrollY;
    return top + (i / Math.max(1, cards.length - 1)) * travel;
  };

  // Keyboard focus: scroll the page so the focused card turns to face the camera.
  // The stage uses overflow: clip, so the browser cannot scroll it to reveal the card.
  const focusCard = (i: number) => {
    if (reduced || cards.length < 2) return;
    // The browser then scrolls the card into view on its own, asynchronously and smoothly; place
    // the page once that scroll has ended (or after a short wait when it does not happen).
    const place = () => {
      window.removeEventListener("scrollend", place);
      window.scrollTo({ top: offsetOf(i), behavior: "instant" });
    };
    window.addEventListener("scrollend", place, { once: true });
    window.setTimeout(place, 900);
  };

  // The card of a service nearest to the one in front, so the helix turns as little as possible.
  const cardOfService = (s: number) => {
    let found = -1;
    cards.forEach(({ project }, i) => {
      if (serviceIndexOf(project, services) !== s) return;
      if (found < 0 || Math.abs(i - front) < Math.abs(found - front)) found = i;
    });
    return found;
  };

  const goToService = (s: number) => {
    const i = cardOfService(s);
    if (i < 0) return;
    if (reduced) {
      setPicked(s);
      cardRefs.current[i]?.scrollIntoView({ block: "center" });
    } else window.scrollTo({ top: offsetOf(i), behavior: "smooth" });
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
          {reduced || !frontProject ? (
            <p className={`${styles.count} hud`}>
              {projects.length} {plural(projects.length)} · нажмите на карточку
            </p>
          ) : (
            <p className={styles.caption} aria-hidden="true">
              <strong>{frontProject.title}</strong>
              <span className="hud">
                {frontProject.year}{" // "}{label(frontProject.category)}
                {frontProject.client ? ` // ${frontProject.client}` : ""}
              </span>
            </p>
          )}
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
                className={clsx(
                  styles.card,
                  project.orientation === "vertical" && styles.vertical,
                  i === front && !reduced && styles.active,
                )}
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
                {i === live && <LiveVideo src={project.videoUrl} />}
                <span className={`${styles.cardMeta} hud`}>
                  {project.year}{" // "}{label(project.category)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {frontProject && !reduced && (
          <div className={`${styles.workInfo} panel`}>
            <p className={`${styles.workMeta} hud`}>
              {frontProject.year}{" // "}{label(frontProject.category)}
              {frontProject.client ? ` // ${frontProject.client}` : ""}
            </p>
            <h3 className={styles.workTitle}>{frontProject.title}</h3>
            {frontProject.summary && <p className={styles.workSummary}>{frontProject.summary}</p>}
            <button type="button" className="btn btn-primary" onClick={() => onOpen(frontProject)}>
              <span aria-hidden="true">▶</span> Смотреть со звуком
            </button>
          </div>
        )}

        {services.length > 0 && (
          <nav id="services" className={`${styles.rail} panel`} aria-labelledby="services-title">
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
              <p className={styles.serviceText} aria-live="polite">
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
    </section>
  );
}

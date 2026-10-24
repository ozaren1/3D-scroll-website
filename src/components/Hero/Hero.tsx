"use client";

import { useRef } from "react";
import { availability, tools } from "@/app/data";
import { usePlayer } from "@/lib/player";
import type { Profile, Project } from "@/lib/types";
import { formatTimecode } from "@/lib/timecode";
import HalftoneVideo from "../HalftoneVideo/HalftoneVideo";
import styles from "./Hero.module.scss";

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

// Split the tagline so its second half can be set in the muted tone, as on sybiosme.com.
function splitTagline(text: string): [string, string] {
  const comma = text.indexOf(",");
  return comma > 0 ? [text.slice(0, comma + 1), text.slice(comma + 1)] : [text, ""];
}

// Opening screen after sybiosme.com: a full-bleed halftone picture (here the showreel itself),
// a statement top right, the action on the left and the surname as a wordmark across the bottom.
export default function Hero({ profile, showreel }: { profile: Profile; showreel: Project | null }) {
  const onPlay = usePlayer();
  const [first, ...rest] = profile.name.split(" ");
  const last = rest.join(" ");
  const [lead, tail] = splitTagline(profile.tagline);
  const timecodeRef = useRef<HTMLSpanElement>(null);

  return (
    <section id="top" className={styles.hero} aria-labelledby="hero-title">
      {showreel && (
        <HalftoneVideo
          src={showreel.videoUrl}
          poster={showreel.posterUrl}
          onTime={(t) => {
            if (timecodeRef.current) timecodeRef.current.textContent = formatTimecode(t);
          }}
        />
      )}
      <div className={styles.shade} aria-hidden="true" />

      <div className={styles.hudTop} aria-hidden="true">
        <span className="hud">
          <span className={styles.rec} /> REC <span ref={timecodeRef}>00:00:00:00</span>
        </span>
        <span className="hud">43.2567° N · 76.9286° E</span>
      </div>

      <p className={styles.statement} data-reveal>
        {lead}
        <span>{tail}</span>
      </p>

      <div className={styles.action} data-reveal style={delay(1)}>
        <p className={styles.status}>
          <span className={styles.dot} />
          {availability}
        </p>
        <p className={styles.role}>{profile.role}</p>
        <div className={styles.buttons}>
          <a className="btn btn-primary" href="#contact">
            Обсудить проект <span aria-hidden="true">→</span>
          </a>
          {showreel && (
            <button type="button" className="btn btn-ghost" onClick={() => onPlay(showreel)}>
              ▶ Шоурил
            </button>
          )}
        </div>
      </div>

      <h1 id="hero-title" className={styles.title}>
        <span className={styles.first} data-reveal style={delay(2)}>
          {first}
        </span>
        <span className={`${styles.wordmark} display glitch is-glitching`} data-text={last} data-reveal style={delay(2)}>
          {last}
        </span>
      </h1>

      <ul className={styles.tools} aria-label="Инструменты">
        {tools.map((tool) => (
          <li key={tool} className="hud">
            {tool}
          </li>
        ))}
      </ul>
    </section>
  );
}

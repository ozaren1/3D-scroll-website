import Link from "next/link";
import { tools } from "@/app/data";
import type { Profile, Project } from "@/lib/types";
import AutoVideo from "../AutoVideo/AutoVideo";
import { TiltCard, TiltItem } from "../TiltCard/TiltCard";
import styles from "./About.module.scss";

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default function About({ profile, still }: { profile: Profile; still: Project | null }) {
  return (
    <section id="about" className={styles.about} aria-labelledby="about-title">
      <div className={styles.copy}>
        <p className={`${styles.index} hud`} aria-hidden="true">
          {"FILE // OPERATOR_PROFILE"}
        </p>
        <h1 id="about-title" className={`${styles.title} display glitch`} data-text="Обо мне" data-reveal>
          Обо мне
        </h1>
        <div className={`${styles.card} panel`} data-reveal style={delay(1)}>
          <p className={styles.text}>{profile.about}</p>
          <dl className={styles.facts}>
            <div>
              <dt className="hud">LOC</dt>
              <dd>{profile.location}</dd>
            </div>
            <div>
              <dt className="hud">ROLE</dt>
              <dd>{profile.role}</dd>
            </div>
            <div className={styles.wide}>
              <dt className="hud">STACK</dt>
              <dd>{tools.join(" · ")}</dd>
            </div>
          </dl>
        </div>
        <div className={styles.actions} data-reveal style={delay(2)}>
          <Link className="btn btn-primary" href="/works">
            Смотреть работы <span aria-hidden="true">→</span>
          </Link>
          <Link className="btn btn-ghost" href="/#contact">
            Обсудить проект
          </Link>
        </div>
      </div>

      {still && (
        <div className={styles.media} data-reveal style={delay(2)}>
          <TiltCard>
            <div className={styles.still}>
              <AutoVideo src={still.videoUrl} poster={still.posterUrl ?? undefined} aria-hidden="true" />
            </div>
            <TiltItem depth={60} className={`${styles.caption} hud`}>
              {still.title}{" // "}{still.year}
            </TiltItem>
          </TiltCard>
        </div>
      )}
    </section>
  );
}

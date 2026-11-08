import type { ProcessStep } from "@/lib/types";
import styles from "./Process.module.scss";

// The steps on one track, like clips on a timeline, after the dotted timelines of sybiosme.com.
// Each clip is thinner than the one before it, however many steps the admin panel holds.
export default function Process({ steps }: { steps: ProcessStep[] }) {
  if (steps.length === 0) return null;
  const fill = (i: number) => (steps.length < 2 ? 1 : 1 - (i / (steps.length - 1)) * 0.75);

  return (
    <section className={styles.process} aria-labelledby="process-title">
      <p className={`${styles.index} hud`} aria-hidden="true">
        {`PIPELINE // ${steps.length} STAGES`}
      </p>
      <h2 id="process-title" className={`${styles.title} display glitch`} data-text="Как идёт работа" data-reveal>
        Как идёт работа
      </h2>
      <ol className={styles.track} style={{ "--n": Math.min(steps.length, 4) } as React.CSSProperties}>
        {steps.map((step, i) => (
          <li key={i} data-reveal style={{ "--i": i + 1 } as React.CSSProperties}>
            <span className={styles.bar} style={{ "--fill": fill(i) } as React.CSSProperties} data-grow aria-hidden="true" />
            <span className={styles.stepTitle}>{step.title}</span>
            {step.time && <span className={`${styles.time} hud`}>{step.time}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

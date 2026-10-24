import { processSteps } from "@/app/data";
import styles from "./Process.module.scss";

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

// The steps on one track, like clips on a timeline, after the dotted timelines of sybiosme.com.
export default function Process() {
  return (
    <section className={styles.process} aria-labelledby="process-title">
      <p className={`${styles.index} hud`} aria-hidden="true">
        {"PIPELINE // 4 STAGES"}
      </p>
      <h2 id="process-title" className={`${styles.title} display glitch`} data-text="Как идёт работа" data-reveal>
        Как идёт работа
      </h2>
      <ol className={styles.track}>
        {processSteps.map((step, i) => (
          <li key={step.title} data-reveal style={delay(i + 1)}>
            <span className={styles.bar} data-grow aria-hidden="true" />
            <span className={styles.stepTitle}>{step.title}</span>
            <span className={`${styles.time} hud`}>{step.time}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

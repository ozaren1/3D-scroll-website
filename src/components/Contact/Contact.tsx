import type { Profile } from "@/lib/types";
import styles from "./Contact.module.scss";

// Direct contacts only: there is no form, so the site collects no personal data.
export default function Contact({ profile }: { profile: Profile }) {
  const telegram = profile.socials.find((s) => /t\.me|telegram/i.test(s.url));
  const others = profile.socials.filter((s) => s !== telegram);
  const mailto = `mailto:${profile.email}?subject=${encodeURIComponent("Проект: ролик")}`;

  return (
    <section id="contact" className={styles.contact} aria-labelledby="contact-title">
      <div className={styles.intro} data-reveal>
        <p className={`${styles.index} hud`} aria-hidden="true">
          {"OPEN CHANNEL // CONTACT"}
        </p>
        <h2 id="contact-title" className={`${styles.title} display glitch`} data-text="Обсудим ваш ролик">
          Обсудим <span className="accent">ваш ролик</span>
        </h2>
        <p className={styles.note}>
          Напишите, что за ролик, к какому сроку и где он будет крутиться. Отвечаю в течение дня.
        </p>
        <p className={`${styles.where} hud`}>{profile.location}</p>
      </div>

      <div className={`${styles.card} panel`} data-reveal style={{ "--i": 1 } as React.CSSProperties}>
        {telegram && (
          <a className={`${styles.primary} btn btn-primary`} href={telegram.url} target="_blank" rel="noopener noreferrer">
            Написать в Telegram <span aria-hidden="true">↗</span>
          </a>
        )}
        <a className={`${styles.primary} btn btn-ghost`} href={mailto}>
          {profile.email}
        </a>

        {others.length > 0 && (
          <ul className={styles.socials}>
            {others.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  <span className="hud">{s.label}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

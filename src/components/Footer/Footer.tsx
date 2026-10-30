import Link from "next/link";
import { navLinks } from "@/app/data";
import type { Profile } from "@/lib/types";
import styles from "./Footer.module.scss";

const DEVELOPER = { label: "ozaren1", url: "https://github.com/ozaren1" };

export default function Footer({ profile }: { profile: Profile }) {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.row}>
        <address className={styles.places}>
          <ul>
            <li>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </li>
            {profile.socials.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </address>

        <nav className={styles.links} aria-label="Разделы сайта в подвале">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <p className={styles.where}>
          {profile.role}
          <br />
          {profile.location}
        </p>
      </div>

      <p className={`${styles.name} display`} aria-hidden="true">
        {profile.name}
      </p>

      <div className={`${styles.legal} hud`}>
        <span>
          © {year} {profile.name}
        </span>
        <Link href="/privacy">Конфиденциальность</Link>
        <span>
          Разработка —{" "}
          <a href={DEVELOPER.url} target="_blank" rel="noopener noreferrer">
            {DEVELOPER.label} ↗
          </a>
        </span>
      </div>
    </footer>
  );
}

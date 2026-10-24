"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./CookieBanner.module.scss";

// Versioned: when analytics is added, bump the version so visitors are asked again for what it does.
export const CONSENT_KEY = "cookie-consent:v1";
export type CookieConsent = "all" | "necessary";

// Read by any future analytics before it loads: only "all" allows it.
export function readCookieConsent(): CookieConsent | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "all" || value === "necessary" ? value : null;
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(readCookieConsent() === null);
  }, []);

  const choose = (value: CookieConsent) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // Storage blocked (private mode): just hide the notice for this visit.
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className={`${styles.banner} panel`} role="region" aria-label="Уведомление о cookie">
      <p className={`${styles.label} hud`} aria-hidden="true">
        {"SYS // COOKIES"}
      </p>
      <p className={styles.text}>
        Сайт не использует рекламные и аналитические cookie. В браузере сохраняется только ваш выбор, чтобы не
        спрашивать снова. Подробнее — в <Link href="/privacy#cookies">политике конфиденциальности</Link>.
      </p>
      <div className={styles.actions}>
        <button type="button" className="btn btn-primary" onClick={() => choose("all")}>
          Принять все
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => choose("necessary")}>
          Только необходимые
        </button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readConsent, writeConsent, type Consent } from "@/lib/consent";
import styles from "./CookieNotice.module.scss";

export const OPEN_EVENT = "cookie-notice:open";

// Asks before analytics: Yandex Metrica (cookies, Webvisor) starts only after "Принять".
export default function CookieNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(readConsent() === null);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  if (!open) return null;

  const choose = (value: Consent) => {
    writeConsent(value);
    setOpen(false);
  };

  return (
    <aside className={`${styles.notice} panel`} aria-label="Согласие на cookie">
      <p className={styles.text}>
        Сайт использует cookie и Яндекс Метрику (статистика посещений и запись действий на странице —
        Вебвизор). Они включатся, только если вы согласитесь. <Link href="/privacy#cookies">Подробнее</Link>
      </p>
      <div className={styles.actions}>
        <button type="button" className="btn btn-primary" onClick={() => choose("all")}>
          Принять
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => choose("necessary")}>
          Только необходимые
        </button>
      </div>
    </aside>
  );
}

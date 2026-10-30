"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./CookieNotice.module.scss";

// Versioned: if analytics is ever added, bump it and turn this notice into a real choice,
// because analytics cookies need consent and this notice only informs.
const KEY = "cookie-notice:v1";

export default function CookieNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(KEY) === null);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  const close = () => {
    try {
      window.localStorage.setItem(KEY, "seen");
    } catch {
      // Storage blocked: hide it for this visit only.
    }
    setOpen(false);
  };

  return (
    <aside className={`${styles.notice} panel`} aria-label="Сообщение о cookie">
      <p className={styles.text}>
        Сайт не использует рекламные и аналитические cookie. В браузере сохраняется только то, что нужно для
        работы, например, что вы видели это сообщение.{" "}
        <Link href="/privacy#cookies">Подробнее</Link>
      </p>
      <button type="button" className="btn btn-primary" onClick={close}>
        Понятно
      </button>
    </aside>
  );
}

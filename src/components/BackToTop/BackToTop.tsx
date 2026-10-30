"use client";

import { useEffect, useState } from "react";
import styles from "./BackToTop.module.scss";

// Fixed bottom-right button that appears once the visitor has scrolled more than a screen down.
export default function BackToTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const update = () => setShown(window.scrollY > window.innerHeight);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <button
      type="button"
      className={styles.button}
      data-shown={shown || undefined}
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
      aria-label="Наверх"
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        // Move keyboard focus to the start of the page as well.
        document.querySelector<HTMLElement>("header a")?.focus({ preventScroll: true });
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M12 5 5 12M12 5l7 7M12 5v14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
      </svg>
    </button>
  );
}

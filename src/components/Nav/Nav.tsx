"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { navLinks } from "@/app/data";
import styles from "./Nav.module.scss";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Floating navigation bar with chamfered corners.
export default function Nav({ name }: { name: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={styles.header} data-scrolled={scrolled || undefined}>
      <Link className={styles.logo} href="/" aria-label={`${name}, на главную`}>
        {initials(name)}
      </Link>

      <nav className={`${styles.pill}`} aria-label="Разделы" data-open={open || undefined}>
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}
      </nav>

      <Link className={`${styles.cta} btn btn-primary`} href="/#contact">
        Обсудить проект
      </Link>

      <button
        type="button"
        className={`${styles.menu}`}
        aria-expanded={open}
        aria-label="Меню"
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
      </button>
    </header>
  );
}

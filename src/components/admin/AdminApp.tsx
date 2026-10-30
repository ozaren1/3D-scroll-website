"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken, login, logout } from "@/lib/adminApi";
import CategoriesAdmin from "./CategoriesAdmin";
import ProfileAdmin from "./ProfileAdmin";
import SeoAdmin from "./SeoAdmin";
import ServicesAdmin from "./ServicesAdmin";
import WorksAdmin from "./WorksAdmin";
import styles from "./admin.module.scss";

const TABS = [
  { id: "works", label: "Работы" },
  { id: "categories", label: "Категории" },
  { id: "profile", label: "Обо мне" },
  { id: "services", label: "Что я делаю" },
  { id: "seo", label: "Страницы и SEO" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("works");

  useEffect(() => {
    setAuthed(Boolean(getToken()));
    const onLogout = () => setAuthed(false);
    window.addEventListener("admin-logout", onLogout);
    return () => window.removeEventListener("admin-logout", onLogout);
  }, []);

  if (authed === null) return null;
  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  return (
    <div className={styles.app}>
      <header className={styles.top}>
        <strong className={styles.brand}>Админка</strong>
        <nav className={styles.tabs} aria-label="Разделы">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={styles.tab}
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className={styles.topActions}>
          <Link href="/" target="_blank" className={styles.link}>
            Открыть сайт ↗
          </Link>
          <button
            type="button"
            className={styles.link}
            onClick={() => {
              logout();
              setAuthed(false);
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {tab === "works" && <WorksAdmin />}
        {tab === "profile" && <ProfileAdmin />}
        {tab === "services" && <ServicesAdmin />}
        {tab === "categories" && <CategoriesAdmin />}
        {tab === "seo" && <SeoAdmin />}
        <p className={styles.note}>Изменения появляются на сайте в течение минуты.</p>
      </main>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await login(String(data.get("email")), String(data.get("password")));
      onDone();
    } catch (err) {
      setError(
        err instanceof Error && "status" in err && err.status === 429
          ? "Слишком много попыток. Подождите минуту."
          : "Неверная почта или пароль.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.loginWrap}>
      <form className={`${styles.login} panel`} onSubmit={submit}>
        <h1 className={`${styles.loginTitle} display`}>Вход</h1>
        <label className={styles.field}>
          <span>Почта</span>
          <input name="email" type="email" required autoComplete="username" />
        </label>
        <label className={styles.field}>
          <span>Пароль</span>
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Вхожу…" : "Войти"}
        </button>
      </form>
    </main>
  );
}

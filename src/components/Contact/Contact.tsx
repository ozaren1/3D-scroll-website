"use client";

import Link from "next/link";
import { useState } from "react";
import { budgetOptions } from "@/app/data";
import { sendContact } from "@/lib/api";
import type { Profile } from "@/lib/types";
import styles from "./Contact.module.scss";

type State =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

const ERRORS = {
  invalid: "Проверьте поля: имя, почта, пара предложений о задаче (от 10 символов) и согласие на обработку данных.",
  limit: "Слишком много заявок подряд. Попробуйте через 10 минут или напишите на почту.",
  network: "Не получилось отправить. Напишите на почту — отвечу так же быстро.",
};

export default function Contact({ profile }: { profile: Profile }) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      budget: String(data.get("budget") ?? "") || undefined,
      consent: data.get("consent") === "on",
      website: String(data.get("website") ?? "") || undefined,
    };
    setState({ status: "sending" });
    const result = await sendContact(payload);
    if (result.ok) {
      form.reset();
      setState({ status: "sent", email: payload.email });
    } else {
      setState({ status: "error", message: ERRORS[result.reason] });
    }
  }

  const mailto = `mailto:${profile.email}?subject=${encodeURIComponent("Заявка на ролик")}`;

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
          Расскажите, что за ролик, к какому сроку и где он будет крутиться. Отвечаю в течение дня.
        </p>
        <div className={styles.direct}>
          <a href={mailto}>{profile.email}</a>
          {profile.socials.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label} ↗
            </a>
          ))}
        </div>
      </div>

      <div className={`${styles.card} panel`} data-reveal style={{ "--i": 1 } as React.CSSProperties}>

        {state.status === "sent" ? (
          <p className={styles.sent} role="status">
            Заявка отправлена. Отвечу на {state.email} в течение дня.
          </p>
        ) : (
          <form className={styles.form} onSubmit={onSubmit}>
            <label>
              <span>Имя</span>
              <input name="name" required maxLength={100} autoComplete="name" />
            </label>
            <label>
              <span>Почта</span>
              <input name="email" type="email" required maxLength={254} autoComplete="email" />
            </label>
            <label>
              <span>Задача</span>
              <textarea name="message" required minLength={10} maxLength={4000} rows={4} />
            </label>
            <label>
              <span>Бюджет</span>
              <select name="budget" defaultValue="">
                <option value="">Не указывать</option>
                {budgetOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className={styles.consent}>
              <input type="checkbox" name="consent" required />
              <span>
                Согласен на обработку персональных данных по{" "}
                <Link href="/privacy">политике конфиденциальности</Link>
              </span>
            </label>
            {/* Honeypot: hidden from people and screen readers. */}
            <label className={styles.trap} aria-hidden="true">
              Сайт
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>

            {state.status === "error" && (
              <p className={styles.error} role="alert">
                {state.message}
              </p>
            )}

            <button className={`${styles.submit} btn btn-primary`} type="submit" disabled={state.status === "sending"}>
              {state.status === "sending" ? "Отправляю…" : "Отправить заявку"}
            </button>
          </form>
        )}

      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";
import { loadContent, pageMeta } from "@/lib/api";
import { socialMeta } from "@/lib/seo";
import { canonical } from "@/lib/site";
import styles from "./privacy.module.scss";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  const { fullTitle, ...meta } = pageMeta(
    content.seo.privacy,
    {
    title: "Конфиденциальность",
    description: "Сайт не собирает персональные данные.",
    },
    content.profile.name,
  );
  return {
    ...meta,
    ...canonical("/privacy"),
    ...socialMeta(content, { title: fullTitle, description: meta.description, path: "/privacy" }),
  };
}

const UPDATED = "30 октября 2026 г.";

// A statement, not a processing policy: the site has no forms, cookies or analytics, so it collects
// no personal data. If forms or analytics come back, this page and the 152-FZ question must be revisited.
export default async function PrivacyPage() {
  const { profile } = await loadContent();

  return (
    <>
      <Breadcrumbs items={[{ name: "Конфиденциальность", path: "/privacy" }]} />
      <article className={styles.privacy} aria-labelledby="privacy-title">
        <p className={`${styles.index} hud`} aria-hidden="true">
          {"LEGAL // PRIVACY"}
        </p>
        <h1 id="privacy-title" className={`${styles.title} display`}>
          Конфиденциальность
        </h1>
        <p className={styles.updated}>Редакция от {UPDATED}</p>

        <section>
          <h2>Сайт не собирает персональные данные</h2>
          <p>
            Это сайт-портфолио. На нём нет форм, регистрации, комментариев, рекламы и счётчиков аналитики.
            Шрифты, видео и изображения загружаются с серверов самого сайта и его файлового хранилища.
          </p>
        </section>

        <section id="cookies">
          <h2>Cookie и хранилище браузера</h2>
          <p>
            Сайт не ставит рекламных и аналитических cookie. В хранилище вашего браузера (localStorage)
            записывается только отметка о том, что вы видели сообщение о cookie, — чтобы не показывать его
            снова. Эта запись не содержит персональных данных и не передаётся на сервер.
          </p>
          <p>
            Удалить её можно, очистив данные сайта в настройках браузера. Если на сайте появится аналитика,
            она будет включаться только с вашего согласия, а эта страница будет обновлена.
          </p>
        </section>

        <section>
          <h2>Как связаться</h2>
          <p>
            Если вы пишете мне в Telegram или на почту, переписка идёт через эти сервисы по их правилам. Я
            использую ваш контакт только чтобы ответить и обсудить проект.
          </p>
          <p>
            Почта для вопросов: <a href={`mailto:${profile.email}`}>{profile.email}</a>.
          </p>
        </section>

        <section>
          <h2>Технические журналы</h2>
          <p>
            Как и любой веб-сервер, хостинг сайта может кратковременно записывать технические сведения о
            запросах (IP-адрес, время, адрес страницы) для защиты от атак и диагностики. Эти записи не
            используются для идентификации посетителей и не передаются третьим лицам.
          </p>
        </section>
      </article>
    </>
  );
}

import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";
import CookieSettings from "@/components/CookieNotice/CookieSettings";
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
    description: "Какие данные собирает сайт: Яндекс Метрика только с согласия посетителя.",
    },
    content.profile.name,
  );
  return {
    ...meta,
    ...canonical("/privacy"),
    ...socialMeta(content, { title: fullTitle, description: meta.description, path: "/privacy" }),
  };
}

const UPDATED = "15 ноября 2026 г.";

// The site has no forms; the only personal data it can collect comes from Yandex Metrica, which runs
// only with the visitor's consent. Keep this page in step with what the counter really does (152-FZ).
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
          <h2>Какие данные собирает сайт</h2>
          <p>
            Это сайт-портфолио. На нём нет форм, регистрации, комментариев и рекламы. Шрифты, видео и
            изображения загружаются с сервера самого сайта.
          </p>
          <p>
            Если вы нажмёте «Принять» в сообщении о cookie, включится сервис статистики Яндекс Метрика
            (ООО «Яндекс»). Он собирает обезличенные сведения о посещении: cookie-идентификатор, IP-адрес,
            тип устройства и браузера, источник перехода, просмотренные страницы, а также запись действий
            на странице (Вебвизор: прокрутка, движения и клики). Сведения обрабатываются Яндексом по его{" "}
            <a href="https://yandex.ru/legal/metrica_termsofuse/" target="_blank" rel="noopener noreferrer">
              условиям использования Метрики
            </a>{" "}
            и нужны, чтобы понимать, какие работы смотрят и как улучшить сайт. Владелец сайта —{" "}
            {profile.name} — видит только сводную статистику и записи сеансов в Метрике.
          </p>
        </section>

        <section id="cookies">
          <h2>Cookie и согласие</h2>
          <p>
            Без вашего согласия Метрика не загружается и cookie аналитики не ставятся. В хранилище браузера
            (localStorage) записывается только ваш выбор, чтобы не спрашивать снова; он не передаётся на
            сервер.
          </p>
          <p>
            Согласие можно отозвать в любой момент: <CookieSettings className={styles.inlineButton} />. После
            этого Метрика перестанет загружаться со следующей страницы. Cookie, которые она уже поставила,
            удаляются очисткой данных сайта в настройках браузера.
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

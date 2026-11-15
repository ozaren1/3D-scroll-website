"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { METRIKA_ID } from "@/lib/analytics";
import { useConsent } from "@/lib/consent";

type Ym = ((id: number, method: string, ...args: unknown[]) => void) & { a?: unknown[][]; l?: number };

declare global {
  interface Window {
    ym?: Ym;
  }
}

const SRC = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;

// The owner's Yandex Metrica snippet, started only once the visitor has accepted analytics cookies.
// Withdrawing consent takes effect on the next page load (the counter cannot be unloaded).
// The <noscript> pixel of the original snippet is left out: it would count visitors without consent.
export default function Metrika() {
  const consent = useConsent();
  const pathname = usePathname();
  const started = useRef(false);
  const firstPath = useRef<string | null>(null);

  useEffect(() => {
    if (consent !== "all" || started.current) return;
    started.current = true;
    firstPath.current = window.location.pathname;

    const ym: Ym =
      window.ym ??
      Object.assign(
        (...args: unknown[]) => {
          (ym.a = ym.a ?? []).push(args);
        },
        { l: Date.now() },
      );
    window.ym = ym;
    if (!document.querySelector(`script[src="${SRC}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = SRC;
      document.head.appendChild(script);
    }
    ym(METRIKA_ID, "init", {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: "dataLayer",
      referrer: document.referrer,
      url: window.location.href,
      accurateTrackBounce: true,
      trackLinks: true,
    });
  }, [consent]);

  // Client-side navigation does not reload the page: report each new page as a hit.
  useEffect(() => {
    if (!started.current || !window.ym) return;
    if (firstPath.current === pathname) {
      firstPath.current = null; // init already counted the landing page
      return;
    }
    firstPath.current = null;
    window.ym(METRIKA_ID, "hit", window.location.href, { referer: document.referrer });
  }, [pathname]);

  return null;
}

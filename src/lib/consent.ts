"use client";

import { useEffect, useState } from "react";

// The visitor's cookie choice. Analytics (Yandex Metrica) runs only after "all".
// Versioned: v1 was an information-only notice, so its "seen" mark does not count as consent.
const KEY = "cookie-consent:v2";
const EVENT = "cookie-consent-change";

export type Consent = "all" | "necessary";

export function readConsent(): Consent | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "all" || value === "necessary" ? value : null;
  } catch {
    return null;
  }
}

// null withdraws the choice: the notice asks again.
export function writeConsent(value: Consent | null) {
  try {
    if (value) window.localStorage.setItem(KEY, value);
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the choice lasts for this page view only.
  }
  window.dispatchEvent(new CustomEvent<Consent | null>(EVENT, { detail: value }));
}

// The current choice; undefined until read in the browser, null when not made yet.
export function useConsent(): Consent | null | undefined {
  const [consent, setConsent] = useState<Consent | null | undefined>(undefined);
  useEffect(() => {
    setConsent(readConsent());
    const onChange = (e: Event) => setConsent((e as CustomEvent<Consent | null>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return consent;
}

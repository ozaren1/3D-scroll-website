"use client";

import { writeConsent } from "@/lib/consent";
import { OPEN_EVENT } from "./CookieNotice";

// On the privacy page: withdraw the cookie choice and ask again.
export default function CookieSettings({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        writeConsent(null);
        window.dispatchEvent(new Event(OPEN_EVENT));
      }}
    >
      Изменить выбор cookie
    </button>
  );
}

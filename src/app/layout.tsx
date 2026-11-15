import type { Metadata, Viewport } from "next";
import { Exo_2, JetBrains_Mono, Share_Tech_Mono, Tektur } from "next/font/google";
import { loadContent } from "@/lib/api";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Test theme in the spirit of Cyberpunk 2077: the game's own faces are proprietary and lack Cyrillic,
// so these are free stand-ins with Cyrillic. See docs/ai/plans/003-cyberpunk-test.md.
const display = Tektur({
  subsets: ["latin", "cyrillic"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});

const text = Exo_2({
  subsets: ["latin", "cyrillic"],
  variable: "--font-text",
  display: "swap",
});

// Digits and Latin only: timecode and HUD labels.
const hud = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-hud",
  display: "swap",
});

// Cyrillic for the same HUD labels (Share Tech Mono has none): without it phones fall back to a
// system font in the middle of a label. Only the Cyrillic subset is loaded.
const hudCyrillic = JetBrains_Mono({
  subsets: ["cyrillic"],
  weight: "400",
  variable: "--font-hud-cyrillic",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await loadContent();
  const name = `${profile.name} — ${profile.role.toLowerCase()}`;
  return {
    metadataBase: siteUrl(),
    title: { default: name, template: `%s · ${profile.name}` },
    description: profile.tagline,
    // Ownership checks for Google Search Console and Yandex Webmaster.
    verification: {
      google: "W9Hpoe2cUG-aPKSCxUnhOPyecutsVoway1lIcpdn_bw",
      yandex: "4ce5f4dc438cf97a",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${text.variable} ${hud.variable} ${hudCyrillic.variable}`}>
      <body>{children}</body>
    </html>
  );
}

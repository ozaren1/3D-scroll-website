import type { Metadata, Viewport } from "next";
import { Exo_2, Share_Tech_Mono, Tektur } from "next/font/google";
import Shell from "@/components/Shell/Shell";
import { loadContent } from "@/lib/api";
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

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await loadContent();
  const name = `${profile.name} — ${profile.role.toLowerCase()}`;
  return {
    title: { default: name, template: `%s · ${profile.name}` },
    description: profile.tagline,
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await loadContent();
  return (
    <html lang="ru" className={`${display.variable} ${text.variable} ${hud.variable}`}>
      <body>
        <Shell profile={profile}>{children}</Shell>
      </body>
    </html>
  );
}

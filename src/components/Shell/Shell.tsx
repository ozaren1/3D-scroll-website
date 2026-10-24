"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { PlayerContext } from "@/lib/player";
import type { Profile, Project } from "@/lib/types";
import { useReveal } from "@/lib/useReveal";
import CookieBanner from "../CookieBanner/CookieBanner";
import Footer from "../Footer/Footer";
import Nav from "../Nav/Nav";
import Player from "../Player/Player";

// Everything every page shares: navigation, footer, the video player and the cookie notice.
export default function Shell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const [playing, setPlaying] = useState<Project | null>(null);
  useReveal(usePathname());

  return (
    <PlayerContext.Provider value={setPlaying}>
      <Nav name={profile.name} />
      <main>{children}</main>
      <Footer profile={profile} />
      <Player project={playing} onClose={() => setPlaying(null)} />
      <CookieBanner />
    </PlayerContext.Provider>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CategoriesContext } from "@/lib/categories";
import { PlayerContext } from "@/lib/player";
import type { Category, Profile, Project } from "@/lib/types";
import { useReveal } from "@/lib/useReveal";
import BackToTop from "../BackToTop/BackToTop";
import CookieNotice from "../CookieNotice/CookieNotice";
import Footer from "../Footer/Footer";
import Metrika from "../Metrika/Metrika";
import Nav from "../Nav/Nav";
import Player from "../Player/Player";

// Everything every page of the site shares: navigation, footer, the video player,
// the back-to-top button, the cookie notice and the analytics counter (only with consent).
// The admin panel has its own layout, so it is never counted or recorded.
export default function Shell({
  profile,
  categories,
  children,
}: {
  profile: Profile;
  categories: Category[];
  children: ReactNode;
}) {
  const [playing, setPlaying] = useState<Project | null>(null);
  useReveal(usePathname());

  return (
    <CategoriesContext.Provider value={categories}>
    <PlayerContext.Provider value={setPlaying}>
      <Nav name={profile.name} />
      <main>{children}</main>
      <Footer profile={profile} />
      <Player project={playing} onClose={() => setPlaying(null)} />
      <BackToTop />
      <CookieNotice />
      <Metrika />
    </PlayerContext.Provider>
    </CategoriesContext.Provider>
  );
}

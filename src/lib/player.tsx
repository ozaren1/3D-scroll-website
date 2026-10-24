"use client";

import { createContext, useContext } from "react";
import type { Project } from "./types";

// Lets any section open the shared full-screen player.
export const PlayerContext = createContext<(project: Project) => void>(() => undefined);

export function usePlayer() {
  return useContext(PlayerContext);
}

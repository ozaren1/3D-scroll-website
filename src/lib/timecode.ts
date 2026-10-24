export const FPS = 25;

// SMPTE-style HH:MM:SS:FF at 25 frames per second.
export function formatTimecode(seconds: number): string {
  const totalFrames = Math.max(0, Math.floor(seconds * FPS));
  const ff = totalFrames % FPS;
  const totalSeconds = Math.floor(totalFrames / FPS);
  const ss = totalSeconds % 60;
  const mm = Math.floor(totalSeconds / 60) % 60;
  const hh = Math.floor(totalSeconds / 3600);
  return [hh, mm, ss, ff].map((n) => String(n).padStart(2, "0")).join(":");
}

"use client";

import { useEffect, useRef, type VideoHTMLAttributes } from "react";
import { usePrefersReducedMotion } from "@/lib/useReveal";

// A muted loop that plays only while on screen and never under reduced motion
// (then it shows its poster frame and stays still).
export default function AutoVideo(props: Omit<VideoHTMLAttributes<HTMLVideoElement>, "autoPlay">) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (reduced) {
      video.pause();
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => undefined);
      else video.pause();
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduced]);

  return <video ref={ref} muted loop playsInline preload="metadata" {...props} />;
}

"use client";

import clsx from "clsx";
import { useRef, type CSSProperties, type ReactNode } from "react";
import styles from "./TiltCard.module.scss";

// 3D card effect after Aceternity UI (ui.aceternity.com/components/3d-card-effect): the card turns
// towards the pointer and children marked with depth lift off its surface.
export function TiltCard({
  children,
  className,
  max = 12,
}: {
  children: ReactNode;
  className?: string;
  max?: number; // degrees at the card's edge
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--ry", `${(x * max * 2).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-y * max * 2).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
    el.dataset.active = "";
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    delete el.dataset.active;
  };

  return (
    <div className={clsx(styles.container, className)} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div ref={ref} className={styles.card}>
        {children}
        <span className={styles.shine} aria-hidden="true" />
      </div>
    </div>
  );
}

// A child that floats above the card surface while the card is tilted.
export function TiltItem({
  children,
  depth = 40,
  className,
  style,
}: {
  children: ReactNode;
  depth?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={clsx(styles.item, className)} style={{ ...style, "--z": `${depth}px` } as CSSProperties}>
      {children}
    </div>
  );
}

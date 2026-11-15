// Inline icons drawn in the text colour. The arrow and play characters (↗ → ▶) turn into colour
// emoji on iOS and in some browsers, so the site draws them itself.

const base = {
  width: "0.9em",
  height: "0.9em",
  viewBox: "0 0 16 16",
  fill: "none",
  "aria-hidden": true,
  focusable: false,
  style: { flex: "none", verticalAlign: "-0.08em" },
} as const;

export function ArrowUpRight() {
  return (
    <svg {...base}>
      <path d="M4 12 12 4M6 4h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}

export function ArrowRight() {
  return (
    <svg {...base}>
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}

export function Play() {
  return (
    <svg {...base}>
      <path d="M4 2.5v11L13 8z" fill="currentColor" />
    </svg>
  );
}

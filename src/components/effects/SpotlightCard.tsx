"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { cx } from "@/utils/cx";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  /** Pointer-following glow on the card's edge (React Bits Border Glow). */
  borderGlow?: boolean;
};

/**
 * Card with a soft radial spotlight that follows the pointer while hovered
 * (React Bits Spotlight Card), plus an optional edge glow that lights the
 * border segment nearest the pointer. Pointer data is written to CSS
 * variables, so moving the mouse never re-renders React.
 */
export function SpotlightCard({ children, className, borderGlow = true }: SpotlightCardProps) {
  const ref = useRef<HTMLElement>(null);

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--mouse-x", `${x}px`);
    el.style.setProperty("--mouse-y", `${y}px`);
    if (!borderGlow) return;
    // Angle from the card centre, 0deg = top, clockwise (matches conic-gradient).
    const dx = x - r.width / 2;
    const dy = y - r.height / 2;
    const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
    // 0 at the centre, 1 on the edge.
    const edge = Math.max(Math.abs(dx) / (r.width / 2), Math.abs(dy) / (r.height / 2));
    el.style.setProperty("--cursor-angle", `${angle}deg`);
    el.style.setProperty("--edge-proximity", `${Math.min(1, Math.max(0, (edge - 0.25) / 0.75))}`);
  };

  const onPointerLeave = () => ref.current?.style.setProperty("--edge-proximity", "0");

  return (
    <article
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cx("spotlight-card", borderGlow && "border-glow", className)}
    >
      {children}
    </article>
  );
}

"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

/** Site-wide Lenis smooth scrolling. Lenis disables itself for reduced-motion users. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true, anchors: true }}>
      {children}
    </ReactLenis>
  );
}

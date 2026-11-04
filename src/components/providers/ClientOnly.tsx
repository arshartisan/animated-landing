"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};

/**
 * Renders children only in the browser. Time-driven animations differ between the
 * server render and hydration, so they mount client-side behind a same-size fallback.
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return <>{mounted ? children : fallback}</>;
}

"use client";

import { RiMoonLine, RiSunLine } from "@remixicon/react";
import { useEffect } from "react";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

/**
 * Runs in <head> before first paint: applies the saved theme, or the OS
 * preference when nothing is saved, so the page never flashes light first.
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}})()`;

export function ThemeScript() {
  return (
    <script
      // Keeps React from warning about rendering a <script> on the client.
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  );
}

function readStored(): Theme | null {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

function apply(theme: Theme) {
  const root = document.documentElement;
  // Swap instantly: no half-transitioned colors while every token flips.
  root.classList.add("theme-switching");
  root.classList.toggle("dark", theme === "dark");
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
}

/** Both glyphs render; the `.dark` class on <html> decides which shows, so SSR and hydration agree. */
function ThemeGlyph({ className, ...rest }: { className?: string; "aria-hidden"?: boolean | "true" | "false" }) {
  return (
    <>
      <RiMoonLine className={cx(className, "theme-asset-light")} {...rest} />
      <RiSunLine className={cx(className, "theme-asset-dark")} {...rest} />
    </>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  // Follow OS changes until the visitor picks a theme themselves.
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!readStored()) apply(mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  };

  return (
    <Button
      variant="secondary"
      iconOnly
      leadingIcon={ThemeGlyph}
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={className}
    />
  );
}

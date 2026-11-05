"use client";

import { RiArrowRightLine } from "@remixicon/react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { Emblem } from "@/components/brand/Emblem";
import { HubScene } from "@/components/machine/HubScene";
import { ClientOnly } from "@/components/providers/ClientOnly";

const MENU = ["How it Works", "Use Cases", "Pricing", "Customers", "Blog"];
const SOCIALS = ["LinkedIn", "X (Twitter)", "YouTube", "GitHub", "Product Hunt"];
const LEGAL = [
  { label: `©${new Date().getFullYear()} Docflow`, href: undefined },
  { label: "Pricing (PDF)", href: "#" },
  { label: "Cookies Policy", href: "#" },
  { label: "Privacy Policy", href: "#" },
];

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Link whose letters scramble and resolve back on hover. */
function ScrambleLink({ label, href = "#", className = "" }: { label: string; href?: string; className?: string }) {
  const reduce = useReducedMotion();
  const [text, setText] = useState(label);
  const frame = useRef<number | null>(null);

  const stop = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  };

  const scramble = () => {
    if (reduce) return;
    stop();
    const start = performance.now();
    const duration = 420;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const settled = Math.floor(p * label.length);
      setText(
        label
          .split("")
          .map((ch, i) => (ch === " " || i < settled ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(""),
      );
      if (p < 1) frame.current = requestAnimationFrame(tick);
      else frame.current = null;
    };
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => stop, []);

  return (
    <a
      href={href}
      onPointerEnter={scramble}
      onFocus={scramble}
      aria-label={label}
      className={`inline-block transition-colors hover:text-primary ${className}`}
    >
      <span aria-hidden>{text}</span>
    </a>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-subtle">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Newsletter() {
  const [sent, setSent] = useState(false);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };
  return (
    <Column title="Newsletter">
      <p className="text-lg text-foreground">Subscribe to get updates on new features and automation insights</p>
      <form onSubmit={onSubmit} className="mt-4 flex items-center rounded-full bg-field py-1.5 ps-5 pe-1.5">
        <label htmlFor="footer-email" className="sr-only">
          Email address
        </label>
        <input
          id="footer-email"
          type="email"
          required
          placeholder="Email address"
          disabled={sent}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={sent}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:text-primary disabled:text-primary"
        >
          {sent ? "Subscribed" : "Subscribe"}
          <RiArrowRightLine className="size-4" aria-hidden />
        </button>
      </form>
    </Column>
  );
}

export function Footer() {
  const reduce = useReducedMotion();
  const [hovering, setHovering] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 500, damping: 40, mass: 0.4 });
  const y = useSpring(my, { stiffness: 500, damping: 40, mass: 0.4 });

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - rect.left);
    my.set(e.clientY - rect.top);
  };

  return (
    <footer
      className="relative overflow-hidden border-t border-border px-6 pt-10 pb-8"
      onPointerMove={onMove}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      {/* Soft circle that trails the cursor */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-10 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/40 bg-foreground/5 backdrop-blur-[1px]"
          style={{ x, y }}
          animate={{ opacity: hovering ? 1 : 0, scale: hovering ? 1 : 0.6 }}
          transition={{ duration: 0.2 }}
        />
      )}

      <div className="grid gap-10 md:grid-cols-4">
        <Column title="Menu">
          <ul className="space-y-2 text-lg text-foreground">
            {MENU.map((item) => (
              <li key={item}>
                <ScrambleLink label={item} />
              </li>
            ))}
          </ul>
        </Column>
        <Column title="Socials">
          <ul className="space-y-2 text-lg text-foreground">
            {SOCIALS.map((item) => (
              <li key={item}>
                <ScrambleLink label={item} />
              </li>
            ))}
          </ul>
        </Column>
        <div className="md:col-span-2">
          <Newsletter />
        </div>
      </div>

      {/* Animated hub illustration */}
      <div className="mx-auto w-full max-w-5xl py-12 md:py-16">
        <ClientOnly fallback={<div className="aspect-[940/470] w-full" />}>
          <HubScene className="aspect-[940/470] w-full" />
        </ClientOnly>
      </div>

      <div className="grid gap-3 text-sm text-foreground sm:grid-cols-2 md:grid-cols-4">
        {LEGAL.map(({ label, href }, i) => (
          <div key={label} className={i === LEGAL.length - 1 ? "md:text-end" : ""}>
            {href ? (
              <ScrambleLink label={label} href={href} />
            ) : (
              <span className="inline-flex items-center gap-2">
                <Emblem className="w-3.5" />
                {label}
              </span>
            )}
          </div>
        ))}
      </div>
    </footer>
  );
}

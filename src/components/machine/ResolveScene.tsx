"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTime,
  useInView,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef } from "react";
import { EmblemMark } from "@/components/brand/Emblem";
import { S, topPlane } from "./iso";
import { IsoBox } from "./primitives";

// ── Timing ────────────────────────────────────────────────────────────
const CYCLE = 9600;
const TYPE_START = 300;
const TYPE_END = 1500;
const RESOLVE_START = 2000;
const RESOLVE_GAP = 300;
const RESOLVE_DUR = 520;
const RESET_START = 8700;
const RESET_DUR = 600;

const COMMAND = "docflow resolve --all";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const local = (t: number) => ((t % CYCLE) + CYCLE) % CYCLE;
const resetFade = (l: number) => 1 - clamp01((l - RESET_START) / RESET_DUR);

// ── Scene layout ─────────────────────────────────────────────────────
type Issue = "error" | "warn" | "retry" | "pending" | "paused";
type Tile = { sx: number; sy: number; kind: Issue; stacked?: boolean };

const TILE = 46;
const TILE_H = 6;

/** Tiles placed in screen space around the hub (0, 0); converted to world below. */
const LAYOUT: Tile[] = [
  { sx: -130, sy: -128, kind: "pending", stacked: true },
  { sx: -26, sy: -136, kind: "paused" },
  { sx: 121, sy: -162, kind: "error" },
  { sx: 102, sy: -81, kind: "warn" },
  { sx: 217, sy: -88, kind: "error" },
  { sx: 330, sy: -64, kind: "warn" },
  { sx: -310, sy: -64, kind: "retry" },
  { sx: -361, sy: 55, kind: "warn" },
  { sx: -210, sy: 65, kind: "error" },
  { sx: -94, sy: 94, kind: "pending" },
  { sx: -102, sy: 176, kind: "retry" },
  { sx: 174, sy: 66, kind: "warn", stacked: true },
  { sx: 310, sy: 34, kind: "retry", stacked: true },
];

const TILES = LAYOUT.map((tile) => {
  const a = tile.sx / S; // x - y
  const b = 2 * tile.sy; // x + y
  return { ...tile, wx: (a + b) / 2, wy: (b - a) / 2 };
})
  // resolve order: nearest to the hub first
  .map((tile, _, all) => ({
    ...tile,
    rank: [...all]
      .sort((p, q) => Math.hypot(p.sx, p.sy * 2) - Math.hypot(q.sx, q.sy * 2))
      .indexOf(tile),
  }))
  // painter's order: back to front
  .sort((p, q) => p.wx + p.wy - (q.wx + q.wy));

const ISSUE_COUNT = TILES.length;
const RESOLVE_END = RESOLVE_START + (ISSUE_COUNT - 1) * RESOLVE_GAP + RESOLVE_DUR;

const HUB = { size: 150, h: 22 };

const resolveAt = (rank: number) => RESOLVE_START + rank * RESOLVE_GAP;

/** 0 → still broken, 1 → resolved (falls back to 0 during the reset). */
const doneAmount = (l: number, rank: number) =>
  clamp01((l - resolveAt(rank) - RESOLVE_DUR * 0.35) / (RESOLVE_DUR * 0.35)) * resetFade(l);

// Theme tokens (styles/scene.css) so the scene follows light/dark.
const COLORS = {
  danger: "var(--danger)",
  accent: "var(--scene-accent)",
  grid: "var(--scene-hairline)",
};

// ── Component ────────────────────────────────────────────────────────
export function ResolveScene({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "100px" });
  const reduce = useReducedMotion();
  const live = useTime();
  const still = useMotionValue(RESOLVE_END + 400);
  // Only animate while on screen, so scrolling never has to repaint this scene.
  const t = reduce || !inView ? still : live;

  return (
    <div ref={ref} className={className}>
      <Terminal t={t} />
      <div className="relative mt-6">
      {/* Static floor, kept in its own SVG so the animation never repaints it */}
      <svg viewBox="-460 -250 920 500" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          {/* Luminance mask (white = visible), not a palette color: theme-independent */}
          <radialGradient id="rs-grid-fade" cx="0" cy="0" r="460" gradientUnits="userSpaceOnUse" gradientTransform="scale(1 0.62)">
            <stop offset="0.35" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id="rs-grid-mask" maskUnits="userSpaceOnUse" x="-460" y="-250" width="920" height="500">
            <rect x="-460" y="-250" width="920" height="500" fill="url(#rs-grid-fade)" />
          </mask>
        </defs>
        <Floor />
      </svg>
      <svg
        viewBox="-460 -250 920 500"
        className="scene-resolve relative w-full"
        role="img"
        aria-label="Failed tasks around a central hub resolving one by one into completed checkmarks"
      >
        <defs>
          <linearGradient id="rs-plate" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--scene-plate-from)" />
            <stop offset="1" stopColor="var(--scene-plate-to)" />
          </linearGradient>
          <radialGradient id="rs-glow">
            <stop offset="0" stopColor="var(--scene-accent)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--scene-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <Ripples t={t} />

        {TILES.filter((tile) => tile.wx + tile.wy < 0).map((tile) => (
          <IssueTile key={`${tile.sx}:${tile.sy}`} tile={tile} t={t} />
        ))}
        <Hub t={t} />
        {TILES.filter((tile) => tile.wx + tile.wy >= 0).map((tile) => (
          <IssueTile key={`${tile.sx}:${tile.sy}`} tile={tile} t={t} />
        ))}
      </svg>
      </div>
    </div>
  );
}

// ── Terminal ─────────────────────────────────────────────────────────
function Terminal({ t }: { t: MotionValue<number> }) {
  const typed = useTransform(t, (v) => {
    const l = local(v);
    if (l >= RESET_START) return "";
    const n = Math.round(clamp01((l - TYPE_START) / (TYPE_END - TYPE_START)) * COMMAND.length);
    return COMMAND.slice(0, n);
  });
  const status = useTransform(t, (v) => {
    const l = local(v);
    if (l < RESOLVE_START - 200 || l >= RESET_START) return "";
    if (l >= RESOLVE_END + 200) return `✓ ${ISSUE_COUNT} issues resolved`;
    const done = TILES.filter((tile) => l > resolveAt(tile.rank) + RESOLVE_DUR * 0.5).length;
    return `resolving ${done}/${ISSUE_COUNT}`;
  });
  const statusColor = useTransform(t, (v) => (local(v) >= RESOLVE_END + 200 ? "var(--scene-terminal-success)" : "var(--scene-terminal-muted)"));

  return (
    <div className="mx-auto flex h-12 w-full max-w-xl items-center gap-3 rounded-2xl border border-scene-terminal-border bg-scene-terminal px-5 font-mono text-sm text-scene-terminal-text shadow-[0_12px_32px_-12px_var(--scene-terminal-shadow)]">
      <span className="text-scene-terminal-muted">$</span>
      <span className="flex min-w-0 flex-1 items-center">
        <motion.span className="truncate">{typed}</motion.span>
        <span className="caret-blink ml-0.5 inline-block h-4 w-2 bg-scene-terminal-text/90" aria-hidden />
      </span>
      <motion.span className="shrink-0 text-xs" style={{ color: statusColor }}>
        {status}
      </motion.span>
    </div>
  );
}

// ── Floor ────────────────────────────────────────────────────────────
function Floor() {
  const span = 520;
  const step = 40;
  const lines = Array.from({ length: (span * 2) / step + 1 }, (_, i) => -span + i * step);
  return (
    <g mask="url(#rs-grid-mask)">
      <g transform={topPlane(0)} stroke={COLORS.grid} strokeWidth={1}>
        {lines.map((p) => (
          <g key={p}>
            <line x1={p} x2={p} y1={-span} y2={span} vectorEffect="non-scaling-stroke" />
            <line y1={p} y2={p} x1={-span} x2={span} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </g>
    </g>
  );
}

function Ripples({ t }: { t: MotionValue<number> }) {
  return (
    <g transform={topPlane(0)}>
      {[0, 1, 2].map((i) => (
        <Ripple key={i} t={t} delay={i * 1300} />
      ))}
    </g>
  );
}

function Ripple({ t, delay }: { t: MotionValue<number>; delay: number }) {
  const PERIOD = 2600;
  const k = useTransform(t, (v) => {
    const l = local(v);
    const start = RESOLVE_START - 300 + delay;
    if (l < start || l > RESOLVE_END) return -1;
    return ((l - start) % PERIOD) / PERIOD;
  });
  const r = useTransform(k, (p) => (p < 0 ? 0 : 90 + p * 300));
  const opacity = useTransform(k, (p) => (p < 0 ? 0 : (1 - p) * 0.5));
  return (
    <motion.circle
      cx={0}
      cy={0}
      fill="none"
      stroke={COLORS.accent}
      strokeWidth={1.2}
      vectorEffect="non-scaling-stroke"
      r={r}
      style={{ opacity }}
    />
  );
}

// ── Hub ──────────────────────────────────────────────────────────────
function Hub({ t }: { t: MotionValue<number> }) {
  const s = HUB.size;
  const x = -s / 2;
  const glow = useTransform(t, (v) => {
    const l = local(v);
    const on = clamp01((l - RESOLVE_START + 400) / 400) * (1 - clamp01((l - RESOLVE_END) / 600));
    return on * (0.55 + 0.25 * Math.sin(l / 180));
  });
  const shine = useTransform(glow, (g) => g * 0.18);
  const bolt = s / 2 - 12;

  return (
    <g>
      <motion.ellipse cx={0} cy={-HUB.h} rx={190} ry={110} fill="url(#rs-glow)" style={{ opacity: glow }} />
      <IsoBox x={x} y={x} w={s} d={s} h={HUB.h} r={18}>
        <rect x={x + 8} y={x + 8} width={s - 16} height={s - 16} rx={12} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        {[
          [-bolt, -bolt],
          [bolt, -bolt],
          [-bolt, bolt],
          [bolt, bolt],
        ].map(([bx, by]) => (
          <circle key={`${bx}${by}`} cx={bx} cy={by} r={2.6} fill="var(--scene-paper-sunken)" stroke="var(--iso-ink)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ))}
        <rect x={-48} y={-48} width={96} height={96} rx={12} fill="url(#rs-plate)" />
        <motion.rect x={-48} y={-48} width={96} height={96} rx={12} fill="var(--scene-on-accent)" style={{ opacity: shine }} />
        {/* Brand mark */}
        <EmblemMark size={64} fill="var(--scene-on-accent)" />
      </IsoBox>
    </g>
  );
}

// ── Tiles ────────────────────────────────────────────────────────────
type PlacedTile = (typeof TILES)[number];

function IssueTile({ tile, t }: { tile: PlacedTile; t: MotionValue<number> }) {
  const x = tile.wx - TILE / 2;
  const y = tile.wy - TILE / 2;
  const cx = tile.wx;
  const cy = tile.wy;

  const lift = useTransform(t, (v) => {
    const p = clamp01((local(v) - resolveAt(tile.rank)) / RESOLVE_DUR);
    return -Math.sin(p * Math.PI) * 14;
  });
  const done = useTransform(t, (v) => doneAmount(local(v), tile.rank));
  const broken = useTransform(done, (d) => 1 - d);
  const tint = useTransform(done, (d) => d * 0.9);

  return (
    <g>
      {tile.stacked ? <IsoBox x={x - 7} y={y + 5} w={TILE} d={TILE} h={TILE_H} r={7} strokeWidth={1} /> : null}
      <motion.g style={{ y: lift }}>
        <IsoBox x={x} y={y} z={tile.stacked ? TILE_H : 0} w={TILE} d={TILE} h={TILE_H} r={7} strokeWidth={1}>
          <rect x={x + 4} y={y + 4} width={TILE - 8} height={TILE - 8} rx={4.5} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <motion.rect x={x + 1} y={y + 1} width={TILE - 2} height={TILE - 2} rx={6} fill="var(--scene-accent-wash)" style={{ opacity: tint }} />
          <g transform={`translate(${cx} ${cy})`}>
            <motion.g style={{ opacity: broken }}>
              <IssueIcon kind={tile.kind} />
            </motion.g>
            <motion.g style={{ opacity: done }}>
              <CheckIcon />
            </motion.g>
          </g>
        </IsoBox>
      </motion.g>
    </g>
  );
}

const iconStroke = {
  fill: "none",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  vectorEffect: "non-scaling-stroke" as const,
};

function IssueIcon({ kind }: { kind: Issue }) {
  const c = COLORS.danger;
  switch (kind) {
    case "error":
      return (
        <g stroke={c} {...iconStroke}>
          <circle r={9} />
          <path d="M-3.5 -3.5L3.5 3.5M3.5 -3.5L-3.5 3.5" />
        </g>
      );
    case "warn":
      return (
        <g stroke={c} {...iconStroke}>
          <path d="M0 -8.5L9.5 7.5H-9.5Z" />
          <path d="M0 -2.5V2" />
          <circle cy={4.8} r={0.4} />
        </g>
      );
    case "retry":
      return (
        <g stroke={c} {...iconStroke}>
          <path d="M7.4 -3.6A8.2 8.2 0 1 0 8.2 1.6" />
          <path d="M8.4 -8V-3.2H3.6" />
        </g>
      );
    case "pending":
      return (
        <g stroke={c} {...iconStroke}>
          <circle r={8.5} strokeDasharray="3 3.2" />
        </g>
      );
    case "paused":
      return (
        <g stroke={c} {...iconStroke}>
          <path d="M-7 -2.5H7M-7 2.5H7" />
        </g>
      );
  }
}

function CheckIcon() {
  return (
    <g>
      <circle r={10} fill={COLORS.accent} />
      <path d="M-5 -1L-1.2 3.6L5 -4.4" stroke="var(--scene-on-accent)" {...iconStroke} strokeWidth={2.2} />
    </g>
  );
}

"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { cx } from "@/utils/cx";
import { project, tiltWallX, topPlane, wallY } from "./iso";
import { IsoBox } from "./primitives";
import {
  ACCENT,
  ACCENT_SOFT,
  Bob,
  FILL,
  FILL_STRONG,
  INK,
  ORANGE,
  PAPER,
  SERVICE_VIEWBOX,
  SOLID,
  clamp01,
  mod,
  nss,
  useSceneClock,
} from "./kit";

export function CustomSoftwareScene({ className }: { className?: string }) {
  const { ref, t } = useSceneClock(2200);
  return (
    <svg
      ref={ref}
      viewBox={SERVICE_VIEWBOX}
      className={cx("scene-service", className)}
      role="img"
      aria-label="A developer workstation: a monitor with code being typed, a profile card, a code badge, a tablet showing wireframes, a keyboard and a mouse"
    >
      <Monitor />
      <CodeWindow t={t} />
      <ProfileCard t={t} />
      <CodeBadge t={t} />
      <Tablet t={t} />
      <Keyboard t={t} />
      <Mouse t={t} />
    </svg>
  );
}

// ── Monitor ──────────────────────────────────────────────────────────
const MON = { x: -31, y: -114, w: 300, d: 14, z: 60, h: 180 };

function Monitor() {
  const face = MON.y + MON.d;
  return (
    <g>
      <IsoBox x={70} y={-170} w={110} d={80} h={6} r={10} top={FILL_STRONG} />
      <IsoBox x={112} y={-128} z={6} w={26} d={14} h={MON.z - 6} r={4} />
      <IsoBox {...MON} r={8} top={FILL_STRONG} left={["var(--iso-wall-r1)", "var(--iso-wall-r1)"]} />
      <g transform={wallY(face)}>
        <rect x={MON.x + 8} y={MON.z + 8} width={MON.w - 16} height={MON.h - 16} rx={6} fill={ACCENT_SOFT} stroke={INK} strokeWidth={1.1} {...nss} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={MON.x + 190} y={MON.z + 128 - i * 18} width={[60, 44, 52, 30][i]} height={6} rx={3} fill={i === 0 ? ACCENT : PAPER} />
        ))}
        <rect x={MON.x + 190} y={MON.z + 22} width={70} height={36} rx={4} fill={PAPER} stroke={INK} strokeWidth={0.9} {...nss} />
      </g>
      {/* side buttons */}
      {[0, 1].map((i) => {
        const [x, y] = project(MON.x + MON.w, MON.y + 4, MON.z + 70 + i * 22);
        return <rect key={i} x={x - 1} y={y - 12} width={3} height={12} rx={1.5} fill={SOLID} />;
      })}
    </g>
  );
}

// ── Browser window with code being typed ─────────────────────────────
const WIN = { x: -120, y: -52, w: 250, d: 10, z: 40, h: 170 };
const LEFT = [70, 52, 86, 40, 64, 78, 46, 58];
const RIGHT = [60, 44, 70, 36, 54];

function CodeWindow({ t }: { t: MotionValue<number> }) {
  const face = WIN.y + WIN.d;
  const top = WIN.z + WIN.h;
  const mid = WIN.x + 120;
  return (
    <g>
      <IsoBox {...WIN} r={4} />
      <g transform={wallY(face)}>
        <rect x={WIN.x + 4} y={WIN.z + 4} width={WIN.w - 8} height={WIN.h - 8} rx={4} fill={PAPER} stroke={INK} strokeWidth={1.1} {...nss} />
        <rect x={WIN.x + 4} y={top - 22} width={WIN.w - 8} height={18} rx={4} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={WIN.x + 16 + i * 10} cy={top - 13} r={3} fill={PAPER} stroke={INK} strokeWidth={0.9} {...nss} />
        ))}
        <line x1={mid} x2={mid} y1={WIN.z + 8} y2={top - 22} stroke={INK} strokeWidth={0.9} {...nss} />
        {LEFT.map((len, i) => (
          <TypedLine key={i} x={WIN.x + 16 + (i % 3) * 8} y={top - 40 - i * 15} len={len} i={i} n={LEFT.length} t={t} />
        ))}
        {RIGHT.map((len, i) => (
          <g key={i}>
            <circle cx={mid + 14} cy={top - 37 - i * 22} r={3} fill={PAPER} stroke={INK} strokeWidth={0.9} {...nss} />
            <rect x={mid + 24} y={top - 40 - i * 22} width={len} height={6} rx={3} fill={i === 1 ? ACCENT : FILL} />
          </g>
        ))}
      </g>
    </g>
  );
}

const TYPE_CYCLE = 6400;

function TypedLine({ x, y, len, i, n, t }: { x: number; y: number; len: number; i: number; n: number; t: MotionValue<number> }) {
  const w = useTransform(t, (v) => {
    const p = mod(v, TYPE_CYCLE) / TYPE_CYCLE;
    if (p > 0.9) return len * (1 - clamp01((p - 0.9) / 0.05));
    return len * clamp01((p * 0.85 * n - i) / 0.9);
  });
  const caretX = useTransform(w, (ww) => x + ww + 2);
  const caret = useTransform(t, (v) => {
    const p = mod(v, TYPE_CYCLE) / TYPE_CYCLE;
    const active = Math.min(n - 1, Math.floor(p * 0.85 * n));
    return active === i && p < 0.9 ? (mod(v, 500) < 280 ? 1 : 0) : 0;
  });
  return (
    <g>
      <motion.rect x={x} y={y} width={w} height={6} rx={3} fill={i % 3 === 2 ? ACCENT : FILL_STRONG} />
      <motion.rect x={caretX} y={y - 2} width={2} height={10} fill={INK} style={{ opacity: caret }} />
    </g>
  );
}

// ── Profile card ─────────────────────────────────────────────────────
function ProfileCard({ t }: { t: MotionValue<number> }) {
  const c = { x: 186, y: -70, w: 66, d: 8, z: 176, h: 84 };
  const face = c.y + c.d;
  return (
    <Bob t={t} phase={0.8} amp={6}>
      <IsoBox {...c} r={4} />
      <g transform={wallY(face)}>
        <rect x={c.x + 4} y={c.z + 4} width={c.w - 8} height={c.h - 8} rx={4} fill={PAPER} stroke={INK} strokeWidth={1} {...nss} />
        <circle cx={c.x + c.w / 2} cy={c.z + 56} r={14} fill={FILL_STRONG} stroke={INK} strokeWidth={1} {...nss} />
        <circle cx={c.x + c.w / 2} cy={c.z + 60} r={5} fill={PAPER} />
        <rect x={c.x + 12} y={c.z + 26} width={c.w - 24} height={6} rx={3} fill={ACCENT} />
        <rect x={c.x + 18} y={c.z + 14} width={c.w - 36} height={5} rx={2.5} fill={FILL} />
      </g>
    </Bob>
  );
}

// ── </> badge ────────────────────────────────────────────────────────
function CodeBadge({ t }: { t: MotionValue<number> }) {
  const b = { x: 206, y: -56, w: 64, d: 14, z: 56, h: 60 };
  const face = b.y + b.d;
  const u = b.x + b.w / 2;
  const v = b.z + b.h / 2;
  const glow = useTransform(t, (x) => 0.55 + 0.45 * Math.sin(x / 500));
  return (
    <Bob t={t} phase={2.4} amp={5}>
      <IsoBox {...b} r={6} {...ORANGE} />
      <g transform={wallY(face)}>
        <rect x={b.x + 6} y={b.z + 6} width={b.w - 12} height={b.h - 12} rx={5} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
        <motion.g style={{ opacity: glow }} fill="none" stroke={SOLID} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
          <path d={`M${u - 9} ${v + 9}L${u - 18} ${v}L${u - 9} ${v - 9}`} />
          <path d={`M${u + 9} ${v + 9}L${u + 18} ${v}L${u + 9} ${v - 9}`} />
          <path d={`M${u + 4} ${v + 12}L${u - 4} ${v - 12}`} />
        </motion.g>
      </g>
    </Bob>
  );
}

// ── Tablet on a kickstand, cycling through wireframes ────────────────
const TAB = { c: -20, y0: 120, w: 210, h: 150, tilt: 24 };

function Tablet({ t }: { t: MotionValue<number> }) {
  const plane = (dx = 0) => tiltWallX(TAB.c + dx, TAB.tilt);
  const { y0, w, h } = TAB;
  // Kickstand: from the tablet's back to the floor behind it
  const back = (u: number, v: number): [number, number] => {
    const a = (TAB.tilt * Math.PI) / 180;
    return project(TAB.c - 6 - v * Math.sin(a), u, v * Math.cos(a));
  };
  const k1 = back(y0 + 60, 110);
  const k2 = back(y0 + 150, 110);
  const g1 = project(TAB.c - 110, y0 + 70, 0);
  const g2 = project(TAB.c - 110, y0 + 140, 0);
  return (
    <g>
      <path d={`M${k1[0]} ${k1[1]}L${k2[0]} ${k2[1]}L${g2[0]} ${g2[1]}L${g1[0]} ${g1[1]}Z`} fill={ACCENT} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      {[-8, -6, -4, -2].map((dx) => (
        <g key={dx} transform={plane(dx)}>
          <rect x={y0} y={0} width={w} height={h} rx={12} fill={SOLID} />
        </g>
      ))}
      <g transform={plane()}>
        <rect x={y0} y={0} width={w} height={h} rx={12} fill={FILL_STRONG} stroke={INK} strokeWidth={1.2} {...nss} />
        <rect x={y0 + 10} y={10} width={w - 20} height={h - 20} rx={6} fill={PAPER} stroke={INK} strokeWidth={1} {...nss} />
        {/* header bar; wallX u grows to the left on screen, so "start" is the high-u side */}
        <rect x={y0 + w - 30 - 110} y={h - 34} width={110} height={10} rx={5} fill={ACCENT} stroke={INK} strokeWidth={0.9} {...nss} />
        {[0, 1, 2].map((i) => (
          <Wire key={i} i={i} u={y0 + w - 24 - (i + 1) * 54} v={42} t={t} />
        ))}
        {[0, 1].map((i) => (
          <rect key={i} x={y0 + w - 24 - 140 + i * 40} y={22 - 0} width={140 - i * 40} height={5} rx={2.5} fill={FILL_STRONG} />
        ))}
      </g>
    </g>
  );
}

function Wire({ i, u, v, t }: { i: number; u: number; v: number; t: MotionValue<number> }) {
  const on = useTransform(t, (x) => (Math.floor(mod(x, 3600) / 1200) === i ? 1 : 0));
  const s = 46;
  return (
    <g>
      <motion.rect x={u} y={v} width={s} height={s} rx={2} fill={ACCENT_SOFT} style={{ opacity: on }} />
      <rect x={u} y={v} width={s} height={s} rx={2} fill="none" stroke={INK} strokeWidth={1} {...nss} />
      <path d={`M${u} ${v}L${u + s} ${v + s}M${u + s} ${v}L${u} ${v + s}`} stroke={INK} strokeWidth={0.9} {...nss} />
    </g>
  );
}

// ── Keyboard with keys tapping ───────────────────────────────────────
const KB = { x: 125, y: -40, w: 74, d: 196 };
const KEYS = Array.from({ length: 3 }, (_, r) => Array.from({ length: 8 }, (_, c) => ({ r, c }))).flat();

function Keyboard({ t }: { t: MotionValue<number> }) {
  return (
    <g>
      <IsoBox {...KB} h={8} r={10} />
      {KEYS.map(({ r, c }) => (
        <Key key={`${r}${c}`} r={r} c={c} t={t} />
      ))}
    </g>
  );
}

function Key({ r, c, t }: { r: number; c: number; t: MotionValue<number> }) {
  const seed = (r * 8 + c) * 7919;
  const dy = useTransform(t, (v) => {
    const beat = Math.floor(v / 170);
    return (beat * 31 + seed) % 24 === 0 ? 2.5 : 0;
  });
  const space = r === 2 && c >= 2 && c <= 5;
  if (space && c !== 2) return null;
  return (
    <motion.g style={{ y: dy }}>
      <IsoBox
        x={KB.x + 8 + r * 22}
        y={KB.y + 8 + c * 22.5}
        z={8}
        w={18}
        d={space ? 18 + 22.5 * 3 : 18}
        h={5}
        r={4}
      />
    </motion.g>
  );
}

// ── Mouse with a clicking button ─────────────────────────────────────
function Mouse({ t }: { t: MotionValue<number> }) {
  const m = { x: 330, y: 12, w: 64, d: 40 };
  const click = useTransform(t, (v) => (mod(v, 1800) < 160 ? 1.5 : 0));
  const glow = useTransform(t, (v) => (mod(v, 1800) < 400 ? 1 : 0.35));
  const [sx, sy] = project(m.x + 14, m.y + m.d / 2, 16);
  return (
    <g>
      <IsoBox {...m} h={14} r={19} />
      <g transform={topPlane(14)}>
        <line x1={m.x + 22} x2={m.x + 22} y1={m.y + 3} y2={m.y + m.d - 3} stroke={INK} strokeWidth={1} {...nss} />
        <motion.line x1={m.x + 2} x2={m.x + 22} y1={m.y + m.d / 2} y2={m.y + m.d / 2} stroke={INK} strokeWidth={1} style={{ y: click }} {...nss} />
      </g>
      <motion.ellipse cx={sx} cy={sy} rx={4} ry={2.5} fill={ACCENT} stroke={INK} strokeWidth={0.9} style={{ opacity: glow }} />
    </g>
  );
}

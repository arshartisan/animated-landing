"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { cx } from "@/utils/cx";
import { RingMark } from "@/components/brand/Emblem";
import { halfSpaceClip, project, topPlane, wallRect, wallX, wallY } from "./iso";
import { Cylinder, IsoBox } from "./primitives";
import { ACCENT, ACCENT_SOFT, INK, ON_ACCENT, ORANGE, PAPER, RECESS, SOLID, ease, mod, nss, useSceneClock } from "./kit";

// ── Timing ───────────────────────────────────────────────────────────
const STEP = 2400;
const MOVE = 1300;
const progress = (t: number) => {
  const n = Math.floor(t / STEP);
  const f = t - n * STEP;
  return n + (f < MOVE ? ease(f / MOVE) : 1);
};
/** 0 → 1 while the conveyor is paused (the hub is "processing"). */
const dwell = (t: number) => {
  const f = mod(t, STEP);
  return f < MOVE ? 0 : Math.sin(((f - MOVE) / (STEP - MOVE)) * Math.PI);
};

// ── Layout (world units) ─────────────────────────────────────────────
const LANE = 45; // track half width
const TILE = 58;
const TILE_H = 22;
const PITCH = 150;
const SLOTS = 8;
const X0 = -600; // first slot
const FADE = 80;
const HUB = { x: -95, y: -95, w: 190, d: 190, z: 8, h: 80 };
const HUB_TOP = HUB.z + HUB.h;
const WELL = 62; // glass well half size
const MOUTH = { from: -34, to: 34, z1: HUB.z + 46 }; // exit opening on the +x face

// Tiles leaving the hub show in front of its +x face, and only through the opening while inside.
const EXIT_CLIP = (() => {
  const c = HUB.x + HUB.w;
  const zMax = 60;
  return (
    halfSpaceClip("x", c, zMax) +
    wallRect("x", c, HUB.y, HUB.y + HUB.d, 0, zMax) +
    wallRect("x", c, MOUTH.from, MOUTH.to, 0, MOUTH.z1)
  );
})();

export function HubScene({ className }: { className?: string }) {
  const { ref, t } = useSceneClock(MOVE + 500);
  return (
    <svg
      ref={ref}
      viewBox="-470 -255 940 470"
      className={cx("scene-machine", className)}
      role="img"
      aria-label="ONO hub: blank documents slide in along a track, get validated under glass and leave secured"
    >
      <defs>
        <clipPath id="hub-exit-clip">
          <path d={EXIT_CLIP} clipRule="evenodd" />
        </clipPath>
        <clipPath id="hub-well-clip">
          <rect x={-WELL} y={-WELL} width={WELL * 2} height={WELL * 2} rx={14} transform={topPlane(HUB_TOP)} />
        </clipPath>
        <linearGradient id="hub-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.14" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.86" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* Luminance mask (white = visible): fades the track out at both ends */}
        <mask id="hub-track-mask" maskUnits="userSpaceOnUse" x="-470" y="-255" width="940" height="470">
          <rect x="-470" y="-255" width="940" height="470" fill="url(#hub-fade)" />
        </mask>
      </defs>

      <g mask="url(#hub-track-mask)">
        <Track />
        {Array.from({ length: SLOTS }, (_, i) => (
          <Tile key={i} i={i} t={t} side="in" />
        ))}
      </g>

      <Hub t={t} />
      <Panel t={t} />

      <g mask="url(#hub-track-mask)">
        <g clipPath="url(#hub-exit-clip)">
          {Array.from({ length: SLOTS }, (_, i) => (
            <Tile key={i} i={i} t={t} side="out" />
          ))}
        </g>
      </g>
    </svg>
  );
}

// ── Track ────────────────────────────────────────────────────────────
function Track() {
  return (
    <g transform={topPlane(0)}>
      <rect x={-700} y={-LANE} width={1400} height={LANE * 2} fill={PAPER} stroke={INK} strokeWidth={1} {...nss} />
      <rect
        x={HUB.x - 18}
        y={HUB.y - 18}
        width={HUB.w + 36}
        height={HUB.d + 36}
        rx={22}
        fill="none"
        stroke={INK}
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.7}
        {...nss}
      />
    </g>
  );
}

// ── Tiles ────────────────────────────────────────────────────────────
function Tile({ i, t, side }: { i: number; t: MotionValue<number>; side: "in" | "out" }) {
  const x = useTransform(t, (v) => X0 + mod(progress(v) + i, SLOTS) * PITCH);
  const shift = useTransform(x, (wx) => project(wx, 0));
  const sx = useTransform(shift, (p) => p[0]);
  const sy = useTransform(shift, (p) => p[1]);
  const opacity = useTransform(x, (wx) => {
    const edge = Math.min(1, (wx - X0) / FADE, (X0 + (SLOTS - 1) * PITCH - wx) / FADE);
    const here = side === "in" ? wx < 0 : wx >= 0;
    return here ? Math.max(0, edge) : 0;
  });
  const h = TILE / 2;
  return (
    <motion.g style={{ x: sx, y: sy, opacity }}>
      <g transform={topPlane(0)}>
        <rect x={-h - 10} y={-h - 10} width={TILE + 20} height={TILE + 20} rx={14} fill="none" stroke={INK} strokeWidth={1} strokeDasharray="4 4" opacity={0.6} {...nss} />
      </g>
      <IsoBox x={-h} y={-h} w={TILE} d={TILE} h={TILE_H} r={12}>
        {side === "out" ? (
          <g>
            <rect x={-18} y={-18} width={36} height={36} rx={5} fill={ACCENT_SOFT} stroke={INK} strokeWidth={1} {...nss} />
            <rect x={-12} y={-12} width={24} height={24} rx={3} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
            <path d="M-6 -3h12M-6 3h8" stroke={PAPER} strokeWidth={1.6} strokeLinecap="round" {...nss} />
          </g>
        ) : null}
      </IsoBox>
    </motion.g>
  );
}

// ── Hub ──────────────────────────────────────────────────────────────
function Hub({ t }: { t: MotionValue<number> }) {
  const scan = useTransform(t, (v) => -WELL + 10 + (mod(v, STEP) / STEP) * (WELL * 2 - 20));
  const glow = useTransform(t, (v) => dwell(v) * 0.85);
  const glass = useTransform(t, (v) => 0.18 + dwell(v) * 0.12);
  const core = HUB_TOP - 6;
  return (
    <g>
      {/* Base plate with vents */}
      <IsoBox x={HUB.x - 12} y={HUB.y - 12} w={HUB.w + 24} d={HUB.d + 24} h={HUB.z} r={16} />
      <IsoBox {...HUB} r={14} />
      <g transform={wallY(HUB.y + HUB.d)}>
        {Array.from({ length: 9 }, (_, k) => (
          <rect key={k} x={HUB.x + 26 + k * 16} y={HUB.z + 10} width={3} height={10} rx={1.5} fill={INK} opacity={0.55} />
        ))}
      </g>
      <g transform={wallX(HUB.x + HUB.w)}>
        <rect x={MOUTH.from} y={HUB.z} width={MOUTH.to - MOUTH.from} height={MOUTH.z1 - HUB.z} rx={4} fill={SOLID} />
      </g>

      {/* Glass well with the validation core inside */}
      <g transform={topPlane(HUB_TOP)}>
        <rect x={-WELL - 10} y={-WELL - 10} width={(WELL + 10) * 2} height={(WELL + 10) * 2} rx={20} fill="none" stroke={INK} strokeWidth={1.2} {...nss} />
        <rect x={-WELL} y={-WELL} width={WELL * 2} height={WELL * 2} rx={14} fill={RECESS} stroke={INK} strokeWidth={1.2} {...nss} />
      </g>
      <g clipPath="url(#hub-well-clip)">
        <IsoBox x={-40} y={-40} z={core - 40} w={80} d={80} h={40} r={10}>
          <RingMark size={48} fill={ACCENT} />
          <motion.rect x={-40} y={-40} width={80} height={80} rx={10} fill={ACCENT} style={{ opacity: glow }} />
          <motion.g style={{ opacity: glow }}>
            <RingMark size={48} fill={ON_ACCENT} />
          </motion.g>
        </IsoBox>
        <g transform={topPlane(HUB_TOP)}>
          <motion.rect x={-WELL} y={-WELL} width={WELL * 2} height={WELL * 2} rx={14} fill={PAPER} style={{ opacity: glass }} />
          <motion.line x1={-WELL} x2={WELL} y1={scan} y2={scan} stroke={ACCENT} strokeWidth={1.6} style={{ opacity: glow }} {...nss} />
          <path d={`M${-WELL + 16} ${-WELL + 40}L${-WELL + 40} ${-WELL + 16}M${-WELL + 16} ${-WELL + 62}L${-WELL + 62} ${-WELL + 16}`} stroke={PAPER} strokeWidth={2} strokeLinecap="round" opacity={0.7} {...nss} />
        </g>
      </g>

      {/* Corner bolts */}
      {[
        [HUB.x + 16, HUB.y + 16],
        [HUB.x + HUB.w - 16, HUB.y + 16],
        [HUB.x + 16, HUB.y + HUB.d - 16],
        [HUB.x + HUB.w - 16, HUB.y + HUB.d - 16],
      ].map(([bx, by]) => (
        <Cylinder key={`${bx}${by}`} x={bx} y={by} z={HUB_TOP} r={7} h={4} />
      ))}
    </g>
  );
}

// ── Control panel ────────────────────────────────────────────────────
const PANEL = { x: -150, y: 150, w: 150, d: 70, h: 9 };

function Panel({ t }: { t: MotionValue<number> }) {
  const P = PANEL;
  const gauge = useTransform(t, (v) => 0.25 + 0.7 * dwell(v));
  const swing = useTransform(t, (v) => {
    const n = Math.floor(v / STEP);
    const f = mod(v, STEP);
    const e = f < MOVE ? ease(f / MOVE) : 1;
    return n % 2 === 0 ? e : 1 - e;
  });
  const g = { x: P.x + 34, y: P.y + P.d / 2 };
  const track = { from: P.x + 70, to: P.x + 136 };
  const knob = 14;
  const travel = track.to - track.from - knob;
  const shiftA = useTransform(swing, (s) => project(travel * s, 0));
  const shiftB = useTransform(swing, (s) => project(travel * (1 - s), 0));
  const ax = useTransform(shiftA, (p) => p[0]);
  const ay = useTransform(shiftA, (p) => p[1]);
  const bx = useTransform(shiftB, (p) => p[0]);
  const by = useTransform(shiftB, (p) => p[1]);
  const rows = [P.y + 22, P.y + 48];
  return (
    <g>
      <g transform={topPlane(0)}>
        <rect x={P.x - 14} y={P.y - 14} width={P.w + 28} height={P.d + 28} rx={18} fill="none" stroke={INK} strokeWidth={1} strokeDasharray="4 4" opacity={0.7} {...nss} />
      </g>
      <IsoBox x={P.x} y={P.y} w={P.w} d={P.d} h={P.h} r={12}>
        <path d={`M${g.x - 20} ${g.y}A20 20 0 0 1 ${g.x + 20} ${g.y}`} fill="none" stroke={RECESS} strokeWidth={9} strokeLinecap="round" />
        <motion.path
          d={`M${g.x - 20} ${g.y}A20 20 0 0 1 ${g.x + 20} ${g.y}`}
          fill="none"
          stroke={ACCENT}
          strokeWidth={9}
          strokeLinecap="round"
          style={{ pathLength: gauge }}
        />
        <circle cx={g.x} cy={g.y + 12} r={4} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
        {rows.map((ry) => (
          <rect key={ry} x={track.from} y={ry - 2.5} width={track.to - track.from} height={5} rx={2.5} fill={RECESS} stroke={INK} strokeWidth={1} {...nss} />
        ))}
      </IsoBox>
      <motion.g style={{ x: ax, y: ay }}>
        <IsoBox x={track.from} y={rows[0] - knob / 2} z={P.h} w={knob} d={knob} h={8} r={3} {...ORANGE} />
      </motion.g>
      <motion.g style={{ x: bx, y: by }}>
        <IsoBox x={track.from} y={rows[1] - knob / 2} z={P.h} w={knob} d={knob} h={8} r={3} />
      </motion.g>
    </g>
  );
}

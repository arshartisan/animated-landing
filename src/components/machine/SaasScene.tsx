"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { cx } from "@/utils/cx";
import { project, topPlane, wallX, wallY, type Pt } from "./iso";
import { Cylinder, IsoBox } from "./primitives";
import {
  ACCENT,
  Bob,
  Cube,
  FILL,
  FILL_STRONG,
  INK,
  Led,
  ORANGE,
  PAD_H,
  PAPER,
  Pad,
  SERVICE_VIEWBOX,
  SOLID,
  Window,
  along,
  ease,
  mod,
  nss,
  polyPath,
  span,
  toWorld,
  useSceneClock,
} from "./kit";

// ── Layout ───────────────────────────────────────────────────────────
const SHIFT = 40; // whole scene sits a little lower in the frame
const MON = { x: -140, y: -20, w: 280, h: 160, z: 124, t: 14 };
const face = MON.y + MON.t;

/** A window placed by the screen position of its face's bottom-left corner. */
const placeWin = (sx: number, sy: number, z = 60, w = 110, h = 90, t = 8) => {
  const [x, yFace] = toWorld(sx, sy, z);
  return { x, y: yFace - t, z, w, h, t };
};
const WIN_L1 = placeWin(-375, -150);
const WIN_L2 = placeWin(-375, -20);
const WIN_R1 = placeWin(200, -110);
const WIN_R2 = placeWin(200, 20);

/** Screen point on a window face edge, at mid height. */
const port = (w: ReturnType<typeof placeWin>, side: "left" | "right") =>
  project(side === "right" ? w.x + w.w : w.x, w.y + w.t, w.z + w.h / 2);

const cubicPts = (a: Pt, b: Pt, c: Pt, d: Pt, n = 18): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const k = i / n;
    const q = 1 - k;
    return [
      q * q * q * a[0] + 3 * q * q * k * b[0] + 3 * q * k * k * c[0] + k * k * k * d[0],
      q * q * q * a[1] + 3 * q * q * k * b[1] + 3 * q * k * k * c[1] + k * k * k * d[1],
    ] as Pt;
  });

const MON_L = project(MON.x, face, MON.z + 85);
const MON_R = project(MON.x + MON.w, face, MON.z + 70);
const J_L: Pt = [MON_L[0] - 60, MON_L[1] + 22];
const J_R: Pt = [MON_R[0] + 55, MON_R[1] + 6];
const wireTo = (from: Pt, j: Pt): Pt[] =>
  cubicPts(from, [from[0] + (j[0] - from[0]) * 0.55, from[1]], [j[0] - (j[0] - from[0]) * 0.1, j[1]], j);
const WIRES: Pt[][] = [
  [...wireTo(port(WIN_L1, "right"), J_L), MON_L],
  [...wireTo(port(WIN_L2, "right"), J_L), MON_L],
  [...wireTo(port(WIN_R1, "left"), J_R), MON_R],
  [...wireTo(port(WIN_R2, "left"), J_R), MON_R],
];

// ── Scene ────────────────────────────────────────────────────────────
export function SaasScene({ className }: { className?: string }) {
  const { ref, t } = useSceneClock(2400);
  return (
    <svg
      ref={ref}
      viewBox={SERVICE_VIEWBOX}
      className={cx("scene-machine", className)}
      role="img"
      aria-label="A SaaS dashboard on a server stack, synced to the cloud and to app windows, storage and modules"
    >
      <g transform={`translate(0 ${SHIFT})`}>
        <GroundWires t={t} />

        <Bob t={t} phase={0} amp={4}>
          <TilesWindow t={t} />
        </Bob>
        <Bob t={t} phase={1.6} amp={4}>
          <ListWindow t={t} />
        </Bob>
        <Bob t={t} phase={0.8} amp={4}>
          <VideoWindow t={t} />
        </Bob>
        <Bob t={t} phase={2.4} amp={4}>
          <ImageWindow />
        </Bob>

        {WIRES.map((w, i) => (
          <Wire key={i} pts={w} t={t} i={i} />
        ))}
        {[port(WIN_L1, "right"), port(WIN_L2, "right"), port(WIN_R1, "left"), port(WIN_R2, "left"), J_L, J_R].map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={5} fill={PAPER} stroke={ACCENT} strokeWidth={2} />
        ))}

        <ServerStack t={t} />
        <Monitor t={t} />
        <Cloud t={t} />

        <Modules />
        <Storage t={t} />
      </g>
    </svg>
  );
}

// ── Wires ────────────────────────────────────────────────────────────
function Wire({ pts, t, i }: { pts: Pt[]; t: MotionValue<number>; i: number }) {
  const k = useTransform(t, (v) => mod(v / 2200 + i * 0.3, 1));
  const p = useTransform(k, (kk) => along(pts, i < 2 ? kk : 1 - kk));
  const cx_ = useTransform(p, (q) => q[0]);
  const cy_ = useTransform(p, (q) => q[1]);
  const opacity = useTransform(k, (kk) => Math.min(1, kk / 0.1, (1 - kk) / 0.1));
  return (
    <g>
      <path d={polyPath(pts)} fill="none" stroke={ACCENT} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
      <motion.circle cx={cx_} cy={cy_} r={3.6} fill={ACCENT} stroke={INK} strokeWidth={1} style={{ opacity }} />
    </g>
  );
}

const GROUND: Pt[][] = [
  [
    [40, 300],
    [70, 300],
    [70, 110],
  ],
  [
    [260, -20],
    [150, -20],
  ],
];

function GroundWires({ t }: { t: MotionValue<number> }) {
  return (
    <g transform={topPlane(0)}>
      {GROUND.map((pts, i) => (
        <GroundWire key={i} pts={pts} i={i} t={t} />
      ))}
    </g>
  );
}

function GroundWire({ pts, i, t }: { pts: Pt[]; i: number; t: MotionValue<number> }) {
  const p = useTransform(t, (v) => along(pts, mod(v / 1800 + i * 0.5, 1)));
  const x = useTransform(p, (q) => q[0] - 4);
  const y = useTransform(p, (q) => q[1] - 4);
  const mid = along(pts, 0.5);
  return (
    <g>
      <path d={polyPath(pts)} fill="none" stroke={ACCENT} strokeWidth={2.2} strokeLinejoin="round" {...nss} />
      <circle cx={mid[0]} cy={mid[1]} r={7} fill={PAPER} stroke={ACCENT} strokeWidth={2} {...nss} />
      <motion.rect x={x} y={y} width={8} height={8} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
    </g>
  );
}

// ── Server stack + monitor ───────────────────────────────────────────
function ServerStack({ t }: { t: MotionValue<number> }) {
  return (
    <g>
      <Pad x={-150} y={-110} w={300} d={220} />
      {[0, 1].map((i) => {
        const z = PAD_H + i * 42;
        return (
          <g key={i}>
            <IsoBox x={-110} y={-80} z={z} w={220} d={160} h={38} r={10} />
            <g transform={wallY(80)}>
              {[0, 1, 2, 3].map((k) => (
                <rect key={k} x={-88 + k * 10} y={z + 10} width={4.5} height={18} rx={2.25} fill={SOLID} />
              ))}
            </g>
            <g transform={wallX(110)}>
              {[0, 1, 2].map((k) => (
                <Led key={k} cx={-50 + k * 14} cy={z + 19} t={t} delay={(i * 3 + k) * 260} />
              ))}
            </g>
          </g>
        );
      })}
      <IsoBox x={-120} y={-90} z={PAD_H + 84} w={240} d={180} h={6} r={12} {...ORANGE} />
      <IsoBox x={-120} y={-90} z={PAD_H + 90} w={240} d={180} h={12} r={12} />
    </g>
  );
}

function Monitor({ t }: { t: MotionValue<number> }) {
  const M = MON;
  const top = M.z + M.h - 20;
  const bars = [0, 1, 2, 3, 4, 5, 6];
  const knob = useTransform(t, (v) => ease(Math.abs(Math.sin(v / 1400))) * 9);
  const arc = useTransform(t, (v) => 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(v / 1300)));
  const card = (u: number, v: number, w: number, h: number) => (
    <rect x={u} y={v} width={w} height={h} rx={5} fill="none" stroke={INK} strokeWidth={0.9} opacity={0.55} {...nss} />
  );
  return (
    <Window {...M}>
      {/* Sidebar */}
      <line x1={M.x + 46} x2={M.x + 46} y1={M.z + 3} y2={top} stroke={INK} strokeWidth={0.9} opacity={0.5} {...nss} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={M.x + 10} y={top - 18 - i * 20} width={9} height={9} rx={2} fill={i === 0 ? ACCENT : FILL_STRONG} />
          <rect x={M.x + 23} y={top - 15 - i * 20} width={i === 0 ? 17 : 12} height={3} rx={1.5} fill={i === 0 ? ACCENT : FILL_STRONG} />
        </g>
      ))}
      {/* Bar chart card */}
      {card(M.x + 52, top - 62, 112, 56)}
      {bars.map((i) => (
        <ChartBar key={i} i={i} t={t} u={M.x + 60 + i * 14} v={top - 56} />
      ))}
      {/* Donut card */}
      {card(M.x + 168, top - 62, 106, 56)}
      <circle cx={M.x + 192} cy={top - 34} r={14} fill="none" stroke={FILL} strokeWidth={7} />
      <motion.circle cx={M.x + 192} cy={top - 34} r={14} fill="none" stroke={ACCENT} strokeWidth={7} style={{ pathLength: arc }} transform={`rotate(-90 ${M.x + 192} ${top - 34})`} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={M.x + 218} cy={top - 22 - i * 12} r={2.4} fill={i === 0 ? ACCENT : FILL_STRONG} />
          <rect x={M.x + 224} y={top - 23.5 - i * 12} width={40} height={3} rx={1.5} fill={FILL_STRONG} />
        </g>
      ))}
      {/* Users + toggles */}
      {card(M.x + 52, top - 114, 112, 46)}
      <circle cx={M.x + 70} cy={top - 85} r={5} fill={ACCENT} />
      <path d={`M${M.x + 61} ${top - 102}Q${M.x + 70} ${top - 90} ${M.x + 79} ${top - 102}Z`} fill={ACCENT} />
      <circle cx={M.x + 60} cy={top - 88} r={3.5} fill={FILL_STRONG} />
      <circle cx={M.x + 80} cy={top - 88} r={3.5} fill={FILL_STRONG} />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x={M.x + 92} y={top - 82 - i * 16} width={30} height={3} rx={1.5} fill={FILL_STRONG} />
          <rect x={M.x + 132} y={top - 86 - i * 16} width={24} height={11} rx={5.5} fill={i === 0 ? ACCENT : FILL} stroke={INK} strokeWidth={0.8} {...nss} />
          <motion.circle cx={M.x + 138} cy={top - 80.5 - i * 16} r={4} fill={PAPER} stroke={INK} strokeWidth={0.8} style={{ x: i === 0 ? knob : 0 }} />
        </g>
      ))}
      {/* Calendar card */}
      {card(M.x + 168, top - 114, 106, 46)}
      <rect x={M.x + 176} y={top - 104} width={22} height={22} rx={3} fill="none" stroke={INK} strokeWidth={1.1} {...nss} />
      <rect x={M.x + 176} y={top - 88} width={22} height={6} fill={ACCENT} />
      <rect x={M.x + 206} y={top - 88} width={52} height={3} rx={1.5} fill={FILL_STRONG} />
      <rect x={M.x + 206} y={top - 96} width={36} height={3} rx={1.5} fill={FILL_STRONG} />
      <rect x={M.x + 206} y={top - 109} width={56} height={9} rx={4.5} fill={ACCENT} />
      {/* Module tiles */}
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          {card(M.x + 52 + k * 56, M.z + 8, 50, 26)}
          {[0, 1, 2, 3].map((q) => (
            <rect
              key={q}
              x={M.x + 68 + k * 56 + (q % 2) * 9}
              y={M.z + 13 + Math.floor(q / 2) * 9}
              width={7}
              height={7}
              rx={1.2}
              fill={(q + k) % 3 === 0 ? ACCENT : FILL_STRONG}
            />
          ))}
        </g>
      ))}
    </Window>
  );
}

function ChartBar({ i, t, u, v }: { i: number; t: MotionValue<number>; u: number; v: number }) {
  const base = 8 + i * 5.5;
  const h = useTransform(t, (time) => base + 5 * Math.sin(time / 600 + i * 0.9) + 4);
  return <motion.rect x={u} y={v} width={9} height={h} fill={ACCENT} />;
}

// ── Cloud ────────────────────────────────────────────────────────────
const CLOUD = "M-72 22C-92 22 -94 -6 -72 -10C-74 -36 -40 -46 -26 -28C-18 -56 30 -60 38 -26C62 -34 84 -12 72 6C88 12 82 22 70 22Z";

function Cloud({ t }: { t: MotionValue<number> }) {
  const c: Pt = [30, -330];
  const linkTop = c[1] + 22;
  const linkBot = -272;
  const pulse = useTransform(t, (v) => mod(v / 1200, 1));
  const py = useTransform(pulse, (k) => linkTop + (linkBot - linkTop) * k);
  return (
    <g>
      <line x1={c[0]} x2={c[0]} y1={linkTop} y2={linkBot} stroke={ACCENT} strokeWidth={2.2} />
      <motion.circle cx={c[0]} cy={py} r={3} fill={ACCENT} />
      <circle cx={c[0]} cy={(linkTop + linkBot) / 2} r={5} fill={PAPER} stroke={ACCENT} strokeWidth={2} />
      <Bob t={t} phase={0.4} amp={4}>
        <g transform={`translate(${c[0]} ${c[1]})`}>
          <path d={CLOUD} transform="translate(9 7)" fill="var(--iso-wall-r1)" stroke={INK} strokeWidth={1.2} />
          <path d={CLOUD} fill={PAPER} stroke={INK} strokeWidth={1.2} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={-24} y={-26 + i * 14} width={48} height={11} rx={3} fill={PAPER} stroke={INK} strokeWidth={1.1} />
              <Led cx={16} cy={-20.5 + i * 14} t={t} delay={i * 300} period={1100} />
            </g>
          ))}
        </g>
      </Bob>
    </g>
  );
}

// ── Side windows ─────────────────────────────────────────────────────
function TilesWindow({ t }: { t: MotionValue<number> }) {
  const W = WIN_L1;
  const lit = useTransform(t, (v) => Math.floor(mod(v / 1500, 4)));
  return (
    <Window {...W}>
      {[0, 1, 2, 3].map((q) => (
        <Tile key={q} q={q} lit={lit} u={W.x + 30 + (q % 2) * 26} v={W.z + 38 - Math.floor(q / 2) * 26} />
      ))}
    </Window>
  );
}

function Tile({ q, lit, u, v }: { q: number; lit: MotionValue<number>; u: number; v: number }) {
  const opacity = useTransform(lit, (l) => (l === q ? 1 : 0));
  return (
    <g>
      <rect x={u} y={v} width={22} height={22} rx={4} fill={FILL_STRONG} stroke={INK} strokeWidth={0.9} {...nss} />
      <motion.rect x={u} y={v} width={22} height={22} rx={4} fill={ACCENT} stroke={INK} strokeWidth={0.9} style={{ opacity }} {...nss} />
    </g>
  );
}

function ListWindow({ t }: { t: MotionValue<number> }) {
  const W = WIN_L2;
  return (
    <Window {...W}>
      {[0, 1, 2].map((i) => (
        <ListRow key={i} i={i} t={t} u={W.x + 14} v={W.z + W.h - 34 - i * 17} w={W.w - 30} />
      ))}
    </Window>
  );
}

function ListRow({ i, t, u, v, w }: { i: number; t: MotionValue<number>; u: number; v: number; w: number }) {
  const len = useTransform(t, (time) => (w - 18) * (0.45 + 0.55 * ease(span(mod(time + i * 500, 3200), 0, 900))));
  return (
    <g>
      <circle cx={u} cy={v} r={3.6} fill={ACCENT} />
      <rect x={u + 10} y={v - 2} width={w - 18} height={4} rx={2} fill={FILL} />
      <motion.rect x={u + 10} y={v - 2} width={len} height={4} rx={2} fill={FILL_STRONG} />
    </g>
  );
}

function VideoWindow({ t }: { t: MotionValue<number> }) {
  const W = WIN_R1;
  const prog = useTransform(t, (v) => mod(v / 5000, 1));
  const dot = useTransform(prog, (p) => W.x + 18 + p * (W.w - 36));
  const bar = useTransform(prog, (p) => p * (W.w - 36));
  const pv = W.z + 14;
  return (
    <Window {...W}>
      <rect x={W.x + 14} y={W.z + 22} width={W.w - 28} height={42} rx={4} fill="none" stroke={INK} strokeWidth={1} {...nss} />
      <path d={`M${W.x + W.w / 2 - 6} ${W.z + 53}L${W.x + W.w / 2 - 6} ${W.z + 33}L${W.x + W.w / 2 + 10} ${W.z + 43}Z`} fill={ACCENT} />
      <rect x={W.x + 18} y={pv - 1.5} width={W.w - 36} height={3} rx={1.5} fill={FILL} />
      <motion.rect x={W.x + 18} y={pv - 1.5} width={bar} height={3} rx={1.5} fill={ACCENT} />
      <motion.circle cx={dot} cy={pv} r={4} fill={ACCENT} stroke={INK} strokeWidth={0.8} />
    </Window>
  );
}

function ImageWindow() {
  const W = WIN_R2;
  return (
    <Window {...W}>
      <rect x={W.x + 12} y={W.z + 14} width={40} height={44} rx={4} fill="none" stroke={INK} strokeWidth={1} {...nss} />
      <path d={`M${W.x + 16} ${W.z + 20}L${W.x + 27} ${W.z + 38}L${W.x + 33} ${W.z + 30}L${W.x + 48} ${W.z + 20}Z`} fill={ACCENT} />
      <circle cx={W.x + 40} cy={W.z + 47} r={3.5} fill={FILL_STRONG} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={W.x + 60} y={W.z + 50 - i * 10} width={i === 3 ? 26 : 36} height={4} rx={2} fill={FILL_STRONG} />
      ))}
    </Window>
  );
}

// ── Modules + storage ────────────────────────────────────────────────
function Modules() {
  return (
    <g>
      <Pad x={-80} y={260} w={120} d={110} />
      <Cube x={-45} y={290} z={PAD_H} s={34} />
      <Cube x={-45} y={290} z={PAD_H + 34} s={34} />
      <Cube x={-5} y={300} z={PAD_H} s={34} />
      <Cube x={-35} y={335} z={PAD_H} s={34} accent />
    </g>
  );
}

function Storage({ t }: { t: MotionValue<number> }) {
  const c = { x: 317, y: -15 };
  return (
    <g>
      <Pad x={260} y={-70} w={115} d={110} />
      {[0, 1, 2].map((i) => {
        const z = PAD_H + i * 28;
        const led = project(c.x + 22, c.y + 22, z + 13);
        return (
          <g key={i}>
            <Cylinder x={c.x} y={c.y} z={z} r={32} h={26} />
            <Led cx={led[0]} cy={led[1]} t={t} delay={-i * 380} period={1140} />
          </g>
        );
      })}
    </g>
  );
}

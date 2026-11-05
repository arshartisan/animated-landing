"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { cx } from "@/utils/cx";
import { project, topPlane, wallX, wallY, type Pt } from "./iso";
import { IsoBox } from "./primitives";
import {
  ACCENT,
  Bob,
  FILL,
  FILL_STRONG,
  INK,
  Led,
  ORANGE,
  PAPER,
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
  useValue,
} from "./kit";

const SHIFT = 30;
const FLOOR = 18;
const MON = { x: -200, y: -110, w: 260, h: 160, z: 60, t: 12 };
const PHONE = { x: 110, y: -30, w: 90, h: 175, z: 40, t: 12 };

const placeCard = (sx: number, sy: number, z: number) => {
  const [x, yFace] = toWorld(sx, sy, z);
  return { x, y: yFace - 8, z, w: 90, h: 72, t: 8 };
};
const CARDS = [
  { ...placeCard(-385, -150, 120), kind: "hero" as const, phase: 0 },
  { ...placeCard(-385, -10, 120), kind: "devices" as const, phase: 1.4 },
  { ...placeCard(255, -150, 120), kind: "layers" as const, phase: 0.7 },
  { ...placeCard(255, -10, 120), kind: "hero" as const, phase: 2.1 },
];

const WIRES: Pt[][] = [
  [
    [-70, -60],
    [-70, 20],
    [-5, 20],
    [-5, 60],
  ],
  [
    [150, 5],
    [150, 45],
    [60, 45],
    [60, 85],
  ],
];

export function WebMobileScene({ className }: { className?: string }) {
  const { ref, t } = useSceneClock(1800);
  return (
    <svg
      ref={ref}
      viewBox={SERVICE_VIEWBOX}
      className={cx("scene-machine", className)}
      role="img"
      aria-label="A web dashboard and a mobile app sharing one backend, with live charts on both screens"
    >
      <g transform={`translate(0 ${SHIFT})`}>
        <IsoBox x={-230} y={-200} w={460} d={400} h={FLOOR} r={60} />
        <g transform={wallX(230)}>
          <rect x={-190} y={4} width={240} height={FLOOR - 8} rx={5} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
        </g>
        {CARDS.filter((c) => c.x + c.y < 0).map((c, i) => (
          <FloatCard key={i} c={c} t={t} />
        ))}

        {WIRES.map((w, i) => (
          <FloorWire key={i} pts={w} i={i} t={t} />
        ))}

        {/* Monitor stand */}
        <IsoBox x={-150} y={-150} z={FLOOR} w={150} d={90} h={8} r={12} />
        <IsoBox x={-95} y={-120} z={FLOOR + 8} w={40} d={20} h={MON.z - FLOOR - 8} r={3} />
        <Monitor t={t} />

        {/* Phone dock */}
        <IsoBox x={95} y={-45} z={FLOOR} w={120} d={55} h={10} r={12} />
        <Phone t={t} />

        <Server t={t} />
        <Bars t={t} />
        <Tiles t={t} />

        {CARDS.filter((c) => c.x + c.y >= 0).map((c, i) => (
          <FloatCard key={i} c={c} t={t} />
        ))}
      </g>
    </svg>
  );
}

// ── Floor wiring ─────────────────────────────────────────────────────
function FloorWire({ pts, i, t }: { pts: Pt[]; i: number; t: MotionValue<number> }) {
  const p = useTransform(t, (v) => along(pts, mod(v / 1900 + i * 0.5, 1)));
  const x = useTransform(p, (q) => q[0] - 4);
  const y = useTransform(p, (q) => q[1] - 4);
  const mid = along(pts, 0.5);
  return (
    <g transform={topPlane(FLOOR)}>
      <path d={polyPath(pts)} fill="none" stroke={ACCENT} strokeWidth={2.2} strokeLinejoin="round" {...nss} />
      <circle cx={mid[0]} cy={mid[1]} r={7} fill={PAPER} stroke={INK} strokeWidth={1.2} {...nss} />
      <motion.rect x={x} y={y} width={8} height={8} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
    </g>
  );
}

// ── Desktop dashboard ────────────────────────────────────────────────
const LINE_PTS = [0.15, 0.35, 0.28, 0.55, 0.48, 0.8];

function Monitor({ t }: { t: MotionValue<number> }) {
  const M = MON;
  const top = M.z + M.h;
  const draw = useTransform(t, (v) => ease(span(mod(v, 4800), 200, 2200)) * (1 - span(mod(v, 4800), 4300, 4800)));
  const donut = useTransform(t, (v) => 0.3 + 0.45 * (0.5 + 0.5 * Math.sin(v / 1500)));
  const chart = { u: M.x + 76, v: M.z + 42, w: 108, h: 60 };
  const linePts: Pt[] = LINE_PTS.map((k, i) => [chart.u + 8 + (i * (chart.w - 16)) / (LINE_PTS.length - 1), chart.v + 8 + k * (chart.h - 18)]);
  return (
    <Window {...M} chrome={false}>
      <rect x={M.x + 5} y={M.z + 5} width={58} height={M.h - 10} rx={5} fill={SOLID} />
      <circle cx={M.x + 16} cy={top - 15} r={3} fill={ACCENT} />
      <circle cx={M.x + 25} cy={top - 15} r={3} fill={PAPER} />
      <circle cx={M.x + 34} cy={top - 15} r={3} fill={PAPER} />
      <rect x={M.x + 10} y={top - 50} width={48} height={14} rx={7} fill={ACCENT} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={M.x + 17} cy={top - 68 - i * 18} r={3} fill={PAPER} />
          <rect x={M.x + 24} y={top - 69.5 - i * 18} width={28} height={3} rx={1.5} fill={PAPER} />
        </g>
      ))}
      {/* Search bar + cards */}
      <rect x={M.x + 72} y={top - 20} width={M.w - 84} height={9} rx={4.5} fill={FILL} />
      <rect x={M.x + 72} y={top - 56} width={54} height={28} rx={5} fill="none" stroke={INK} strokeWidth={0.9} opacity={0.6} {...nss} />
      <rect x={M.x + 132} y={top - 56} width={56} height={28} rx={5} fill={ACCENT} />
      <rect x={M.x + 140} y={top - 40} width={30} height={4} rx={2} fill={PAPER} />
      <rect x={M.x + 194} y={top - 56} width={56} height={28} rx={5} fill="none" stroke={INK} strokeWidth={0.9} opacity={0.6} {...nss} />
      <rect x={M.x + 80} y={top - 46} width={10} height={10} rx={2} fill={FILL_STRONG} />
      <rect x={M.x + 202} y={top - 46} width={10} height={10} rx={2} fill={FILL_STRONG} />
      {/* Line chart */}
      <rect x={chart.u} y={chart.v} width={chart.w} height={chart.h} rx={5} fill="none" stroke={INK} strokeWidth={0.9} opacity={0.6} {...nss} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={chart.u + 10 + i * 16} y={chart.v + 6} width={9} height={8 + i * 5} fill={FILL_STRONG} />
      ))}
      <motion.path d={polyPath(linePts)} fill="none" stroke={ACCENT} strokeWidth={2} strokeLinejoin="round" style={{ pathLength: draw }} {...nss} />
      {/* Donut */}
      <rect x={chart.u + chart.w + 6} y={chart.v} width={66} height={chart.h} rx={5} fill="none" stroke={INK} strokeWidth={0.9} opacity={0.6} {...nss} />
      <circle cx={chart.u + chart.w + 39} cy={chart.v + 36} r={13} fill="none" stroke={FILL_STRONG} strokeWidth={6} />
      <motion.circle cx={chart.u + chart.w + 39} cy={chart.v + 36} r={13} fill="none" stroke={ACCENT} strokeWidth={6} style={{ pathLength: donut }} />
      <circle cx={chart.u + chart.w + 18} cy={chart.v + 13} r={2.5} fill={ACCENT} />
      <rect x={chart.u + chart.w + 24} y={chart.v + 11.5} width={34} height={3} rx={1.5} fill={FILL_STRONG} />
      {/* Footer row */}
      <rect x={M.x + 72} y={M.z + 10} width={60} height={26} rx={5} fill="none" stroke={INK} strokeWidth={0.9} opacity={0.6} {...nss} />
      <rect x={M.x + 138} y={M.z + 10} width={112} height={26} rx={5} fill="none" stroke={INK} strokeWidth={0.9} opacity={0.6} {...nss} />
      <rect x={M.x + 212} y={M.z + 17} width={30} height={10} rx={5} fill={ACCENT} />
      <rect x={M.x + 146} y={M.z + 20} width={50} height={4} rx={2} fill={FILL_STRONG} />
    </Window>
  );
}

// ── Phone ────────────────────────────────────────────────────────────
const PHONE_LINE = [0.3, 0.55, 0.42, 0.7, 0.6];

function Phone({ t }: { t: MotionValue<number> }) {
  const P = PHONE;
  const top = P.z + P.h;
  const draw = useTransform(t, (v) => ease(span(mod(v + 900, 4800), 200, 2000)) * (1 - span(mod(v + 900, 4800), 4300, 4800)));
  const tab = useValue(useTransform(t, (v) => Math.floor(mod(v / 1600, 4))));
  const lp: Pt[] = PHONE_LINE.map((k, i) => [P.x + 16 + i * 14, P.z + 56 + k * 24]);
  return (
    <Window {...P} r={12} chrome={false}>
      <rect x={P.x + P.w / 2 - 14} y={top - 12} width={28} height={6} rx={3} fill={SOLID} />
      <rect x={P.x + 12} y={top - 26} width={14} height={3} rx={1.5} fill={FILL_STRONG} />
      <circle cx={P.x + P.w - 16} cy={top - 24} r={4} fill={FILL_STRONG} />
      <rect x={P.x + 10} y={top - 66} width={P.w - 20} height={32} rx={5} fill={ACCENT} />
      <rect x={P.x + 18} y={top - 46} width={36} height={4} rx={2} fill={PAPER} />
      <rect x={P.x + 10} y={top - 94} width={(P.w - 26) / 2} height={22} rx={4} fill={FILL} />
      <rect x={P.x + 16 + (P.w - 26) / 2} y={top - 94} width={(P.w - 26) / 2} height={22} rx={4} fill={FILL} />
      <rect x={P.x + 10} y={P.z + 48} width={P.w - 20} height={40} rx={4} fill="none" stroke={INK} strokeWidth={0.9} opacity={0.6} {...nss} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={P.x + 13 + i * 14} y={P.z + 52} width={7} height={6 + i * 3} fill={FILL_STRONG} />
      ))}
      <motion.path d={polyPath(lp)} fill="none" stroke={ACCENT} strokeWidth={1.8} strokeLinejoin="round" style={{ pathLength: draw }} {...nss} />
      <rect x={P.x + 10} y={P.z + 24} width={P.w - 20} height={18} rx={4} fill="none" stroke={INK} strokeWidth={0.9} opacity={0.6} {...nss} />
      <rect x={P.x + P.w - 34} y={P.z + 29} width={20} height={8} rx={4} fill={ACCENT} />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={P.x + 16 + i * 19} cy={P.z + 12} r={3.4} fill={i === tab ? ACCENT : FILL_STRONG} />
      ))}
    </Window>
  );
}

// ── Backend cube ─────────────────────────────────────────────────────
function Server({ t }: { t: MotionValue<number> }) {
  const S_ = { x: -30, y: 60, w: 90, d: 90, h: 70 };
  const lift = useTransform(t, (v) => -(4 + 4 * Math.sin(v / 700)));
  const top = FLOOR + S_.h;
  return (
    <g>
      <IsoBox x={S_.x - 12} y={S_.y - 12} z={FLOOR} w={S_.w + 24} d={S_.d + 24} h={8} r={10} />
      <IsoBox {...S_} z={FLOOR + 8} r={10} />
      <g transform={wallY(S_.y + S_.d)}>
        {[0, 1].map((i) => (
          <g key={i}>
            <rect x={S_.x + 10} y={FLOOR + 20 + i * 24} width={42} height={18} rx={4} fill={SOLID} />
            <Led cx={S_.x + 19} cy={FLOOR + 29 + i * 24} t={t} delay={i * 400} />
            <circle cx={S_.x + 28} cy={FLOOR + 29 + i * 24} r={2.2} fill={PAPER} />
            <circle cx={S_.x + 36} cy={FLOOR + 29 + i * 24} r={2.2} fill={PAPER} />
          </g>
        ))}
      </g>
      <g transform={wallX(S_.x + S_.w)}>
        {[0, 1, 2, 3].map((k) => (
          <rect key={k} x={S_.y + 22 + k * 10} y={FLOOR + 26} width={4} height={30} rx={2} fill={SOLID} />
        ))}
      </g>
      <motion.g style={{ y: lift }}>
        <IsoBox x={S_.x + 18} y={S_.y + 18} z={top + 18} w={54} d={54} h={6} r={6} />
        <IsoBox x={S_.x + 18} y={S_.y + 18} z={top + 30} w={54} d={54} h={8} r={6} {...ORANGE} />
      </motion.g>
    </g>
  );
}

// ── Bars + tiles ─────────────────────────────────────────────────────
const BARS = [
  { x: -200, base: 26, amp: 8 },
  { x: -168, base: 46, amp: 10 },
  { x: -136, base: 80, amp: 14, accent: true },
];

function Bars({ t }: { t: MotionValue<number> }) {
  return (
    <g>
      {BARS.map((b, i) => (
        <Bar key={b.x} b={b} i={i} t={t} />
      ))}
    </g>
  );
}

function Bar({ b, i, t }: { b: (typeof BARS)[number]; i: number; t: MotionValue<number> }) {
  const h = useValue(useTransform(t, (v) => Math.round(b.base + b.amp * Math.sin(v / 900 + i * 1.3))));
  return <IsoBox x={b.x} y={95} z={FLOOR} w={26} d={26} h={h} r={2} {...(b.accent ? ORANGE : {})} />;
}

function Tiles({ t }: { t: MotionValue<number> }) {
  const pop = useTransform(t, (v) => -ease(Math.abs(Math.sin(v / 1100))) * 10);
  const tiles: [number, number][] = [
    [130, 60],
    [168, 60],
    [130, 98],
    [168, 98],
  ];
  return (
    <g>
      {tiles.map(([x, y], i) =>
        i === 3 ? (
          <motion.g key={i} style={{ y: pop }}>
            <IsoBox x={x} y={y} z={FLOOR} w={34} d={34} h={16} r={3} {...ORANGE} />
          </motion.g>
        ) : (
          <IsoBox key={i} x={x} y={y} z={FLOOR} w={34} d={34} h={16} r={3} />
        ),
      )}
    </g>
  );
}

// ── Floating screens ─────────────────────────────────────────────────
function FloatCard({ c, t }: { c: (typeof CARDS)[number]; t: MotionValue<number> }) {
  const foot = project(c.x + c.w / 2, c.y + c.t, c.z);
  const ground: Pt = [foot[0], foot[1] + 70];
  const flow = useTransform(t, (v) => -mod(v / 40, 8));
  return (
    <g>
      <motion.line x1={foot[0]} x2={ground[0]} y1={foot[1]} y2={ground[1]} stroke={INK} strokeWidth={1.1} strokeDasharray="4 4" style={{ strokeDashoffset: flow }} />
      <Bob t={t} phase={c.phase} amp={4}>
        <Window {...c} chrome={false} r={5}>
          {c.kind === "hero" ? (
            <g>
              <rect x={c.x + 10} y={c.z + 38} width={c.w - 20} height={22} rx={3} fill={ACCENT} />
              <rect x={c.x + 10} y={c.z + 22} width={36} height={10} rx={2} fill={FILL} />
              <rect x={c.x + 50} y={c.z + 22} width={c.w - 60} height={10} rx={2} fill={FILL} />
              <rect x={c.x + 10} y={c.z + 10} width={c.w - 34} height={6} rx={2} fill={FILL} />
            </g>
          ) : c.kind === "devices" ? (
            <g fill="none" stroke={INK} strokeWidth={1.3} {...nss}>
              <rect x={c.x + 14} y={c.z + 24} width={46} height={32} rx={3} {...nss} />
              <rect x={c.x + 19} y={c.z + 29} width={36} height={22} fill={ACCENT} stroke="none" />
              <path d={`M${c.x + 30} ${c.z + 24}v-8M${c.x + 24} ${c.z + 16}h18`} {...nss} />
              <rect x={c.x + 58} y={c.z + 14} width={18} height={30} rx={3} fill={PAPER} {...nss} />
              <rect x={c.x + 61} y={c.z + 20} width={12} height={18} fill={ACCENT} stroke="none" />
            </g>
          ) : (
            <g>
              {[0, 1, 2].map((k) => (
                <path
                  key={k}
                  d={`M${c.x + 22} ${c.z + 30 + k * 10}L${c.x + 45} ${c.z + 22 + k * 10}L${c.x + 68} ${c.z + 30 + k * 10}L${c.x + 45} ${c.z + 38 + k * 10}Z`}
                  fill={k === 2 ? ACCENT : FILL}
                  stroke={INK}
                  strokeWidth={1}
                  {...nss}
                />
              ))}
            </g>
          )}
        </Window>
      </Bob>
    </g>
  );
}

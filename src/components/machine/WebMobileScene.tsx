"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { cx } from "@/utils/cx";
import { project, tiltWallY, topPlane, wallY } from "./iso";
import { IsoBox } from "./primitives";
import {
  ACCENT,
  FILL,
  FILL_STRONG,
  INK,
  ON_ACCENT,
  ORANGE,
  PAPER,
  SERVICE_VIEWBOX,
  SOLID,
  clamp01,
  mod,
  nss,
  useSceneClock,
} from "./kit";
import { Cable } from "./serviceKit";

const pt = (x: number, y: number, z = 0) => project(x, y, z).map((n) => n.toFixed(1)).join(" ");

const GLASS = {
  top: "var(--scene-glass-top)",
  left: ["var(--scene-glass-l1)", "var(--scene-glass-l2)"] as [string, string],
  right: ["var(--scene-glass-r1)", "var(--scene-glass-r2)"] as [string, string],
};

export function WebMobileScene({ className }: { className?: string }) {
  const { ref, t } = useSceneClock(1400);
  return (
    <svg
      ref={ref}
      viewBox={SERVICE_VIEWBOX}
      className={cx("scene-service", className)}
      role="img"
      aria-label="A phone on a stand showing a live trading chart, next to a dock holding a payment card, wired to a toggle, a status light and a USB plug"
    >
      <Tiles t={t} />
      <StandPlate />
      <Dock />
      <Card t={t} />
      <Cable d={`M${pt(-150, 100, 22)}C${pt(-140, 150, 0)} ${pt(-110, 200, 0)} ${pt(-80, 215, 2)}`} t={t} length={220} />
      <Cable d={`M${pt(-10, 100, 22)}C${pt(-5, 150, 0)} ${pt(40, 200, 0)} ${pt(62, 210, 6)}`} t={t} phase={0.4} length={220} />
      <Plug />
      <Phone t={t} />
      <Cable d={`M${pt(240, 98, 18)}C${pt(250, 160, 0)} ${pt(340, 170, 0)} ${pt(350, 90, 0)}S${pt(330, -20, 0)} ${pt(250, -40, 0)}`} t={t} phase={0.2} period={3200} length={520} />
    </svg>
  );
}

// ── Floor tiles: a toggle, a status light, a USB pad, a spare ────────
const TILE_Y = 165;
const TILE = 110;

function Tiles({ t }: { t: MotionValue<number> }) {
  const knob = useTransform(t, (v) => {
    const p = mod(v, 3000) / 3000;
    return clamp01((p - 0.1) / 0.1) * 30 - clamp01((p - 0.6) / 0.1) * 30;
  });
  const led = useTransform(t, (v) => (mod(v, 900) < 500 ? 1 : 0.3));
  const [lx, ly] = project(4, TILE_Y + TILE + 18, 4);
  return (
    <g>
      {[-115, 10, 135].map((x) => (
        <IsoBox key={x} x={x} y={TILE_Y} w={TILE} d={TILE} h={4} r={12} />
      ))}
      {/* toggle */}
      <g transform={topPlane(4)}>
        <rect x={-95} y={TILE_Y + 38} width={70} height={34} rx={17} fill={SOLID} />
        <motion.circle cx={-78} cy={TILE_Y + 55} r={14} fill={PAPER} stroke={INK} strokeWidth={1.1} style={{ x: knob }} {...nss} />
      </g>
      {/* status light */}
      <IsoBox x={-10} y={TILE_Y + TILE + 8} w={28} d={28} h={4} r={14} />
      <motion.ellipse cx={lx} cy={ly} rx={9} ry={5} fill={ACCENT} stroke={INK} strokeWidth={1} style={{ opacity: led }} />
    </g>
  );
}

function Plug() {
  return (
    <g>
      <IsoBox x={55} y={205} z={4} w={26} d={18} h={16} r={4} />
      <IsoBox x={60} y={223} z={8} w={16} d={10} h={7} r={1} top={FILL_STRONG} />
    </g>
  );
}

// ── Dock with $ and % keys ───────────────────────────────────────────
const DOCK = { x: -180, y: 0, w: 260, d: 100, h: 55 };

function Dock() {
  const face = DOCK.y + DOCK.d;
  const keys = [
    { u: -70, s: "$" },
    { u: -20, s: "%" },
  ];
  return (
    <g>
      <IsoBox {...DOCK} r={16} />
      <g transform={topPlane(DOCK.h)}>
        <rect x={-62} y={24} width={150} height={10} rx={5} fill={SOLID} />
      </g>
      <g transform={wallY(face)}>
        {keys.map((k) => (
          <g key={k.s}>
            <rect x={k.u} y={14} width={30} height={28} rx={5} fill={SOLID} />
            <text x={k.u + 15} y={-21} transform="scale(1 -1)" textAnchor="middle" fontSize={18} fontWeight={700} fill={ON_ACCENT}>
              {k.s}
            </text>
          </g>
        ))}
        <circle cx={-150} cy={30} r={7} fill={PAPER} stroke={INK} strokeWidth={1} {...nss} />
        <circle cx={-150} cy={30} r={3} fill={SOLID} />
      </g>
      <IsoBox x={-165} y={30} z={DOCK.h} w={50} d={50} h={36} r={8} />
      <IsoBox x={-105} y={8} z={DOCK.h} w={56} d={52} h={86} r={8} {...GLASS} />
      <IsoBox x={-95} y={18} z={DOCK.h} w={36} d={32} h={60} r={6} {...ORANGE} />
    </g>
  );
}

// ── Payment card rising from the dock slot ───────────────────────────
function Card({ t }: { t: MotionValue<number> }) {
  const lift = useTransform(t, (v) => {
    const p = mod(v, 4200) / 4200;
    return -(clamp01(p / 0.15) - clamp01((p - 0.7) / 0.15)) * 22;
  });
  const c = { u: -60, w: 145, h: 190, y: 29, z: DOCK.h };
  const shape = (fill: string, extra = {}) => <rect x={c.u} y={c.z} width={c.w} height={c.h} rx={12} fill={fill} {...extra} />;
  return (
    <motion.g style={{ y: lift }}>
      {[22, 24, 26].map((dy) => (
        <g key={dy} transform={wallY(dy)}>
          {shape(FILL_STRONG)}
        </g>
      ))}
      <g transform={wallY(c.y)}>
        {shape("var(--scene-glass-l1)", { stroke: INK, strokeWidth: 1.2, vectorEffect: "non-scaling-stroke" })}
        <path d={`M${c.u + 60} ${c.z}L${c.u + c.w - 12} ${c.z}Q${c.u + c.w} ${c.z} ${c.u + c.w} ${c.z + 12}L${c.u + c.w} ${c.z + c.h - 12}Q${c.u + c.w} ${c.z + c.h} ${c.u + c.w - 12} ${c.z + c.h}L${c.u + 105} ${c.z + c.h}Z`} fill={SOLID} />
        <rect x={c.u + 28} y={c.z + 120} width={30} height={24} rx={5} fill={FILL} stroke={INK} strokeWidth={1} {...nss} />
        <path d={`M${c.u + 28} ${c.z + 132}h30M${c.u + 43} ${c.z + 120}v24`} stroke={INK} strokeWidth={0.9} {...nss} />
        <circle cx={c.u + 98} cy={c.z + 40} r={13} fill="none" stroke={PAPER} strokeWidth={1.5} {...nss} />
        <circle cx={c.u + 114} cy={c.z + 40} r={13} fill={PAPER} opacity={0.85} />
      </g>
    </motion.g>
  );
}

// ── Stand ────────────────────────────────────────────────────────────
const PH = { u: 165, w: 150, h: 290, c: 96, tilt: 15, z0: 18 };

function StandPlate() {
  return (
    <g transform={topPlane(0)}>
      <rect x={150} y={-30} width={190} height={150} rx={14} fill={SOLID} />
    </g>
  );
}

function phonePt(u: number, v: number, back = 0): [number, number] {
  const a = (PH.tilt * Math.PI) / 180;
  return project(u, PH.c - back - v * Math.sin(a), PH.z0 + v * Math.cos(a));
}

// ── Phone with a live chart and a Trade button ───────────────────────
const CANDLES = Array.from({ length: 11 }, (_, i) => i);

function Phone({ t }: { t: MotionValue<number> }) {
  const plane = (back = 0) => tiltWallY(PH.c - back, PH.tilt, PH.z0);
  const { u, w, h } = PH;
  const s1 = phonePt(u + 40, 150, 10);
  const s2 = phonePt(u + w - 40, 150, 10);
  const f1 = project(u + 40, PH.c - 120, 0);
  const f2 = project(u + w - 40, PH.c - 120, 0);
  const press = useTransform(t, (v) => (mod(v, 2600) < 180 ? 0.92 : 1));
  const ring = useTransform(t, (v) => clamp01(mod(v, 2600) / 700));
  const ringR = useTransform(ring, (p) => 16 + p * 26);
  const ringO = useTransform(ring, (p) => (1 - p) * 0.8);
  const ringRy = useTransform(ringR, (r) => r * 0.5);
  const dot = useTransform(t, (v) => Math.floor(mod(v, 5000) / 1000));
  const btn = { u: u + 35, v: 60, w: 80, h: 30 };
  return (
    <g>
      {/* stand arm */}
      <path d={`M${s1[0]} ${s1[1]}L${s2[0]} ${s2[1]}L${f2[0]} ${f2[1]}L${f1[0]} ${f1[1]}Z`} fill={SOLID} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      {/* body thickness */}
      {[10, 8, 6, 4, 2].map((b) => (
        <g key={b} transform={plane(b)}>
          <rect x={u} y={0} width={w} height={h} rx={26} fill={FILL_STRONG} stroke={INK} strokeWidth={b === 10 ? 1.1 : 0} {...nss} />
        </g>
      ))}
      <g transform={plane()}>
        <rect x={u} y={0} width={w} height={h} rx={26} fill={SOLID} stroke={INK} strokeWidth={1.2} {...nss} />
        <rect x={u + 7} y={7} width={w - 14} height={h - 14} rx={20} fill={PAPER} />
        <rect x={u + w / 2 - 28} y={h - 22} width={56} height={14} rx={7} fill={SOLID} />
        {/* chart */}
        <rect x={u + 18} y={110} width={w - 36} height={130} rx={18} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
        {CANDLES.map((i) => (
          <Candle key={i} i={i} x={u + 30 + i * 8.6} t={t} />
        ))}
        {/* trade button */}
        <motion.g style={{ scale: press, originX: `${btn.u + btn.w / 2}px`, originY: `${btn.v + btn.h / 2}px` }}>
          <motion.ellipse cx={btn.u + btn.w / 2} cy={btn.v + btn.h / 2} rx={ringR} ry={ringRy} fill="none" stroke={ACCENT} strokeWidth={2} style={{ opacity: ringO }} />
          <rect x={btn.u} y={btn.v} width={btn.w} height={btn.h} rx={15} fill={SOLID} />
          <text x={btn.u + btn.w / 2} y={-(btn.v + 10)} transform="scale(1 -1)" textAnchor="middle" fontSize={13} fontWeight={600} fill={ON_ACCENT}>
            Trade
          </text>
        </motion.g>
        {[0, 1, 2, 3, 4].map((i) => (
          <Dot key={i} i={i} x={u + 31 + i * 22} active={dot} />
        ))}
      </g>
    </g>
  );
}

function Candle({ i, x, t }: { i: number; x: number; t: MotionValue<number> }) {
  // A ticking price series: each candle reads the series at its own offset.
  const at = (k: number) => 40 * Math.sin(k * 0.9) * Math.cos(k * 0.37) + k * 2.4;
  const y = useTransform(t, (v) => {
    const k = Math.floor(v / 600) + i;
    return 170 + (at(k) % 40) * 0.8;
  });
  const h = useTransform(t, (v) => 10 + ((Math.floor(v / 600) + i) * 37) % 26);
  return <motion.rect x={x} y={y} width={4.2} height={h} fill={SOLID} />;
}

function Dot({ i, x, active }: { i: number; x: number; active: MotionValue<number> }) {
  const fill = useTransform(active, (a) => (a === i ? 1 : 0));
  return (
    <g>
      <circle cx={x} cy={30} r={7} fill={FILL} />
      <motion.circle cx={x} cy={30} r={7} fill={ACCENT} style={{ opacity: fill }} />
    </g>
  );
}


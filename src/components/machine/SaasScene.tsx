"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { useId } from "react";
import { cx } from "@/utils/cx";
import { project, topPlane, wallX, wallY } from "./iso";
import { Cylinder, IsoBox } from "./primitives";
import {
  ACCENT,
  ACCENT_SOFT,
  Bob,
  FILL,
  FILL_STRONG,
  INK,
  Led,
  ON_ACCENT,
  ORANGE,
  PAPER,
  SERVICE_VIEWBOX,
  SOLID,
  clamp01,
  mod,
  nss,
  useSceneClock,
  useValue,
} from "./kit";
import { Cable, Extrude, SpinGear } from "./serviceKit";

const pt = (x: number, y: number, z = 0) => project(x, y, z).map((n) => n.toFixed(1)).join(" ");

export function SaasScene({ className }: { className?: string }) {
  const { ref, t } = useSceneClock(1600);
  return (
    <svg
      ref={ref}
      viewBox={SERVICE_VIEWBOX}
      className={cx("scene-service", className)}
      role="img"
      aria-label="A SaaS stack: a monitor streaming code, a secured server tower, stacked servers, live metrics, a billing card, a phone, a cloud upload and a spinning gear"
    >
      <Holes />
      <Monitor t={t} />
      <Cup t={t} />
      <ServerStack t={t} />
      <CheckTile t={t} />
      <Cable d={`M${pt(-200, 85, 4)}C${pt(-150, 120)} ${pt(-140, 160)} ${pt(-80, 195)}`} t={t} length={260} />
      <Cable d={`M${pt(40, 70, 4)}C${pt(70, 30)} ${pt(110, -40)} ${pt(60, -100)}`} t={t} phase={0.5} length={240} />
      <Bars t={t} />
      <Tower t={t} />
      <BillingCard t={t} />
      <Phone t={t} />
      <SpinGear plane={wallY} from={-44} to={-24} cx={247} cy={42} r={52} teeth={9} hole={18} t={t} speed={0.0011} fill={PAPER} stroke={INK} />
      <Upload t={t} />
    </svg>
  );
}

// ── Dark openings in the floor ───────────────────────────────────────
const CLOUD: [number, number, number][] = [
  [150, 196, 34],
  [192, 168, 36],
  [222, 210, 34],
  [180, 226, 30],
];

function Holes() {
  return (
    <g>
      <g transform={topPlane(0)}>
        <rect x={190} y={-90} width={115} height={110} rx={8} fill={SOLID} />
        <rect x={-30} y={-175} width={130} height={90} rx={10} fill={SOLID} />
        {CLOUD.map(([x, y, r]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={r + 2} fill={INK} />
        ))}
        {CLOUD.map(([x, y, r]) => (
          <circle key={`${x}${y}f`} cx={x} cy={y} r={r} fill={SOLID} />
        ))}
      </g>
    </g>
  );
}

// ── Monitor with code scrolling up its face ──────────────────────────
const MON = { x: -110, y: -125, w: 260, d: 14, z: 36, h: 170 };

function Monitor({ t }: { t: MotionValue<number> }) {
  const id = useId().replace(/:/g, "");
  const face = MON.y + MON.d;
  const scroll = useTransform(t, (v) => mod(v / 40, 22));
  const lines = Array.from({ length: 10 }, (_, i) => i);
  return (
    <g>
      <IsoBox x={10} y={-140} z={0} w={36} d={14} h={MON.z} r={3} top={FILL_STRONG} />
      <IsoBox {...MON} r={7} />
      <g transform={wallY(face)}>
        <defs>
          <clipPath id={`mc${id}`} clipPathUnits="userSpaceOnUse">
            <rect x={MON.x + 10} y={MON.z + 10} width={MON.w - 20} height={MON.h - 34} />
          </clipPath>
        </defs>
        <rect x={MON.x + 6} y={MON.z + 6} width={MON.w - 12} height={MON.h - 12} rx={6} fill={PAPER} stroke={INK} strokeWidth={1.1} {...nss} />
        <rect x={MON.x + 6} y={MON.z + MON.h - 24} width={MON.w - 12} height={18} rx={6} fill={FILL} stroke={INK} strokeWidth={1} {...nss} />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={MON.x + 18 + i * 10} cy={MON.z + MON.h - 15} r={3} fill={i === 0 ? ACCENT : PAPER} stroke={INK} strokeWidth={0.9} {...nss} />
        ))}
        <g clipPath={`url(#mc${id})`}>
          <motion.g style={{ y: scroll }}>
            {lines.map((i) => {
              const v = MON.z + MON.h - 40 - i * 22;
              const indent = [0, 16, 32, 16, 0, 16, 32, 32, 16, 0][i];
              const len = [110, 140, 80, 160, 70, 120, 150, 60, 130, 90][i];
              return (
                <g key={i}>
                  <rect x={MON.x + 22 + indent} y={v} width={len} height={6} rx={3} fill={i % 4 === 1 ? ACCENT : FILL_STRONG} />
                  <rect x={MON.x + 22 + indent + len + 8} y={v} width={30} height={6} rx={3} fill={FILL} />
                </g>
              );
            })}
          </motion.g>
        </g>
      </g>
    </g>
  );
}

// ── Coffee cup with steam ────────────────────────────────────────────
function Cup({ t }: { t: MotionValue<number> }) {
  const [x, y] = [250, -150];
  const [sx, sy] = project(x, y, 86);
  return (
    <g>
      <Cylinder x={x} y={y} r={30} h={22} />
      <Cylinder x={x} y={y} z={22} r={31} h={30} side={ACCENT} top={ACCENT} />
      <Cylinder x={x} y={y} z={52} r={30} h={20} />
      <Cylinder x={x} y={y} z={72} r={33} h={8} top={PAPER} />
      <ellipse cx={sx + 8} cy={sy - 2} rx={5} ry={3} fill={SOLID} />
      {[0, 1].map((i) => (
        <Steam key={i} i={i} x={sx - 10 + i * 16} y={sy - 12} t={t} />
      ))}
    </g>
  );
}

function Steam({ i, x, y, t }: { i: number; x: number; y: number; t: MotionValue<number> }) {
  const k = useTransform(t, (v) => mod(v / 2200 + i * 0.5, 1));
  const ty = useTransform(k, (p) => -p * 40);
  const opacity = useTransform(k, (p) => Math.sin(p * Math.PI) * 0.7);
  return (
    <motion.path
      d={`M${x} ${y}c-8 -8 8 -14 0 -22c-8 -8 8 -14 0 -22`}
      fill="none"
      stroke={INK}
      strokeWidth={1.6}
      strokeLinecap="round"
      style={{ y: ty, opacity }}
    />
  );
}

// ── Stacked servers ──────────────────────────────────────────────────
function ServerStack({ t }: { t: MotionValue<number> }) {
  const box = { x: -260, y: 40, w: 66, d: 66, h: 30 };
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const z = i * 34;
        return (
          <g key={i}>
            <IsoBox {...box} z={z} r={6} />
            <g transform={wallY(box.y + box.d)}>
              <rect x={box.x + 8} y={z + 9} width={36} height={12} rx={3} fill={SOLID} />
              <Led cx={box.x + 54} cy={z + 15} t={t} delay={i * 420} />
            </g>
          </g>
        );
      })}
    </g>
  );
}

// ── Floating check tile that re-draws its tick ───────────────────────
function CheckTile({ t }: { t: MotionValue<number> }) {
  const tile = { x: -150, y: -20, w: 16, d: 74, z: 64, h: 74 };
  const draw = useTransform(t, (v) => {
    const p = mod(v, 3200) / 3200;
    return 60 - clamp01((p - 0.1) / 0.25) * 60;
  });
  const face = tile.x + tile.w;
  const u0 = tile.y;
  return (
    <Bob t={t} phase={0.6} amp={5}>
      <IsoBox {...tile} r={6} />
      <g transform={wallX(face)}>
        <rect x={u0 + 9} y={tile.z + 9} width={tile.d - 18} height={tile.h - 18} rx={8} fill={SOLID} stroke={INK} strokeWidth={1} {...nss} />
        <motion.path
          d={`M${u0 + 56} ${tile.z + 40}L${u0 + 42} ${tile.z + 24}L${u0 + 18} ${tile.z + 54}`}
          fill="none"
          stroke={ACCENT}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={60}
          style={{ strokeDashoffset: draw }}
        />
      </g>
    </Bob>
  );
}

// ── Metrics bars with a hovering cube ────────────────────────────────
function Bars({ t }: { t: MotionValue<number> }) {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <Bar key={i} i={i} t={t} />
      ))}
      <Bob t={t} amp={6} speed={600}>
        <IsoBox x={-128} y={30} z={70} w={16} d={16} h={16} r={2} {...ORANGE} />
      </Bob>
    </g>
  );
}

function Bar({ i, t }: { i: number; t: MotionValue<number> }) {
  const h = useValue(useTransform(t, (v) => Math.round(28 + i * 18 + 10 * Math.sin(v / 800 + i * 1.3))));
  return <IsoBox x={-130 + i * 22} y={30} w={18} d={18} h={h} r={2} />;
}

// ── Server tower with a shield on top ────────────────────────────────
const TOWER = { x: -10, y: 30, w: 60, d: 60, h: 150 };

function Tower({ t }: { t: MotionValue<number> }) {
  const face = TOWER.y + TOWER.d;
  const slots = Array.from({ length: 9 }, (_, i) => i);
  return (
    <g>
      <IsoBox {...TOWER} r={6} />
      <g transform={wallY(face)}>
        <rect x={TOWER.x + 8} y={12} width={TOWER.w - 16} height={TOWER.h - 30} rx={4} fill={SOLID} />
        {slots.map((i) => (
          <g key={i}>
            <rect x={TOWER.x + 13} y={18 + i * 12.5} width={TOWER.w - 34} height={7} rx={1.5} fill={PAPER} />
            <Led cx={TOWER.x + TOWER.w - 15} cy={21.5 + i * 12.5} t={t} delay={i * 260} period={1100} />
          </g>
        ))}
      </g>
      <g transform={wallX(TOWER.x + TOWER.w)}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={TOWER.y + 12} y={30 + i * 16} width={TOWER.d - 24} height={5} rx={2.5} fill={FILL_STRONG} />
        ))}
      </g>
      <Bob t={t} phase={2} amp={6}>
        <Shield />
      </Bob>
    </g>
  );
}

const SHIELD = "M-24 0L24 0L24 -30Q24 -56 0 -66Q-24 -56 -24 -30Z";

function Shield() {
  const u = TOWER.x + TOWER.w / 2;
  const v = TOWER.h + 84;
  const shape = (fill: string, extra = {}) => <path d={SHIELD} transform={`translate(${u} ${v})`} fill={fill} {...extra} />;
  return (
    <Extrude
      plane={wallY}
      from={TOWER.y + 18}
      to={TOWER.y + 30}
      shape={(f) => shape(f)}
      face={
        <g>
          {shape(ACCENT, { stroke: INK, strokeWidth: 1.2, vectorEffect: "non-scaling-stroke" })}
          <rect x={u - 9} y={v - 46} width={18} height={15} rx={2} fill={SOLID} />
          <path d={`M${u - 6} ${v - 31}v6a6 6 0 0 0 12 0v-6`} fill="none" stroke={SOLID} strokeWidth={3} />
          <circle cx={u} cy={v - 39} r={2.4} fill={ON_ACCENT} />
        </g>
      }
    />
  );
}

// ── Billing card lying on the floor ──────────────────────────────────
function BillingCard({ t }: { t: MotionValue<number> }) {
  const glow = useTransform(t, (v) => 0.4 + 0.6 * Math.max(0, Math.sin(v / 700)));
  return (
    <g>
      <IsoBox x={-215} y={170} z={0} w={60} d={84} h={5} r={6} top={ACCENT_SOFT} />
      <g transform={topPlane(5)}>
        <rect x={-206} y={180} width={42} height={64} rx={4} fill="none" stroke={ACCENT} strokeWidth={1.5} {...nss} />
        <rect x={-200} y={188} width={14} height={12} rx={2} fill={ACCENT} stroke={INK} strokeWidth={0.9} {...nss} />
        <motion.rect x={-200} y={214} width={30} height={5} rx={2.5} fill={ACCENT} style={{ opacity: glow }} />
        <rect x={-200} y={224} width={20} height={5} rx={2.5} fill={FILL_STRONG} />
      </g>
    </g>
  );
}

// ── Phone lying flat, notifications sliding in ───────────────────────
function Phone({ t }: { t: MotionValue<number> }) {
  const id = useId().replace(/:/g, "");
  const slide = useTransform(t, (v) => {
    const p = mod(v, 3000) / 3000;
    return -40 + clamp01(p / 0.2) * 52 - clamp01((p - 0.85) / 0.15) * 12;
  });
  const P = { x: -80, y: 180, w: 130, d: 62 };
  return (
    <g>
      <IsoBox {...P} h={9} r={10} />
      <g transform={topPlane(9)}>
        <defs>
          <clipPath id={`ph${id}`} clipPathUnits="userSpaceOnUse">
            <rect x={P.x + 8} y={P.y + 6} width={P.w - 16} height={P.d - 12} rx={6} />
          </clipPath>
        </defs>
        <rect x={P.x + 8} y={P.y + 6} width={P.w - 16} height={P.d - 12} rx={6} fill={SOLID} />
        <g clipPath={`url(#ph${id})`}>
          <motion.g style={{ x: slide }}>
            <rect x={P.x + 30} y={P.y + 14} width={50} height={34} rx={4} fill={PAPER} stroke={INK} strokeWidth={0.9} {...nss} />
            <rect x={P.x + 36} y={P.y + 20} width={10} height={10} rx={2} fill={ACCENT} />
            <rect x={P.x + 36} y={P.y + 35} width={34} height={4} rx={2} fill={FILL_STRONG} />
          </motion.g>
        </g>
      </g>
    </g>
  );
}

// ── Upload arrow rising out of the cloud opening ─────────────────────
const ARROW = "M-14 0L14 0L14 40L30 40L0 72L-30 40L-14 40Z";

function Upload({ t }: { t: MotionValue<number> }) {
  const id = useId().replace(/:/g, "");
  const k = useTransform(t, (v) => mod(v / 2600, 1));
  const lift = useTransform(k, (p) => -70 + p * 100);
  const opacity = useTransform(k, (p) => clamp01((1 - p) / 0.2));
  const c = 198;
  const u = 186;
  const arrow = (fill: string, extra = {}) => <path d={ARROW} fill={fill} {...extra} />;
  // Only the part above the floor (v > -6) is visible: it is seen through the opening.
  return (
    <g>
      <defs>
        <clipPath id={`up${id}`} clipPathUnits="userSpaceOnUse">
          <rect x={u - 60} y={-6} width={120} height={200} />
        </clipPath>
      </defs>
      <motion.g style={{ opacity }}>
        <Extrude
          plane={(cc) => wallY(cc)}
          from={c - 16}
          to={c}
          shape={(f) => (
            <g clipPath={`url(#up${id})`}>
              <motion.g style={{ y: lift }}>
                <g transform={`translate(${u} 0)`}>{arrow(f)}</g>
              </motion.g>
            </g>
          )}
          face={
            <g clipPath={`url(#up${id})`}>
              <motion.g style={{ y: lift }}>
                <g transform={`translate(${u} 0)`}>{arrow(ACCENT, { stroke: INK, strokeWidth: 1.2, vectorEffect: "non-scaling-stroke" })}</g>
              </motion.g>
            </g>
          }
        />
      </motion.g>
    </g>
  );
}


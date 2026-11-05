"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { useId } from "react";
import { cx } from "@/utils/cx";
import { project, topPlane, wallX, wallY } from "./iso";
import { IsoBox } from "./primitives";
import { ACCENT, Bob, FILL, FILL_STRONG, INK, ON_ACCENT, PAPER, SERVICE_VIEWBOX, SOLID, mod, nss, useSceneClock } from "./kit";
import { Extrude, SpinGear } from "./serviceKit";

// ── Layout (world units) ─────────────────────────────────────────────
const BASE = { x: -220, y: -200, w: 440, d: 400, h: 12 };
const TOP = BASE.h;
const LETTER_Y = 140; // front face of the letters
const LETTER_DEPTH = 30;

// "A" and "I" drawn in wall coords (u = world x, v = height, v up)
const A_PATH =
  "M0 0L32 0L39 20L81 20L88 0L120 0L76 125L44 125Z" + "M48 45L72 45L60 79Z";
const I_PATH = "M0 0L32 0L32 125L0 125Z";
const LETTERS = [
  { d: A_PATH, u: -40 },
  { d: I_PATH, u: 96 },
];

export function AiScene({ className }: { className?: string }) {
  const { ref, t } = useSceneClock(1800);
  return (
    <svg
      ref={ref}
      viewBox={SERVICE_VIEWBOX}
      className={cx("scene-service", className)}
      role="img"
      aria-label="A robotic hand holding a circuit brain above a raised AI logo, with a bot face, spinning gears and a live voice waveform"
    >
      <IsoBox {...BASE} r={18} />
      <g transform={topPlane(TOP)}>
        <rect x={BASE.x + 14} y={BASE.y + 14} width={BASE.w - 28} height={BASE.d - 28} rx={10} fill="none" stroke={INK} strokeWidth={0.8} opacity={0.35} strokeDasharray="4 5" {...nss} />
      </g>
      <HandShadow t={t} />

      <BotHead t={t} />
      <SpinGear plane={wallY} from={-58} to={-40} cx={120} cy={152} r={46} teeth={10} hole={15} t={t} speed={0.0009} fill={PAPER} stroke={INK} />
      <Hand t={t} />
      <Radar t={t} />
      <Letters t={t} />
      <SpinGear plane={wallY} from={22} to={40} cx={182} cy={74} r={58} teeth={11} hole={20} t={t} speed={-0.00075} fill={FILL_STRONG} stroke={INK} />
      <Waveform t={t} />
    </svg>
  );
}

// ── Raised AI letters with a sheen ───────────────────────────────────
function Letters({ t }: { t: MotionValue<number> }) {
  const id = useId().replace(/:/g, "");
  const sheen = useTransform(t, (v) => -120 + mod(v / 3400, 1) * 520);
  return (
    <g>
      <defs>
        <clipPath id={`ai${id}`} clipPathUnits="userSpaceOnUse">
          {LETTERS.map((l) => (
            <path key={l.u} d={l.d} transform={`translate(${l.u} ${TOP})`} clipRule="evenodd" />
          ))}
        </clipPath>
      </defs>
      {LETTERS.map((l) => (
        <Extrude
          key={l.u}
          plane={wallY}
          from={LETTER_Y - LETTER_DEPTH}
          to={LETTER_Y}
          shape={(fill) => <path d={l.d} transform={`translate(${l.u} ${TOP})`} fill={fill} fillRule="evenodd" />}
          face={
            <path d={l.d} transform={`translate(${l.u} ${TOP})`} fill={ACCENT} fillRule="evenodd" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" {...nss} />
          }
        />
      ))}
      <g transform={wallY(LETTER_Y)} clipPath={`url(#ai${id})`}>
        <motion.rect x={sheen} y={-60} width={26} height={260} fill={ON_ACCENT} opacity={0.35} transform="skewX(-28)" />
      </g>
    </g>
  );
}

// ── Robotic hand cradling a circuit brain ────────────────────────────
const PALM = { x: -50, y: -70, w: 100, d: 90, z: 190, h: 26 };
const FINGERS = [-44, -19, 6, 31];
const SEGMENTS = [
  { y: 22, d: 28, z: 192 },
  { y: 54, d: 26, z: 182 },
  { y: 84, d: 22, z: 170 },
];

function HandShadow({ t }: { t: MotionValue<number> }) {
  const opacity = useTransform(t, (v) => 0.5 + 0.15 * Math.sin(v / 950));
  return (
    <g transform={topPlane(TOP)}>
      <motion.ellipse cx={0} cy={-5} rx={80} ry={70} fill={FILL_STRONG} style={{ opacity }} />
    </g>
  );
}

function Hand({ t }: { t: MotionValue<number> }) {
  const pieces = FINGERS.flatMap((fx, f) => SEGMENTS.map((s, k) => ({ fx, f, k, ...s }))).sort(
    (a, b) => a.fx + a.y - (b.fx + b.y),
  );
  return (
    <Bob t={t} amp={6} speed={950}>
      {/* Wrist + cable */}
      <path
        d={(() => {
          const a = project(30, -125, 205);
          const b = project(60, -210, 260);
          return `M${a[0]} ${a[1]}C${a[0] + 40} ${a[1] - 10} ${b[0] + 30} ${b[1] + 20} ${b[0]} ${b[1]}`;
        })()}
        fill="none"
        stroke={ACCENT}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <IsoBox x={-36} y={-135} z={192} w={72} d={68} h={22} r={12} top={FILL_STRONG} />
      <IsoBox {...PALM} r={16} />
      {pieces.map((p) => (
        <Knuckle key={`${p.f}-${p.k}`} t={t} {...p} />
      ))}
      <Brain t={t} />
    </Bob>
  );
}

function Knuckle({ t, fx, f, k, y, d, z }: { t: MotionValue<number>; fx: number; f: number; k: number; y: number; d: number; z: number }) {
  const dy = useTransform(t, (v) => Math.max(0, Math.sin(v / 260 - f * 0.9)) * (k + 1) * 2.2);
  return (
    <motion.g style={{ y: dy }}>
      <IsoBox x={fx} y={y - 4} z={z + 2} w={20} d={6} h={14} r={3} top={FILL_STRONG} />
      <IsoBox x={fx} y={y} z={z} w={20} d={d} h={18} r={8} />
    </motion.g>
  );
}

const LOBES: [number, number, number][] = [
  [-62, 4, 38],
  [-30, -26, 42],
  [16, -32, 44],
  [60, -10, 40],
  [44, 24, 36],
  [0, 18, 42],
  [-44, 30, 32],
];
const TRACES = [
  "M-70 8L-48 -6L-30 -6",
  "M-40 -36L-22 -20L-2 -20",
  "M8 -52L8 -30L30 -18",
  "M30 -48L52 -30L76 -30",
  "M66 0L44 6L30 -2",
  "M-22 26L-4 14L14 14",
  "M30 32L48 24",
  "M-60 34L-40 22",
];
const NODES: [number, number][] = [
  [-70, 8],
  [-40, -36],
  [8, -52],
  [30, -48],
  [66, 0],
  [-22, 26],
  [30, 32],
  [-60, 34],
  [-30, -6],
  [-2, -20],
  [30, -18],
  [76, -30],
  [14, 14],
];

function Brain({ t }: { t: MotionValue<number> }) {
  const [cx0, cy0] = project(0, -25, PALM.z + PALM.h + 46);
  return (
    <g transform={`translate(${cx0} ${cy0})`}>
      <ellipse cx={0} cy={50} rx={70} ry={20} fill={FILL_STRONG} />
      {LOBES.map(([x, y, r], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r={r} fill={INK} stroke={INK} strokeWidth={2.6} />
      ))}
      {LOBES.map(([x, y, r], i) => (
        <circle key={`f${i}`} cx={x} cy={y} r={r} fill={ACCENT} />
      ))}
      <path d="M2 -62C-8 -30 18 -10 4 20C-2 34 8 46 14 54" fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
      <path d="M-48 -18C-38 -8 -50 6 -36 14M42 -40C34 -28 50 -18 38 -6" fill="none" stroke={INK} strokeWidth={1.1} strokeLinecap="round" opacity={0.55} />
      {TRACES.map((d) => (
        <path key={d} d={d} fill="none" stroke={ON_ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {NODES.map(([x, y], i) => (
        <Synapse key={i} x={x} y={y} i={i} t={t} />
      ))}
    </g>
  );
}

function Synapse({ x, y, i, t }: { x: number; y: number; i: number; t: MotionValue<number> }) {
  const r = useTransform(t, (v) => 3.2 + 2.2 * Math.max(0, Math.sin(v / 380 - i * 0.8)));
  return <motion.circle cx={x} cy={y} r={r} fill={ON_ACCENT} stroke={INK} strokeWidth={1} />;
}

// ── Bot head with a pixel face that blinks ───────────────────────────
const HEAD = { x: -250, y: 100, w: 120, d: 34, z: 140, h: 86 };
const PX = 6;
const EYE_OPEN: [number, number][] = [
  [0, 0],
  [1, 1],
  [2, 0],
];
const EYE_SHUT: [number, number][] = [
  [0, 0],
  [1, 0],
  [2, 0],
];
const SMILE: [number, number][] = [
  [0, 2],
  [1, 1],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
  [6, 1],
  [7, 2],
];

function BotHead({ t }: { t: MotionValue<number> }) {
  const open = useTransform(t, (v) => (mod(v, 3600) < 3420 ? 1 : 0));
  const shut = useTransform(open, (o) => 1 - o);
  const face = HEAD.y + HEAD.d;
  const pixels = (pts: [number, number][], ox: number, oy: number) =>
    pts.map(([a, b]) => <rect key={`${a}${b}`} x={ox + a * PX} y={oy + b * PX} width={PX - 1} height={PX - 1} fill={ACCENT} />);
  return (
    <Bob t={t} phase={1.2} amp={5}>
      <IsoBox x={HEAD.x + 40} y={HEAD.y + 6} z={HEAD.z - 30} w={40} d={20} h={30} r={6} top={FILL_STRONG} />
      <IsoBox {...HEAD} r={17} />
      <g transform={wallY(face)}>
        <rect x={HEAD.x + 12} y={HEAD.z + 12} width={HEAD.w - 24} height={HEAD.h - 24} rx={14} fill={SOLID} stroke={INK} strokeWidth={1.2} {...nss} />
        <motion.g style={{ opacity: open }}>
          {pixels(EYE_OPEN, HEAD.x + 32, HEAD.z + 52)}
          {pixels(EYE_OPEN, HEAD.x + 70, HEAD.z + 52)}
        </motion.g>
        <motion.g style={{ opacity: shut }}>
          {pixels(EYE_SHUT, HEAD.x + 32, HEAD.z + 55)}
          {pixels(EYE_SHUT, HEAD.x + 70, HEAD.z + 55)}
        </motion.g>
        {pixels(SMILE, HEAD.x + 37, HEAD.z + 24)}
      </g>
    </Bob>
  );
}

// ── Radar tile with expanding rings ──────────────────────────────────
const TILE = { x: -205, y: 150, w: 66, d: 12, z: TOP, h: 66 };

function Radar({ t }: { t: MotionValue<number> }) {
  const c = { u: TILE.x + TILE.w / 2, v: TILE.z + TILE.h / 2 };
  const id = useId().replace(/:/g, "");
  return (
    <g>
      <IsoBox {...TILE} r={5} />
      <g transform={wallY(TILE.y + TILE.d)}>
        <defs>
          <clipPath id={`rd${id}`} clipPathUnits="userSpaceOnUse">
            <rect x={TILE.x + 6} y={TILE.z + 6} width={TILE.w - 12} height={TILE.h - 12} rx={4} />
          </clipPath>
        </defs>
        <rect x={TILE.x + 6} y={TILE.z + 6} width={TILE.w - 12} height={TILE.h - 12} rx={4} fill={PAPER} stroke={INK} strokeWidth={1} {...nss} />
        <g clipPath={`url(#rd${id})`}>
          {[0, 1, 2].map((i) => (
            <Ring key={i} i={i} u={c.u} v={c.v} t={t} />
          ))}
        </g>
        <circle cx={c.u} cy={c.v} r={4} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
      </g>
    </g>
  );
}

function Ring({ i, u, v, t }: { i: number; u: number; v: number; t: MotionValue<number> }) {
  const k = useTransform(t, (x) => mod(x / 2400 + i / 3, 1));
  const r = useTransform(k, (p) => 6 + p * 30);
  const opacity = useTransform(k, (p) => 1 - p);
  return <motion.circle cx={u} cy={v} r={r} fill="none" stroke={ACCENT} strokeWidth={4} style={{ opacity }} />;
}

// ── Voice waveform panel along the front-right edge ──────────────────
const WAVE = { x: 186, y: 20, w: 14, d: 168, z: TOP, h: 46 };
const BARS = Array.from({ length: 16 }, (_, i) => i);

function Waveform({ t }: { t: MotionValue<number> }) {
  // wallX coords: u = world y (u grows to screen left), v = height
  const face = WAVE.x + WAVE.w;
  return (
    <g>
      <IsoBox {...WAVE} r={5} />
      <g transform={wallX(face)}>
        <rect x={WAVE.y + 6} y={WAVE.z + 6} width={WAVE.d - 12} height={WAVE.h - 12} rx={6} fill={SOLID} stroke={INK} strokeWidth={1} {...nss} />
        <path d={`M${WAVE.y + WAVE.d - 16} ${WAVE.z + 16}l0 14l-11 -7z`} fill={ACCENT} />
        {BARS.map((i) => (
          <WaveBar key={i} i={i} u={WAVE.y + WAVE.d - 34 - i * 7.6} mid={WAVE.z + WAVE.h / 2} t={t} />
        ))}
      </g>
    </g>
  );
}

function WaveBar({ i, u, mid, t }: { i: number; u: number; mid: number; t: MotionValue<number> }) {
  const h = useTransform(t, (v) => 3 + 12 * Math.abs(Math.sin(v / 210 + i * 0.7) * Math.cos(v / 520 + i * 0.3)));
  const y = useTransform(h, (x) => mid - x / 2);
  return <motion.rect x={u - 1.6} y={y} width={3.2} height={h} rx={1.6} fill={i % 3 === 0 ? FILL : ACCENT} />;
}

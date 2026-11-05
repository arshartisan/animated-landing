"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTime,
  useTransform,
  type MotionValue,
} from "motion/react";
import { project, topPlane, wallX, wallY, type Pt } from "./iso";
import { IsoBox } from "./primitives";
import { cx } from "@/utils/cx";

// ── Timing (ms) ──────────────────────────────────────────────────────
const CYCLE = 6400;
const TAP = { from: 200, to: 1400 }; // phone pays, NFC waves pulse
const PULSE = { from: 500, to: 1500 }; // signal travels phone → terminal
const CONFIRM = { from: 1450, to: 2100 }; // terminal confirm key flashes
const PRINT = { from: 1700, to: 3300 }; // receipt prints
const RING = { from: 2100, to: 3600 }; // watch ring fills
const RESET = { from: 5600, to: 6200 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const local = (t: number) => ((t % CYCLE) + CYCLE) % CYCLE;
const span = (l: number, s: { from: number; to: number }) => clamp01((l - s.from) / (s.to - s.from));
const ease = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
const reset = (l: number) => 1 - ease(span(l, RESET));
const pulse = (p: number) => Math.sin(clamp01(p) * Math.PI);

// ── Palette ──────────────────────────────────────────────────────────
// Every color is a theme token (styles/scene.css), so the scene follows light/dark.
const INK = "var(--scene-ink)";
const C = {
  accent: "var(--scene-accent)",
  accentSoft: "var(--scene-accent-soft)",
  strap: "var(--scene-line)",
  strapDark: "var(--scene-stroke)",
  screen: "var(--scene-solid)",
  paper: "var(--scene-paper)",
  line: "var(--scene-line)",
};

const stroke = {
  stroke: INK,
  strokeWidth: 1.3,
  strokeLinejoin: "round" as const,
  vectorEffect: "non-scaling-stroke" as const,
};

// ── Layout (world units) ─────────────────────────────────────────────
const STAND = { x: -150, y: -170, w: 90, d: 70, h: 100 };
const STRAP = { y: -150, d: 30 };
const WATCH = { x: STAND.x + STAND.w, y: -172, w: 10, d: 74, z: 22, h: 78 };
const TERM = { x: -265, y: 0, w: 155, d: 100, h: 26 };
const PRINTER = { x: -265, y: 6, w: 46, d: 88, h: 18 };
const SLOT_X = PRINTER.x + 24;
const SLOT_Z = TERM.h + PRINTER.h;
const PHONE = { x: 140, y: -100, w: 92, d: 172, h: 9 };
const PORT_X = PHONE.x + PHONE.w / 2;

const pt = (x: number, y: number, z = 0): Pt => project(x, y, z);

export function PaymentScene({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const live = useTime();
  const still = useMotionValue(RING.to + 200);
  const t = reduce ? still : live;

  return (
    <svg
      viewBox="-370 -330 720 560"
      className={cx("scene-payment", className)}
      role="img"
      aria-label="A phone pays a card terminal over a cable, the terminal prints a receipt and a smartwatch logs the approval"
    >
      <Shadows />
      <WatchStand t={t} />
      <Terminal t={t} />
      <Phone t={t} />
      <Cable t={t} />
    </svg>
  );
}

// ── Ground shadows (hard, offset toward the lower-left) ──────────────
function Shadows() {
  const off = 16;
  return (
    <g transform={topPlane(0)} fill="var(--scene-shadow)">
      <rect x={STAND.x + 4} y={STAND.y + off} width={STAND.w} height={STAND.d} rx={8} />
      <rect x={TERM.x + 6} y={TERM.y + off} width={TERM.w} height={TERM.d} rx={14} />
      <rect x={PHONE.x + 2} y={PHONE.y + 10} width={PHONE.w} height={PHONE.d} rx={16} />
    </g>
  );
}

// ── Watch on its stand ───────────────────────────────────────────────
function WatchStand({ t }: { t: MotionValue<number> }) {
  const S = STAND;
  const fill = useTransform(t, (v) => {
    const l = local(v);
    return (0.18 + 0.64 * ease(span(l, RING))) * reset(l) + 0.18 * (1 - reset(l));
  });
  const inner = useTransform(t, (v) => {
    const l = local(v);
    const p = ease(span(l, { from: RING.from + 300, to: RING.to }));
    return (0.3 + 0.5 * p) * reset(l) + 0.3 * (1 - reset(l));
  });
  const glow = useTransform(t, (v) => pulse(span(local(v), { from: RING.to - 300, to: RING.to + 700 })) * 0.9);

  const face = { u0: WATCH.y + 7, u1: WATCH.y + WATCH.d - 7, v0: WATCH.z + 7, v1: WATCH.z + WATCH.h - 7 };
  const cu = (face.u0 + face.u1) / 2;
  const cv = (face.v0 + face.v1) / 2 - 6;

  return (
    <g>
      {/* Strap loop rising behind the stand */}
      <g transform={wallX(S.x + 2)}>
        <rect x={STRAP.y} y={S.h - 10} width={STRAP.d} height={58} rx={14} fill={C.strap} {...stroke} />
      </g>

      <IsoBox {...S} r={8}>
        <rect x={S.x - 2} y={STRAP.y} width={S.w + 4} height={STRAP.d} fill={C.strap} {...stroke} />
      </IsoBox>

      {/* Strap running down the front and out across the floor */}
      <g transform={wallX(S.x + S.w)}>
        <rect x={STRAP.y} y={0} width={STRAP.d} height={S.h} fill={C.strapDark} {...stroke} />
      </g>
      <g transform={topPlane(0)}>
        <rect x={S.x + S.w - 6} y={STRAP.y} width={112} height={STRAP.d} rx={14} fill={C.strap} {...stroke} />
        {[0, 1, 2].map((i) => (
          <ellipse key={i} cx={S.x + S.w + 46 + i * 20} cy={STRAP.y + STRAP.d / 2} rx={3.4} ry={3.4} fill="var(--scene-solid)" />
        ))}
      </g>

      {/* Watch case */}
      <IsoBox {...WATCH} r={4} />
      <g transform={wallX(WATCH.x + WATCH.w)}>
        <rect
          x={face.u0}
          y={face.v0}
          width={face.u1 - face.u0}
          height={face.v1 - face.v0}
          rx={12}
          fill={C.screen}
          {...stroke}
        />
        <g transform={`translate(${cu} ${cv})`}>
          <motion.circle r={24} fill={C.accent} style={{ opacity: glow }} />
          <circle r={19} fill="none" stroke="var(--scene-solid-raised)" strokeWidth={5} />
          <circle r={11} fill="none" stroke="var(--scene-solid-raised)" strokeWidth={5} />
          <motion.circle
            r={19}
            fill="none"
            stroke={C.accent}
            strokeWidth={5}
            strokeLinecap="round"
            transform="rotate(90)"
            style={{ pathLength: fill }}
          />
          <motion.circle
            r={11}
            fill="none"
            stroke={C.accentSoft}
            strokeWidth={5}
            strokeLinecap="round"
            transform="rotate(90)"
            style={{ pathLength: inner }}
          />
        </g>
        {/* Wall-plane text needs a half turn to read upright */}
        <text
          transform={`translate(${cu} ${face.v1 - 9}) scale(-1 -1)`}
          textAnchor="middle"
          fontSize={8.5}
          fontWeight={600}
          fill="var(--scene-on-accent)"
        >
          Approved
        </text>
        {/* Crown */}
        <rect x={WATCH.y - 4} y={cv - 7} width={5} height={14} rx={2} fill="var(--scene-paper)" {...stroke} />
      </g>
    </g>
  );
}

// ── Card terminal + receipt ──────────────────────────────────────────
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "←", "0", "ok"];

function Terminal({ t }: { t: MotionValue<number> }) {
  const T = TERM;
  const nfc = [0, 1, 2].map((i) => i);
  const confirm = useTransform(t, (v) => pulse(span(local(v), CONFIRM)));

  const keyX0 = T.x + 92;
  const keyY0 = T.y + 18;
  const kx = 13;
  const ky = 22;

  return (
    <g>
      <IsoBox {...T} r={14}>
        <rect x={T.x + 52} y={T.y + 8} width={T.w - 60} height={T.d - 16} rx={10} fill="var(--scene-paper-tint)" {...stroke} />
        {/* NFC pad */}
        <circle cx={T.x + 72} cy={T.y + T.d / 2} r={16} fill="var(--scene-paper)" {...stroke} />
        {nfc.map((i) => (
          <NfcArc key={i} i={i} t={t} cx={T.x + 66} cy={T.y + T.d / 2} />
        ))}
        {/* Keypad */}
        {KEYS.map((k, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const x = keyX0 + row * kx;
          const y = keyY0 + col * ky;
          const isOk = k === "ok";
          return (
            <g key={k}>
              <rect x={x} y={y} width={kx - 3} height={ky - 5} rx={2.5} fill={isOk ? C.accent : "var(--scene-paper)"} {...stroke} strokeWidth={1} />
              {isOk ? (
                <motion.rect x={x} y={y} width={kx - 3} height={ky - 5} rx={2.5} fill="var(--scene-on-accent)" style={{ opacity: confirm }} />
              ) : (
                <text
                  x={x + (kx - 3) / 2}
                  y={y + (ky - 5) / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={7.5}
                  fontWeight={600}
                  fill={INK}
                >
                  {k}
                </text>
              )}
            </g>
          );
        })}
      </IsoBox>

      {/* Printer head with paper slot */}
      <IsoBox {...PRINTER} z={T.h} r={10}>
        <rect x={SLOT_X - 1.5} y={PRINTER.y + 10} width={3} height={PRINTER.d - 20} rx={1.5} fill="var(--scene-solid)" />
      </IsoBox>
      <Receipt t={t} />
    </g>
  );
}

function NfcArc({ i, t, cx, cy }: { i: number; t: MotionValue<number>; cx: number; cy: number }) {
  const opacity = useTransform(t, (v) => {
    const l = local(v);
    const p = span(l, { from: TAP.from + i * 180, to: TAP.from + i * 180 + 700 });
    return 0.35 + 0.65 * pulse(p);
  });
  const r = 5 + i * 4.5;
  return (
    <motion.path
      d={`M${cx + r * Math.cos(-0.8)} ${cy + r * Math.sin(-0.8)}A${r} ${r} 0 0 1 ${cx + r * Math.cos(0.8)} ${cy + r * Math.sin(0.8)}`}
      fill="none"
      stroke={INK}
      strokeWidth={1.8}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      style={{ opacity }}
    />
  );
}

function Receipt({ t }: { t: MotionValue<number> }) {
  const LEN = 96;
  const u0 = PRINTER.y + 12;
  const w = PRINTER.d - 24;
  const rise = useTransform(t, (v) => {
    const l = local(v);
    const printed = 10 + (LEN - 10) * ease(span(l, PRINT));
    return printed * reset(l) + 10 * (1 - reset(l));
  });
  const clipId = "pay-receipt-clip";

  return (
    <g transform={wallX(SLOT_X)}>
      <clipPath id={clipId}>
        <rect x={u0 - 4} y={SLOT_Z} width={w + 8} height={160} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <motion.g style={{ y: rise }}>
          <rect x={u0} y={SLOT_Z - LEN} width={w} height={LEN} rx={3} fill={C.paper} {...stroke} />
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={u0 + 8}
              x2={u0 + w - (i % 2 ? 22 : 8)}
              y1={SLOT_Z - 14 - i * 9}
              y2={SLOT_Z - 14 - i * 9}
              stroke={C.line}
              strokeWidth={1.6}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <rect x={u0 + 8} y={SLOT_Z - 70} width={14} height={9} rx={2} fill={C.accent} />
        </motion.g>
      </g>
    </g>
  );
}

// ── Phone ────────────────────────────────────────────────────────────
function Phone({ t }: { t: MotionValue<number> }) {
  const P = PHONE;
  const z = P.h;
  const sx = P.x + 7;
  const sy = P.y + 7;
  const sw = P.w - 14;
  const sd = P.d - 14;

  const card = { x: sx + 7, y: sy + 12, w: sw - 14, d: 66 };
  const tapLift = useTransform(t, (v) => -pulse(span(local(v), TAP)) * 7);
  const cardGlow = useTransform(t, (v) => pulse(span(local(v), TAP)) * 0.55);

  const wave = useTransform(t, (v) => {
    const ph = (v / 420) % (Math.PI * 2);
    const amp = 6 + 4 * pulse(span(local(v), TAP));
    const x0 = sx + 10;
    const x1 = sx + sw - 10;
    const yc = sy + sd - 34;
    let d = "";
    for (let i = 0; i <= 40; i++) {
      const x = x0 + ((x1 - x0) * i) / 40;
      const k = i / 40;
      const y = yc + Math.sin(k * 9 + ph) * amp * Math.sin(k * Math.PI) + Math.sin(k * 23 - ph * 1.7) * 2;
      d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  });

  const blobClip = "pay-card-clip";

  return (
    <g>
      <IsoBox {...P} r={16}>
        <rect x={sx} y={sy} width={sw} height={sd} rx={11} fill={C.screen} {...stroke} />
        {/* Ghost card behind */}
        <rect x={card.x + 3} y={card.y + 24} width={card.w - 6} height={card.d} rx={6} fill="var(--scene-solid-raised)" />
        <motion.path d={wave} fill="none" stroke="var(--scene-on-accent)" strokeWidth={1.3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {/* Speaker dots on the bottom edge */}
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={P.x + 20 + i * 6} cy={P.y + P.d - 3.5} r={1.1} fill="var(--scene-solid)" />
        ))}
      </IsoBox>

      {/* Pay card floats up on tap */}
      <motion.g style={{ y: tapLift }}>
        <g transform={topPlane(z + 1)}>
          <clipPath id={blobClip}>
            <rect x={card.x} y={card.y} width={card.w} height={card.d} rx={6} />
          </clipPath>
          <rect x={card.x} y={card.y} width={card.w} height={card.d} rx={6} fill={C.accent} {...stroke} />
          <motion.rect x={card.x} y={card.y} width={card.w} height={card.d} rx={6} fill="var(--scene-on-accent)" style={{ opacity: cardGlow }} />
          <g clipPath={`url(#${blobClip})`} fill="var(--scene-on-accent)">
            <ellipse cx={card.x + 22} cy={card.y + 46} rx={16} ry={20} />
            <ellipse cx={card.x + 50} cy={card.y + 36} rx={14} ry={22} />
          </g>
          <text x={card.x + 6} y={card.y + 13} fontSize={8.5} fontWeight={700} fill="var(--scene-on-accent)">
            Pay Invoice
          </text>
        </g>
      </motion.g>

      {/* Charging port on the front edge */}
      <g transform={wallY(P.y + P.d)}>
        <rect x={PORT_X - 9} y={1.5} width={18} height={6} rx={2} fill="var(--scene-paper)" {...stroke} />
      </g>
    </g>
  );
}

// ── Coiled cable ─────────────────────────────────────────────────────
const CABLE_START = pt(TERM.x + 30, TERM.y + TERM.d, 12);
const PORT = pt(PORT_X, PHONE.y + PHONE.d, 4);
const COIL_A: Pt = [CABLE_START[0] - 2, CABLE_START[1] + 70];
const COIL_B: Pt = [COIL_A[0] + 118, COIL_A[1] + 22];

const CABLE_IN = `M${CABLE_START[0]} ${CABLE_START[1]}C${CABLE_START[0] - 34} ${CABLE_START[1] + 18} ${COIL_A[0] - 30} ${COIL_A[1] - 10} ${COIL_A[0]} ${COIL_A[1]}`;
const CABLE_OUT = `M${COIL_B[0]} ${COIL_B[1]}C${COIL_B[0] + 50} ${COIL_B[1] + 14} ${COIL_B[0] + 40} ${COIL_B[1] + 92} ${COIL_B[0] + 120} ${COIL_B[1] + 84}S${PORT[0] - 30} ${PORT[1] + 70} ${PORT[0]} ${PORT[1] + 8}L${PORT[0]} ${PORT[1]}`;
const COILS = 7;

function Cable({ t }: { t: MotionValue<number> }) {
  // pulse travels from the phone back to the terminal
  const outOffset = useTransform(t, (v) => {
    const p = span(local(v), { from: PULSE.from, to: PULSE.from + (PULSE.to - PULSE.from) * 0.7 });
    return -(1000 - p * 1080);
  });
  const inOffset = useTransform(t, (v) => {
    const p = span(local(v), { from: PULSE.from + (PULSE.to - PULSE.from) * 0.7, to: PULSE.to });
    return -(1000 - p * 1080);
  });
  const pulseOn = useTransform(t, (v) => (span(local(v), PULSE) > 0 && span(local(v), PULSE) < 1 ? 1 : 0));

  const coils = Array.from({ length: COILS }, (_, i) => {
    const k = (i + 0.5) / COILS;
    return [COIL_A[0] + (COIL_B[0] - COIL_A[0]) * k, COIL_A[1] + (COIL_B[1] - COIL_A[1]) * k] as Pt;
  });

  const base = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  return (
    <g>
      {[CABLE_IN, CABLE_OUT].map((d) => (
        <g key={d}>
          <path d={d} {...base} stroke={INK} strokeWidth={6} />
          <path d={d} {...base} stroke={C.accent} strokeWidth={3.4} />
        </g>
      ))}
      {coils.map(([cx, cy], i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx={8.5} ry={12} {...base} stroke={INK} strokeWidth={6} />
          <ellipse cx={cx} cy={cy} rx={8.5} ry={12} {...base} stroke={C.accent} strokeWidth={3.4} />
        </g>
      ))}
      {/* Signal pulse */}
      <motion.g style={{ opacity: pulseOn }}>
        <motion.path
          d={CABLE_OUT}
          {...base}
          pathLength={1000}
          stroke="var(--scene-on-accent)"
          strokeWidth={2.4}
          strokeDasharray="70 1100"
          style={{ strokeDashoffset: outOffset }}
        />
        <motion.path
          d={CABLE_IN}
          {...base}
          pathLength={1000}
          stroke="var(--scene-on-accent)"
          strokeWidth={2.4}
          strokeDasharray="140 1100"
          style={{ strokeDashoffset: inOffset }}
        />
      </motion.g>
    </g>
  );
}

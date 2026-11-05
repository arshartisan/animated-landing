"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTime,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { ReactNode } from "react";
import { cx } from "@/utils/cx";
import { project, topPlane, wallY, type Pt } from "./iso";
import { Cylinder, IsoBox } from "./primitives";
import { Panel, WallText } from "./UseCaseScenes";

// ── Palette & helpers ────────────────────────────────────────────────
// Every color is a theme token (styles/scene.css), so the scene follows light/dark.
const INK = "var(--scene-ink)";
const ACCENT = "var(--scene-accent)";
const ACCENT_SOFT = "var(--scene-accent-soft)";
const GREY = "var(--scene-fill)";
const GREY_DARK = "var(--scene-fill-strong)";
const LINE = "var(--scene-line)";

const ORANGE_BOX = {
  top: "var(--scene-accent-top)",
  left: ["var(--scene-accent-l1)", "var(--scene-accent-l2)"] as [string, string],
  right: ["var(--scene-accent-r1)", "var(--scene-accent-r2)"] as [string, string],
};

const CYCLE = 6400;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
const span = (l: number, a: number, b: number) => clamp01((l - a) / (b - a));
const loop = (v: number) => ((v % CYCLE) + CYCLE) % CYCLE;
const reset = (l: number) => 1 - span(l, CYCLE - 500, CYCLE);
const nss = { vectorEffect: "non-scaling-stroke" as const };

function Bob({ t, phase = 0, amp = 4, speed = 900, children }: { t: MotionValue<number>; phase?: number; amp?: number; speed?: number; children: ReactNode }) {
  const y = useTransform(t, (v) => Math.sin(v / speed + phase) * amp);
  return <motion.g style={{ y }}>{children}</motion.g>;
}

// ── Scene ────────────────────────────────────────────────────────────
export function WorkspaceScene({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const live = useTime();
  const still = useMotionValue(3400);
  const t = reduce ? still : live;

  return (
    <svg
      viewBox="-360 -320 720 500"
      className={cx("scene-workspace", className)}
      role="img"
      aria-label="A workspace with a monitor showing ratings and charts, a keyboard, a QR code generator and a phone with client profiles"
    >
      <Floor t={t} />
      <PieChart t={t} />

      {/* Chat bubble floating behind the monitor */}
      <Bob t={t} phase={1.2}>
        <ChatCard x={-130} y={-150} z={118} w={86} h={58} t={t} delay={0} />
      </Bob>

      <Monitor />

      <Bob t={t} phase={0}>
        <RatingCard t={t} />
      </Bob>
      <Bob t={t} phase={2.4} amp={3}>
        <ChartCard t={t} />
      </Bob>
      <Bob t={t} phase={3.3}>
        <ChatCard x={-34} y={-58} z={104} w={84} h={52} t={t} delay={600} tail />
      </Bob>

      <Keyboard t={t} />
      <QrGenerator t={t} />
      <PhoneStack t={t} />
    </svg>
  );
}

// ── Floor: guide lines, dashed pads and pulsing markers ──────────────
function Floor({ t }: { t: MotionValue<number> }) {
  const markers: Pt[] = [
    [-300, -170],
    [290, -10],
    [-40, 330],
  ];
  return (
    <g>
      <g transform={topPlane(0)} fill="none" stroke={LINE} strokeWidth={1}>
        <line x1={-520} x2={420} y1={-200} y2={-200} {...nss} />
        <line x1={200} x2={200} y1={-420} y2={420} {...nss} />
        <line x1={-420} x2={460} y1={250} y2={250} {...nss} />
        <rect x={-380} y={-130} width={70} height={70} rx={8} strokeDasharray="4 4" {...nss} />
        <rect x={250} y={60} width={90} height={90} rx={10} strokeDasharray="4 4" {...nss} />
      </g>
      {markers.map(([x, y], i) => (
        <Marker key={i} at={project(x, y)} t={t} delay={i * 700} />
      ))}
    </g>
  );
}

function Marker({ at, t, delay }: { at: Pt; t: MotionValue<number>; delay: number }) {
  const k = useTransform(t, (v) => ((v + delay) % 2200) / 2200);
  const rx = useTransform(k, (p) => 9 + p * 16);
  const ry = useTransform(rx, (r) => r * 0.58);
  const opacity = useTransform(k, (p) => (1 - p) * 0.7);
  return (
    <g>
      <motion.ellipse cx={at[0]} cy={at[1]} rx={rx} ry={ry} fill="none" stroke={ACCENT} strokeWidth={1} style={{ opacity }} />
      <ellipse cx={at[0]} cy={at[1]} rx={9} ry={5.2} fill="var(--scene-paper)" stroke={LINE} strokeWidth={1} />
      <ellipse cx={at[0]} cy={at[1]} rx={4.6} ry={2.7} fill={ACCENT} />
    </g>
  );
}

// ── Pie chart puck with a lifting slice ──────────────────────────────
function PieChart({ t }: { t: MotionValue<number> }) {
  const c = { x: -292, y: -64 };
  const r = 40;
  const lift = useTransform(t, (v) => -6 - Math.sin(v / 700) * 4);
  const wedge = (a0: number, a1: number) =>
    `M${c.x} ${c.y}L${c.x + r * Math.cos(a0)} ${c.y + r * Math.sin(a0)}A${r} ${r} 0 0 1 ${c.x + r * Math.cos(a1)} ${c.y + r * Math.sin(a1)}Z`;
  return (
    <g>
      <Cylinder x={c.x} y={c.y} r={r} h={14} side="var(--iso-wall-l2)" stroke="var(--scene-stroke)" />
      <g transform={topPlane(14)}>
        <path d={wedge(-0.4, 1.5)} fill={GREY} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1={c.x} y1={c.y} x2={c.x + r * Math.cos(1.6 + i * 0.5)} y2={c.y + r * Math.sin(1.6 + i * 0.5)} stroke={GREY_DARK} strokeWidth={1} {...nss} />
        ))}
      </g>
      <motion.g style={{ y: lift }}>
        <g transform={topPlane(14)}>
          <path d={wedge(-1.9, -0.45)} fill={ACCENT} stroke="var(--scene-accent-deep)" strokeWidth={1} {...nss} />
        </g>
      </motion.g>
    </g>
  );
}

// ── Monitor ──────────────────────────────────────────────────────────
const MON = { x: -176, y: -100, w: 186, h: 132, z: 26, t: 10 };

function Monitor() {
  return (
    <g>
      <IsoBox x={-122} y={-128} w={84} d={44} h={5} r={10} />
      <IsoBox x={-88} y={-112} z={5} w={16} d={12} h={MON.z - 5} r={3} />
      <Panel x={MON.x} y={MON.y} z={MON.z} w={MON.w} h={MON.h} t={MON.t}>
        <rect x={MON.x + 7} y={MON.z + 7} width={MON.w - 14} height={MON.h - 14} rx={6} fill="var(--scene-paper)" stroke="var(--scene-stroke)" strokeWidth={1} {...nss} />
        {/* Side buttons */}
        <rect x={MON.x + MON.w - 3} y={MON.z + 30} width={2} height={10} fill={GREY_DARK} />
      </Panel>
    </g>
  );
}

function WindowDots({ x, v }: { x: number; v: number }) {
  return (
    <g fill={INK}>
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x + 7 + i * 5} cy={v} r={1.3} />
      ))}
    </g>
  );
}

function RatingCard({ t }: { t: MotionValue<number> }) {
  const C = { x: -250, y: -46, z: 46, w: 116, h: 100 };
  const bar = useTransform(t, (v) => {
    const l = loop(v);
    return (0.12 + 0.68 * ease(span(l, 400, 1600))) * reset(l) + 0.12 * (1 - reset(l));
  });
  const barW = useTransform(bar, (b) => (C.w - 22) * b);
  const score = useTransform(t, (v) => {
    const l = loop(v);
    return (span(l, 400, 1600) * 4.8 * reset(l)).toFixed(1).replace(".", ",");
  });

  return (
    <Panel x={C.x} y={C.y} z={C.z} w={C.w} h={C.h} t={5}>
      <WindowDots x={C.x} v={C.z + C.h - 8} />
      <g transform={`translate(${C.x + 10} ${C.z + 72}) scale(1 -1)`}>
        <motion.text x={0} y={0} fontSize={20} fontWeight={800} fill={INK} dominantBaseline="central">
          {score}
        </motion.text>
      </g>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} i={i} t={t} u={C.x + 56 + i * 10} v={C.z + 72} />
      ))}
      <rect x={C.x + 11} y={C.z + 52} width={C.w - 22} height={7} rx={1.5} fill={GREY} />
      <motion.rect x={C.x + 11} y={C.z + 52} height={7} rx={1.5} fill={ACCENT} width={barW} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={C.x + 11} y={C.z + 36 - i * 12} width={14} height={7} fill={i === 0 ? INK : "var(--scene-paper)"} stroke={GREY_DARK} strokeWidth={1} {...nss} />
          <rect x={C.x + 30} y={C.z + 36 - i * 12} width={C.w - 41 - i * 10} height={7} fill={GREY} />
        </g>
      ))}
    </Panel>
  );
}

function Star({ i, t, u, v }: { i: number; t: MotionValue<number>; u: number; v: number }) {
  const opacity = useTransform(t, (time) => {
    const l = loop(time);
    return 0.25 + 0.75 * span(l, 900 + i * 140, 1100 + i * 140) * reset(l);
  });
  return (
    <motion.g style={{ opacity }}>
      <WallText u={u} v={v} size={10} fill={ACCENT}>
        ★
      </WallText>
    </motion.g>
  );
}

function ChartCard({ t }: { t: MotionValue<number> }) {
  const C = { x: -66, y: -36, z: 30, w: 82, h: 74 };
  const bars = [0, 1, 2, 3, 4, 5];
  return (
    <Panel x={C.x} y={C.y} z={C.z} w={C.w} h={C.h} t={5}>
      <rect x={C.x + 8} y={C.z + 8} width={C.w - 16} height={C.h - 16} rx={4} fill="none" stroke={GREY_DARK} strokeWidth={1} {...nss} />
      {bars.map((i) => (
        <ChartBar key={i} i={i} t={t} u={C.x + 17 + i * 10} base={C.z + 37} />
      ))}
    </Panel>
  );
}

function ChartBar({ i, t, u, base }: { i: number; t: MotionValue<number>; u: number; base: number }) {
  const h = useTransform(t, (v) => 8 + 9 * (1 + Math.sin(v / 520 + i * 1.3)));
  const y = useTransform(h, (hh) => base - hh / 2 + (i % 2 ? 4 : -4));
  return <motion.rect x={u} width={4} rx={1} y={y} height={h} fill={i % 3 === 1 ? INK : ACCENT} />;
}

function ChatCard({ x, y, z, w, h, t, delay, tail }: { x: number; y: number; z: number; w: number; h: number; t: MotionValue<number>; delay: number; tail?: boolean }) {
  return (
    <g>
      <Panel x={x} y={y} z={z} w={w} h={h} t={5}>
        <rect x={x + w / 2 - 24} y={z + h - 20} width={48} height={7} rx={3.5} fill={GREY} />
        <TypingDots x={x + w / 2} v={z + 18} t={t} delay={delay} />
        {tail ? <path d={`M${x + 10} ${z}L${x + 6} ${z - 12}L${x + 22} ${z}Z`} fill="var(--scene-paper)" stroke="var(--scene-stroke)" strokeWidth={1} {...nss} /> : null}
      </Panel>
    </g>
  );
}

function TypingDots({ x, v, t, delay }: { x: number; v: number; t: MotionValue<number>; delay: number }) {
  return (
    <g>
      <rect x={x - 18} y={v - 6} width={36} height={12} rx={6} fill="none" stroke={GREY_DARK} strokeWidth={1} strokeDasharray="3 2" {...nss} />
      {[0, 1, 2].map((i) => (
        <TypingDot key={i} cx={x - 8 + i * 8} cy={v} t={t} delay={delay + i * 160} />
      ))}
    </g>
  );
}

function TypingDot({ cx, cy, t, delay }: { cx: number; cy: number; t: MotionValue<number>; delay: number }) {
  const opacity = useTransform(t, (v) => 0.3 + 0.7 * Math.max(0, Math.sin(((v + delay) / 1000) * Math.PI * 2)));
  return <motion.circle cx={cx} cy={cy} r={2} fill={ACCENT} style={{ opacity }} />;
}

// ── Keyboard with keys lighting up as someone types ──────────────────
const KB = { x: -268, y: 22, w: 206, d: 84 };
const KEY = { cols: 14, rows: 5, size: 12, gap: 2.4 };

function Keyboard({ t }: { t: MotionValue<number> }) {
  const ox = KB.x + 8;
  const oy = KB.y + 9;
  const pitch = KEY.size + KEY.gap;
  const slot = useTransform(t, (v) => Math.floor(v / 180));
  const kx = useTransform(slot, (s) => ox + ((s * 7 + (s >> 2)) % KEY.cols) * pitch);
  const ky = useTransform(slot, (s) => oy + ((s * 3 + (s >> 3)) % (KEY.rows - 1)) * pitch);

  return (
    <IsoBox x={KB.x} y={KB.y} w={KB.w} d={KB.d} h={6} r={8}>
      {Array.from({ length: KEY.rows }, (_, r) =>
        Array.from({ length: KEY.cols }, (_, c) => {
          if (r === KEY.rows - 1 && c > 3 && c < 10) return null;
          return <rect key={`${r}-${c}`} x={ox + c * pitch} y={oy + r * pitch} width={KEY.size} height={KEY.size} rx={2} fill="var(--scene-paper)" stroke={GREY_DARK} strokeWidth={1} {...nss} />;
        }),
      )}
      {/* Space bar */}
      <rect x={ox + 4 * pitch} y={oy + (KEY.rows - 1) * pitch} width={6 * pitch - KEY.gap} height={KEY.size} rx={2} fill="var(--scene-paper)" stroke={GREY_DARK} strokeWidth={1} {...nss} />
      <motion.rect x={kx} y={ky} width={KEY.size} height={KEY.size} rx={2} fill={ACCENT_SOFT} stroke={ACCENT} strokeWidth={1} {...nss} />
    </IsoBox>
  );
}

// ── QR code generator ────────────────────────────────────────────────
const QR = { x: 112, y: -168, w: 84, d: 58, h: 112 };
const QR_BITS = [
  "1110111",
  "1010101",
  "1110111",
  "0001000",
  "1101011",
  "1011101",
  "1101011",
];
const CUBES: { x: number; y: number; z: number }[] = [
  { x: 130, y: -150, z: 0 },
  { x: 160, y: -150, z: 0 },
  { x: 130, y: -150, z: 18 },
  { x: 160, y: -150, z: 18 },
  { x: 145, y: -150, z: 36 },
  { x: 130, y: -150, z: 54 },
  { x: 160, y: -150, z: 54 },
  { x: 145, y: -150, z: 72 },
];

function QrGenerator({ t }: { t: MotionValue<number> }) {
  const glow = useTransform(t, (v) => {
    const l = loop(v);
    return Math.sin(span(l, 2600, 3600) * Math.PI) * 0.85;
  });
  const cell = 6;
  const qu = QR.x + 10;
  const qv = QR.h - 14;

  return (
    <g>
      {CUBES.map((c, i) => (
        <QrCube key={i} c={c} i={i} t={t} />
      ))}

      {/* Glass housing */}
      <IsoBox
        x={QR.x}
        y={QR.y}
        w={QR.w}
        d={QR.d}
        h={QR.h}
        r={6}
        top="var(--scene-glass-top)"
        left={["var(--scene-glass-l1)", "var(--scene-glass-l2)"]}
        right={["var(--scene-glass-r1)", "var(--scene-glass-r2)"]}
      />

      <g transform={wallY(QR.y + QR.d)}>
        {QR_BITS.map((row, r) =>
          row.split("").map((b, c) =>
            b === "1" ? <rect key={`${r}-${c}`} x={qu + c * cell} y={qv - r * cell} width={cell - 0.6} height={cell - 0.6} fill={INK} /> : null,
          ),
        )}
        <rect x={QR.x + 8} y={10} width={QR.w - 16} height={26} rx={5} fill="var(--scene-paper)" stroke="var(--scene-stroke)" strokeWidth={1} {...nss} />
        <motion.rect x={QR.x + 8} y={10} width={QR.w - 16} height={26} rx={5} fill={ACCENT_SOFT} style={{ opacity: glow }} />
        <WallText u={QR.x + QR.w / 2} v={23} size={9} fill={ACCENT} weight={800}>
          GENERATE
        </WallText>
      </g>
    </g>
  );
}

function QrCube({ c, i, t }: { c: (typeof CUBES)[number]; i: number; t: MotionValue<number> }) {
  const p = useTransform(t, (v) => {
    const l = loop(v);
    return ease(span(l, 600 + i * 220, 950 + i * 220)) * reset(l);
  });
  const y = useTransform(p, (k) => -(1 - k) * 40);
  return (
    <motion.g style={{ y, opacity: p }}>
      <IsoBox x={c.x} y={c.y} z={c.z} w={16} d={16} h={16} r={2} top="var(--iso-top)" right={ORANGE_BOX.right} />
    </motion.g>
  );
}

// ── Phone with floating client cards ─────────────────────────────────
const PHONE = { x: 40, y: -22, w: 94, d: 184 };

function PhoneStack({ t }: { t: MotionValue<number> }) {
  const beam = useTransform(t, (v) => 0.35 + 0.25 * Math.sin(v / 500));
  const P = PHONE;
  return (
    <g>
      <IsoBox x={P.x} y={P.y} w={P.w} d={P.d} h={9} r={16}>
        <rect x={P.x + 6} y={P.y + 6} width={P.w - 12} height={P.d - 12} rx={11} fill="var(--scene-paper-sunken)" stroke="var(--scene-stroke)" strokeWidth={1} {...nss} />
        <rect x={P.x + 14} y={P.y + 70} width={P.w - 28} height={46} rx={6} fill={GREY} />
      </IsoBox>
      <g transform={wallY(P.y + P.d)}>
        <rect x={P.x + P.w / 2 - 6} y={3} width={12} height={3.5} rx={1.75} fill={INK} />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={P.x + 14 + i * 5} cy={4.8} r={1} fill={INK} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={P.x + P.w - 30 + i * 5} cy={4.8} r={1} fill={INK} />
        ))}
      </g>

      {/* Light beam linking the phone to the profile card */}
      <motion.g style={{ opacity: beam }}>
        <IsoBox
          x={P.x + 26}
          y={P.y + 14}
          z={9}
          w={44}
          d={40}
          h={52}
          r={4}
          stroke="var(--scene-beam-stroke)"
          top="var(--scene-beam-top)"
          left={["var(--scene-beam-l1)", "var(--scene-beam-l2)"]}
          right={["var(--scene-beam-r1)", "var(--scene-beam-l2)"]}
        />
      </motion.g>

      <Bob t={t} phase={0.6} amp={3}>
        <ContactsCard />
      </Bob>
      <Bob t={t} phase={1.9}>
        <ProfileCard t={t} />
      </Bob>
    </g>
  );
}

function Avatar({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="var(--scene-paper)" stroke={GREY_DARK} strokeWidth={1} {...nss} />
      <circle cx={cx} cy={cy - r * 0.25} r={r * 0.32} fill={fill} />
      <path d={`M${cx - r * 0.55} ${cy + r * 0.6}Q${cx} ${cy - r * 0.1} ${cx + r * 0.55} ${cy + r * 0.6}Z`} fill={fill} />
    </g>
  );
}

function ContactsCard() {
  const C = { x: 30, y: 96, z: 26, w: 76, d: 70 };
  return (
    <IsoBox x={C.x} y={C.y} z={C.z} w={C.w} d={C.d} h={6} r={8}>
      {[0, 1].map((i) => (
        <g key={i}>
          <Avatar cx={C.x + 16 + i * 26} cy={C.y + 16} r={9} fill={i === 0 ? ACCENT : GREY_DARK} />
          <rect x={C.x + 10} y={C.y + 34 + i * 12} width={C.w - 24 - i * 14} height={5} rx={2.5} fill={GREY} />
        </g>
      ))}
    </IsoBox>
  );
}

const SOCIAL = ["f", "in", "▶"];

function ProfileCard({ t }: { t: MotionValue<number> }) {
  const C = { x: 58, y: -12, z: 62, w: 84, d: 70 };
  return (
    <g>
      <IsoBox x={C.x} y={C.y} z={C.z} w={C.w} d={C.d} h={6} r={8}>
        <Avatar cx={C.x + C.w - 24} cy={C.y + C.d - 26} r={15} fill={ACCENT} />
        <rect x={C.x + 10} y={C.y + 16} width={34} height={5} rx={2.5} fill={GREY} />
        <rect x={C.x + 10} y={C.y + 28} width={24} height={5} rx={2.5} fill={GREY} />
      </IsoBox>
      {SOCIAL.map((s, i) => (
        <SocialBadge key={s} label={s} i={i} t={t} at={project(C.x + 12 + i * 4, C.y + 6 - i * 20 + 40, C.z + 22)} />
      ))}
    </g>
  );
}

function SocialBadge({ label, i, t, at }: { label: string; i: number; t: MotionValue<number>; at: Pt }) {
  const y = useTransform(t, (v) => {
    const l = loop(v);
    const pop = Math.sin(span(l, 3200 + i * 180, 3600 + i * 180) * Math.PI) * 8;
    return -pop + Math.sin(v / 600 + i) * 2;
  });
  return (
    <motion.g style={{ y }}>
      <ellipse cx={at[0]} cy={at[1] + 3} rx={13} ry={7.5} fill={GREY_DARK} />
      <ellipse cx={at[0]} cy={at[1]} rx={13} ry={7.5} fill="var(--scene-paper)" stroke="var(--scene-stroke)" strokeWidth={1} />
      <ellipse cx={at[0]} cy={at[1]} rx={8} ry={4.6} fill={ACCENT} />
      <text x={at[0]} y={at[1] + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={label.length > 1 ? 4.5 : 5.5} fontWeight={800} fill="var(--scene-on-accent)">
        {label}
      </text>
    </motion.g>
  );
}

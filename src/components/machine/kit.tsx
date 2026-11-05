"use client";

/**
 * Shared building blocks for the isometric service scenes: palette tokens,
 * timing helpers, pads, window panels and an IK robot arm. Every color is a
 * theme token from styles/scene.css, so scenes follow light/dark.
 */
import {
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTime,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import { S, project, wallX, wallY, type Pt } from "./iso";
import { Cylinder, INK, IsoBox } from "./primitives";

export { INK };

// ── Palette ──────────────────────────────────────────────────────────
export const ACCENT = "var(--scene-accent)";
export const ACCENT_SOFT = "var(--scene-accent-soft)";
export const PAPER = "var(--iso-top)";
export const RECESS = "var(--scene-paper-recess)";
export const SUNKEN = "var(--scene-paper-sunken)";
export const ON_ACCENT = "var(--scene-on-accent)";
export const FILL = "var(--scene-fill)";
export const FILL_STRONG = "var(--scene-fill-strong)";
export const SOLID = "var(--scene-solid)";
export const ORANGE = {
  top: "var(--scene-accent-top)",
  left: ["var(--scene-accent-l1)", "var(--scene-accent-l2)"] as [string, string],
  right: ["var(--scene-accent-r1)", "var(--scene-accent-r2)"] as [string, string],
};
export const SHADED = ["var(--iso-wall-r1)", "var(--iso-wall-r2)"] as [string, string];
export const nss = { vectorEffect: "non-scaling-stroke" as const };

/** Shared viewBox so every service card has the same proportions. */
export const SERVICE_VIEWBOX = "-400 -365 810 680";

// ── Math ─────────────────────────────────────────────────────────────
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const ease = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
export const mod = (v: number, m: number) => ((v % m) + m) % m;
export const span = (l: number, a: number, b: number) => clamp01((l - a) / (b - a));
export const bump = (p: number) => Math.sin(clamp01(p) * Math.PI);
export const lerp = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** Point at fraction k along a polyline. */
export function along(pts: Pt[], k: number): Pt {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = clamp01(k) * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) return lerp(pts[i], pts[i + 1], lens[i] ? d / lens[i] : 0);
    d -= lens[i];
  }
  return pts[pts.length - 1];
}

/** World (x, y) whose projection at height z lands on screen point (sx, sy). */
export const toWorld = (sx: number, sy: number, z = 0): Pt => {
  const a = sx / S;
  const b = 2 * (sy + z);
  return [(a + b) / 2, (b - a) / 2];
};

export const polyPath = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join("");

// ── Hooks ────────────────────────────────────────────────────────────
/** Scene clock: runs only while the SVG is on screen; frozen at `still` for reduced motion. */
export function useSceneClock(still: number) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { margin: "100px" });
  const reduce = useReducedMotion();
  const live = useTime();
  const frozen = useMotionValue(still);
  return { ref, t: reduce || !inView ? frozen : live };
}

/**
 * Re-render with a motion value, for geometry that can't be an attribute
 * (e.g. a box height). Only use with primitive values so equal frames bail out.
 */
export function useValue<T extends number | string | boolean>(mv: MotionValue<T>) {
  const [v, setV] = useState(() => mv.get());
  useMotionValueEvent(mv, "change", setV);
  return v;
}

// ── Pieces ───────────────────────────────────────────────────────────
export const PAD_H = 14;

/** Rounded floor pad with accent trim on both visible sides. */
export function Pad({ x, y, w, d, h = PAD_H, r = 14 }: { x: number; y: number; w: number; d: number; h?: number; r?: number }) {
  return (
    <g>
      <IsoBox x={x} y={y} w={w} d={d} h={h} r={r} />
      <g transform={wallY(y + d)}>
        <rect x={x + w * 0.52} y={2.5} width={w * 0.3} height={h - 5} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
      </g>
      <g transform={wallX(x + w)}>
        <rect x={y + d * 0.18} y={2.5} width={d * 0.28} height={h - 5} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
      </g>
    </g>
  );
}

export function Bob({ t, phase = 0, amp = 5, speed = 950, children }: { t: MotionValue<number>; phase?: number; amp?: number; speed?: number; children: ReactNode }) {
  const y = useTransform(t, (v) => Math.sin(v / speed + phase) * amp);
  return <motion.g style={{ y }}>{children}</motion.g>;
}

export function Led({ cx, cy, t, delay = 0, period = 1400, rect }: { cx: number; cy: number; t: MotionValue<number>; delay?: number; period?: number; rect?: boolean }) {
  const opacity = useTransform(t, (v) => (mod(v + delay, period) < period * 0.55 ? 1 : 0.25));
  return rect ? (
    <motion.rect x={cx - 4} y={cy - 4} width={8} height={8} rx={1.5} fill={ACCENT} stroke={INK} strokeWidth={0.9} style={{ opacity }} {...nss} />
  ) : (
    <motion.circle cx={cx} cy={cy} r={2.6} fill={ACCENT} style={{ opacity }} />
  );
}

/** Small floating cube. */
export function Cube({ x, y, z, s = 26, accent }: { x: number; y: number; z: number; s?: number; accent?: boolean }) {
  return <IsoBox x={x - s / 2} y={y - s / 2} z={z} w={s} d={s} h={s} r={2} {...(accent ? ORANGE : {})} />;
}

/**
 * Upright window slab facing +y (screen lower-left) with browser chrome.
 * Children draw on its face in wall coords: u = world x, v = world z (v up).
 */
export function Window({
  x,
  y,
  z = 0,
  w,
  h,
  t = 10,
  r = 6,
  chrome = true,
  face = PAPER,
  children,
}: {
  x: number;
  y: number;
  z?: number;
  w: number;
  h: number;
  t?: number;
  r?: number;
  chrome?: boolean;
  face?: string;
  children?: ReactNode;
}) {
  const top = z + h;
  return (
    <g>
      <IsoBox x={x} y={y} z={z} w={w} d={t} h={h} r={Math.min(r, t / 2)} />
      <g transform={wallY(y + t)}>
        <rect x={x + 3} y={z + 3} width={w - 6} height={h - 6} rx={r} fill={face} stroke={INK} strokeWidth={1.1} {...nss} />
        {chrome ? (
          <g>
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={x + 12 + i * 9} cy={top - 11} r={2.8} fill={i === 0 ? ACCENT : "none"} stroke={INK} strokeWidth={1} {...nss} />
            ))}
            <line x1={x + 3} x2={x + w - 3} y1={top - 20} y2={top - 20} stroke={INK} strokeWidth={0.9} opacity={0.5} {...nss} />
          </g>
        ) : null}
        {children}
      </g>
    </g>
  );
}

/** Wall-plane rectangle helper (wall coords: rect grows upward from v). */
export function WallRect({ u, v, w, h, fill = FILL, stroke, rx = 2 }: { u: number; v: number; w: number; h: number; fill?: string; stroke?: string; rx?: number }) {
  return <rect x={u} y={v} width={w} height={h} rx={rx} fill={fill} stroke={stroke} strokeWidth={stroke ? 1 : undefined} {...nss} />;
}

// ── Robot arm ────────────────────────────────────────────────────────
export type ArmPose = { wrist: Pt; grip: number };

function elbowFor(s: Pt, w: Pt, l1: number, l2: number, up: boolean): Pt {
  const dx = w[0] - s[0];
  const dy = w[1] - s[1];
  const d = Math.max(1, Math.min(Math.hypot(dx, dy), l1 + l2 - 1));
  const a = Math.atan2(dy, dx);
  const th = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const e1: Pt = [s[0] + l1 * Math.cos(a + th), s[1] + l1 * Math.sin(a + th)];
  const e2: Pt = [s[0] + l1 * Math.cos(a - th), s[1] + l1 * Math.sin(a - th)];
  return (e1[1] < e2[1]) === up ? e1 : e2;
}

const seg = (p: Pt, q: Pt) => `M${p[0].toFixed(2)} ${p[1].toFixed(2)}L${q[0].toFixed(2)} ${q[1].toFixed(2)}`;

function claws(elbow: Pt, wrist: Pt, grip: number) {
  const base = Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]);
  const open = ((26 - grip * 18) * Math.PI) / 180;
  return [1, -1]
    .map((side) => {
      const a = base + side * open;
      const pt = (dist: number, bend: number): Pt => [
        wrist[0] + Math.cos(a) * dist - Math.sin(a) * bend * side,
        wrist[1] + Math.sin(a) * dist + Math.cos(a) * bend * side,
      ];
      return polyPath([wrist, pt(13, 0), pt(24, -4)]);
    })
    .join("");
}

/** Robot on a pedestal at world (x, y). The wrist follows `pose`; nothing re-renders React. */
export function RobotArm({
  x,
  y,
  z = 0,
  pose,
  l1 = 130,
  l2 = 122,
  height = 50,
  elbowUp = true,
  claw = true,
}: {
  x: number;
  y: number;
  /** Height of the surface the robot stands on. */
  z?: number;
  pose: MotionValue<ArmPose>;
  l1?: number;
  l2?: number;
  height?: number;
  elbowUp?: boolean;
  claw?: boolean;
}) {
  const shoulder = project(x, y, z + height);
  const elbow = useTransform(pose, (p) => elbowFor(shoulder, p.wrist, l1, l2, elbowUp));
  const upper = useTransform(elbow, (e) => seg(shoulder, e));
  const fore = useTransform(() => seg(elbow.get(), pose.get().wrist));
  const clawD = useTransform(() => claws(elbow.get(), pose.get().wrist, pose.get().grip));
  const ex = useTransform(elbow, (e) => e[0]);
  const ey = useTransform(elbow, (e) => e[1]);
  const wx = useTransform(pose, (p) => p.wrist[0]);
  const wy = useTransform(pose, (p) => p.wrist[1]);

  const limb = (d: MotionValue<string>, w: number) => (
    <g fill="none" strokeLinecap="round">
      <motion.path d={d} stroke={INK} strokeWidth={w + 2.6} />
      <motion.path d={d} stroke={PAPER} strokeWidth={w} />
    </g>
  );
  const joint = (cx: number | MotionValue<number>, cy: number | MotionValue<number>, r: number) => (
    <g>
      <motion.circle cx={cx} cy={cy} r={r} fill={PAPER} stroke={INK} strokeWidth={1.3} />
      <motion.circle cx={cx} cy={cy} r={r * 0.45} fill={ACCENT} stroke={INK} strokeWidth={1} />
    </g>
  );

  return (
    <g>
      <IsoBox x={x - 30} y={y - 30} z={z} w={60} d={60} h={6} r={8} {...ORANGE} />
      <IsoBox x={x - 30} y={y - 30} z={z + 6} w={60} d={60} h={8} r={8} />
      {[
        [-23, -23],
        [23, -23],
        [-23, 23],
        [23, 23],
      ].map(([bx, by]) => {
        const [px, py] = project(x + bx, y + by, z + 14);
        return <ellipse key={`${bx}${by}`} cx={px} cy={py} rx={2.4} ry={1.4} fill={INK} />;
      })}
      <Cylinder x={x} y={y} z={z + 14} r={17} h={height - 14} />
      {limb(upper, 24)}
      {limb(fore, 19)}
      {joint(shoulder[0], shoulder[1], 17)}
      {joint(ex, ey, 15)}
      {claw ? <motion.path d={clawD} fill="none" stroke={INK} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" /> : null}
      <motion.circle cx={wx} cy={wy} r={8.5} fill={PAPER} stroke={INK} strokeWidth={1.3} />
    </g>
  );
}

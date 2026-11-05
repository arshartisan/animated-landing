"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { cx } from "@/utils/cx";
import { project, topPlane, type Pt } from "./iso";
import { IsoBox } from "./primitives";
import {
  ACCENT,
  FILL,
  FILL_STRONG,
  INK,
  ORANGE,
  PAPER,
  RobotArm,
  Window,
  ease,
  lerp,
  mod,
  nss,
  span,
  useSceneClock,
  type ArmPose,
} from "./kit";

const SHIFT = 0;
// Diagonal staging (wireframe front-left → launch back-right) keeps the scene compact.
const VIEWBOX = "-300 -355 600 515";
const PAD = 18;
const LEFT = { x: -55, y: 120, w: 110, d: 110 };
const MID = { x: -90, y: -90, w: 180, d: 180 };
const RIGHT = { x: -55, y: -230, w: 110, d: 110 };

const WIRE = { x: LEFT.x + 15, y: LEFT.y + 70, w: 90, h: 80, t: 10, z: PAD };
const BUILD = { x: -70, y: -50, w: 140, h: 140, t: 14, z: PAD };
const DONE = { x: RIGHT.x + 10, y: RIGHT.y + 30, w: 90, h: 90, t: 10, z: PAD };

// Build slots on the middle window's right column (wall coords)
const SLOTS = [0, 1, 2].map((i) => ({ u: BUILD.x + BUILD.w - 46, v: BUILD.z + BUILD.h - 52 - i * 30, w: 36, h: 22 }));
const slotCenter = (i: number): Pt => {
  const s = SLOTS[i];
  return project(s.u + s.w / 2, BUILD.y + BUILD.t, s.v + s.h / 2);
};
const ARM = { x: -40, y: 55 };
const PICK: Pt = project(ARM.x + 20, ARM.y + 60, PAD + 24);
const STEP = 2400;
const BUILD_CYCLE = STEP * 3 + 1600;

function buildState(v: number) {
  const l = mod(v, BUILD_CYCLE);
  const n = Math.min(2, Math.floor(l / STEP));
  const f = l - n * STEP;
  const done = l >= STEP * 3;
  const go = ease(span(f, 0, 900));
  const back = ease(span(f, 1200, 2000));
  const target = slotCenter(n);
  const aim: Pt = [target[0] - 24, target[1] + 10];
  const wrist = done ? PICK : f < 1200 ? lerp(PICK, aim, go) : lerp(aim, PICK, back);
  const grip = done ? 0 : f < 900 ? 1 : f < 2000 ? 0 : span(f, 2000, 2300);
  const carrying = !done && f < 900;
  const filled = (i: number) => (done ? 1 - span(l, BUILD_CYCLE - 500, BUILD_CYCLE) : i < n ? 1 : i === n ? span(f, 850, 1000) : 0);
  return { wrist, grip, carrying, filled, arc: -Math.sin((f < 1200 ? go : back) * Math.PI) * 20 };
}

export function MvpScene({ className }: { className?: string }) {
  const { ref, t } = useSceneClock(STEP * 2 + 950);
  return (
    <svg
      ref={ref}
      viewBox={VIEWBOX}
      className={cx("scene-machine", className)}
      role="img"
      aria-label="A wireframe becomes a built product with a robotic arm, then launches with a rocket"
    >
      <g transform={`translate(0 ${SHIFT})`}>
        <Links />
        {/* Back to front: launch, build, wireframe */}
        <PadBox p={RIGHT} />
        <Done />
        <Rocket t={t} />
        <PadBox p={MID} />
        <Build t={t} />
        <Builder t={t} />
        <PadBox p={LEFT} />
        <Wireframe t={t} />
      </g>
    </svg>
  );
}

function Links() {
  const pts: Pt[] = [
    [LEFT.x + LEFT.w / 2, LEFT.y + LEFT.d / 2],
    [0, 0],
    [RIGHT.x + RIGHT.w / 2, RIGHT.y + RIGHT.d / 2],
  ];
  return (
    <g transform={topPlane(0)}>
      <path d={`M${pts[0][0]} ${pts[0][1]}L${pts[1][0]} ${pts[1][1]}L${pts[2][0]} ${pts[2][1]}`} fill="none" stroke={INK} strokeWidth={1.3} {...nss} />
      {[
        [0, (LEFT.y + MID.y + MID.d) / 2],
        [0, (RIGHT.y + RIGHT.d + MID.y) / 2],
      ].map(([x, y]) => (
        <circle key={y} cx={x} cy={y} r={8} fill={PAPER} stroke={INK} strokeWidth={1.3} {...nss} />
      ))}
    </g>
  );
}

function PadBox({ p }: { p: typeof MID }) {
  return <IsoBox {...p} h={PAD} r={p === MID ? 26 : 18} />;
}

// ── 1. Wireframe ─────────────────────────────────────────────────────
function Wireframe({ t }: { t: MotionValue<number> }) {
  const W = WIRE;
  const dash = useTransform(t, (v) => -mod(v / 30, 10));
  const img = { u: W.x + 10, v: W.z + 26, w: 46, h: 30 };
  return (
    <Window {...W}>
      <motion.g fill="none" stroke={INK} strokeWidth={1.1} strokeDasharray="4 3" style={{ strokeDashoffset: dash }}>
        <rect x={img.u} y={img.v} width={img.w} height={img.h} {...nss} />
        <path d={`M${img.u} ${img.v}L${img.u + img.w} ${img.v + img.h}M${img.u + img.w} ${img.v}L${img.u} ${img.v + img.h}`} {...nss} />
        <rect x={W.x + 62} y={W.z + 42} width={18} height={14} rx={2} {...nss} />
        <rect x={W.x + 62} y={W.z + 26} width={18} height={12} rx={2} {...nss} />
      </motion.g>
      <rect x={W.x + 10} y={W.z + 14} width={56} height={3} rx={1.5} fill={FILL_STRONG} />
      <rect x={W.x + 10} y={W.z + 8} width={40} height={3} rx={1.5} fill={FILL_STRONG} />
    </Window>
  );
}

// ── 2. Build ─────────────────────────────────────────────────────────
function Build({ t }: { t: MotionValue<number> }) {
  const B = BUILD;
  const img = { u: B.x + 12, v: B.z + 46, w: 74, h: 60 };
  return (
    <Window {...B}>
      <rect x={img.u} y={img.v} width={img.w} height={img.h} rx={5} fill={FILL} stroke={INK} strokeWidth={1} {...nss} />
      <path d={`M${img.u + 6} ${img.v + 6}L${img.u + 28} ${img.v + 38}L${img.u + 40} ${img.v + 22}L${img.u + 68} ${img.v + 6}`} fill="none" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" {...nss} />
      <circle cx={img.u + 52} cy={img.v + 44} r={6} fill="none" stroke={INK} strokeWidth={1.3} {...nss} />
      <rect x={B.x + 12} y={B.z + 30} width={70} height={3} rx={1.5} fill={FILL_STRONG} />
      <rect x={B.x + 12} y={B.z + 22} width={50} height={3} rx={1.5} fill={FILL_STRONG} />
      {SLOTS.map((s, i) => (
        <Slot key={i} i={i} s={s} t={t} />
      ))}
    </Window>
  );
}

function Slot({ i, s, t }: { i: number; s: (typeof SLOTS)[number]; t: MotionValue<number> }) {
  const opacity = useTransform(t, (v) => buildState(v).filled(i));
  return (
    <g>
      <rect x={s.u} y={s.v} width={s.w} height={s.h} rx={5} fill="none" stroke={INK} strokeWidth={1.1} {...nss} />
      <motion.rect x={s.u} y={s.v} width={s.w} height={s.h} rx={5} fill={ACCENT} stroke={INK} strokeWidth={1.1} style={{ opacity }} {...nss} />
    </g>
  );
}

function Builder({ t }: { t: MotionValue<number> }) {
  const pose = useTransform(t, (v): ArmPose => {
    const s = buildState(v);
    return { wrist: [s.wrist[0], s.wrist[1] + s.arc], grip: s.grip };
  });
  const bx = useTransform(pose, (p) => p.wrist[0]);
  const by = useTransform(pose, (p) => p.wrist[1]);
  const carry = useTransform(t, (v) => (buildState(v).carrying ? 1 : 0));
  return (
    <g>
      <RobotArm x={ARM.x} y={ARM.y} z={PAD} pose={pose} l1={95} l2={90} height={44} />
      <motion.g style={{ x: bx, y: by, opacity: carry }}>
        <g transform="translate(20 4)">
          <IsoBox x={-10} y={-4} z={-8} w={20} d={8} h={14} r={2} {...ORANGE} />
        </g>
      </motion.g>
    </g>
  );
}

// ── 3. Launch ────────────────────────────────────────────────────────
function Done() {
  const D = DONE;
  return (
    <Window {...D}>
      <rect x={D.x + 10} y={D.z + 30} width={44} height={38} rx={4} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
      <path d={`M${D.x + 14} ${D.z + 34}L${D.x + 28} ${D.z + 54}L${D.x + 36} ${D.z + 44}L${D.x + 50} ${D.z + 34}Z`} fill={PAPER} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={D.x + 60} y={D.z + 54 - i * 14} width={22} height={10} rx={3} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
      ))}
      <rect x={D.x + 10} y={D.z + 18} width={44} height={3} rx={1.5} fill={FILL_STRONG} />
      <rect x={D.x + 10} y={D.z + 10} width={30} height={3} rx={1.5} fill={FILL_STRONG} />
    </Window>
  );
}

const LAUNCH = 4200;
function Rocket({ t }: { t: MotionValue<number> }) {
  const base = project(DONE.x + DONE.w / 2, DONE.y + DONE.t / 2, DONE.z + DONE.h);
  const lift = useTransform(t, (v) => {
    const l = mod(v, LAUNCH);
    if (l < 1800) return Math.sin(l / 160) * 1.2; // idling on the pad
    if (l < 3400) return -Math.pow(span(l, 1800, 3400), 2) * 420; // launch
    return 0; // back on the pad, fading in
  });
  const opacity = useTransform(t, (v) => {
    const l = mod(v, LAUNCH);
    return l < 3400 ? 1 : span(l, 3700, LAUNCH);
  });
  const trail = useTransform(lift, (y) => Math.min(120, -y * 0.5));
  const puff = useTransform(t, (v) => span(mod(v, LAUNCH), 1700, 2600));
  const puffR = useTransform(puff, (p) => 10 + p * 18);
  const puffO = useTransform(puff, (p) => (p > 0 ? 0.9 * (1 - p) : 0));
  const rx = base[0];
  const ry = base[1] - 64;
  return (
    <g>
      {[-1, 0, 1].map((k) => (
        <motion.circle key={k} cx={rx + k * 18} cy={base[1] - 6} r={puffR} fill={PAPER} stroke={INK} strokeWidth={1} style={{ opacity: puffO }} />
      ))}
      <motion.g style={{ y: lift, opacity }}>
        <motion.rect x={rx - 4} y={ry + 38} width={8} height={trail} rx={4} fill={FILL} stroke={INK} strokeWidth={1} />
        <g transform={`translate(${rx} ${ry})`} stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
          <path d="M-16 18L-26 32L-26 40L-12 32Z" fill={ACCENT} />
          <path d="M16 18L26 32L26 40L12 32Z" fill={ACCENT} />
          <path d="M0 -42C14 -28 16 -6 13 30H-13C-16 -6 -14 -28 0 -42Z" fill={PAPER} />
          <path d="M0 -42C7 -35 10 -28 11 -22H-11C-10 -28 -7 -35 0 -42Z" fill={ACCENT} />
          <circle cy={-6} r={6} fill={PAPER} />
          <path d="M-6 30L0 44L6 30Z" fill={ACCENT} />
        </g>
      </motion.g>
    </g>
  );
}

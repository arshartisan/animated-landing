"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { cx } from "@/utils/cx";
import { halfSpaceClip, project, wallRect, wallX, wallY, type Pt } from "./iso";
import { Cylinder, IsoBox } from "./primitives";
import {
  ACCENT,
  INK,
  Led,
  ON_ACCENT,
  ORANGE,
  PAPER,
  RobotArm,
  SERVICE_VIEWBOX,
  SOLID,
  ease,
  lerp,
  mod,
  nss,
  span,
  useSceneClock,
  type ArmPose,
} from "./kit";

// ── Layout ───────────────────────────────────────────────────────────
const SHIFT = 60;
const DECK = 30; // platform top
const CORE_TOP = 90; // module seats
const MOD = 58; // module cube size
const SLOT = { x: -37, y: -37 }; // where the gantry drops new modules (centre)
const DROP_TOP = 170;
const CYCLE = 3600;

const BELT = { x: -120, w: 60, from: 190, to: 370, z: 40, h: 10 };
const TUNNEL = { x: -135, y: 150, w: 90, d: 40, h: 80 };
const MOUTH = { from: TUNNEL.x + 13, to: TUNNEL.x + TUNNEL.w - 13, z0: 40, z1: 95 };
const BELT_TOP = BELT.z + BELT.h;
const ITEM = 32;
const ITEM_PITCH = 62;
const ITEMS = 4;

// Items show in front of the tunnel face, and through its mouth only once inside.
const CLIP = (() => {
  const c = TUNNEL.y + TUNNEL.d;
  const zMax = 110;
  return (
    halfSpaceClip("y", c, zMax) +
    wallRect("y", c, TUNNEL.x, TUNNEL.x + TUNNEL.w, BELT_TOP, zMax) +
    wallRect("y", c, MOUTH.from, MOUTH.to, BELT_TOP, MOUTH.z1)
  );
})();

export function CustomSoftwareScene({ className }: { className?: string }) {
  const { ref, t } = useSceneClock(1300);
  return (
    <svg
      ref={ref}
      viewBox={SERVICE_VIEWBOX}
      className={cx("scene-machine", className)}
      role="img"
      aria-label="A software assembly line: modules ride a conveyor in, a gantry stacks them on a turntable and robot arms wire in the integrations"
    >
      <defs>
        <clipPath id="cs-belt-clip">
          <path d={CLIP} clipRule="evenodd" />
        </clipPath>
      </defs>
      <g transform={`translate(0 ${SHIFT})`}>
        <BackArm t={t} />
        <Platform t={t} />
        <GantryBack />
        <Modules t={t} />
        <GantryFront t={t} />
        <SideArm t={t} />
        <Conveyor t={t} />
      </g>
    </svg>
  );
}

// ── Platform + turntable + core ──────────────────────────────────────
function Platform({ t }: { t: MotionValue<number> }) {
  const bolts = Array.from({ length: 12 }, (_, i) => i);
  return (
    <g>
      <IsoBox x={-160} y={-160} w={320} d={320} h={DECK} r={50} />
      <g transform={wallY(160)}>
        <rect x={-10} y={8} width={70} height={14} rx={3} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
      </g>
      <g transform={wallX(160)}>
        <rect x={-60} y={8} width={70} height={14} rx={3} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
      </g>
      <Cylinder x={0} y={0} z={DECK} r={118} h={12} side="var(--iso-wall-r1)" />
      {bolts.map((i) => (
        <Bolt key={i} i={i} t={t} />
      ))}
      <IsoBox x={-75} y={-75} z={DECK + 12} w={150} d={150} h={34} r={10} {...ORANGE} top={PAPER} />
      <IsoBox x={-75} y={-75} z={DECK + 46} w={150} d={150} h={14} r={10} />
      {/* Socket the side arm plugs into */}
      <g transform={wallX(75)}>
        <rect x={-14} y={DECK + 50} width={28} height={16} rx={3} fill={SOLID} />
      </g>
    </g>
  );
}

function Bolt({ i, t }: { i: number; t: MotionValue<number> }) {
  const a = useTransform(t, (v) => v / 2600 + (i / 12) * Math.PI * 2);
  const p = useTransform(a, (ang) => project(Math.cos(ang) * 104, Math.sin(ang) * 104, DECK + 12));
  const x = useTransform(p, (q) => q[0]);
  const y = useTransform(p, (q) => q[1]);
  const opacity = useTransform(a, (ang) => (Math.sin(ang) + Math.cos(ang) > -0.4 ? 1 : 0));
  return <motion.ellipse cx={x} cy={y} rx={3} ry={1.8} fill={INK} style={{ opacity }} />;
}

// ── Gantry ───────────────────────────────────────────────────────────
const BEAM_Z = 250;
function GantryBack() {
  return (
    <g>
      <IsoBox x={-150} y={-150} z={DECK} w={22} d={22} h={BEAM_Z - DECK} r={3} />
      <IsoBox x={100} y={-150} z={DECK} w={22} d={22} h={BEAM_Z - DECK} r={3} />
      <IsoBox x={-150} y={100} z={DECK} w={22} d={22} h={BEAM_Z - DECK} r={3} />
      <IsoBox x={-150} y={-150} z={BEAM_Z} w={272} d={22} h={18} r={3} />
      <g transform={wallY(-128)}>
        <rect x={-10} y={BEAM_Z + 5} width={60} height={8} rx={4} fill={ACCENT} />
      </g>
      <IsoBox x={-150} y={-128} z={BEAM_Z} w={22} d={250} h={18} r={3} />
      <g transform={wallX(-128)}>
        <rect x={-10} y={BEAM_Z + 5} width={60} height={8} rx={4} fill={ACCENT} />
      </g>
    </g>
  );
}

function gantryState(v: number) {
  const l = mod(v, CYCLE);
  const down = ease(span(l, 0, 1000));
  const up = ease(span(l, 1300, 2300));
  const cubeZ = l < 3000 ? DROP_TOP + (CORE_TOP - DROP_TOP) * down : DROP_TOP;
  const headZ = l < 1300 ? cubeZ : CORE_TOP + (DROP_TOP - CORE_TOP) * up;
  const open = span(l, 1000, 1300) * (1 - span(l, 3200, 3500));
  const cubeO = l < 2300 ? 1 : l < 3000 ? 1 - span(l, 2300, 3000) : span(l, 3000, 3500);
  return { cubeZ, headZ, open, cubeO };
}

function GantryFront({ t }: { t: MotionValue<number> }) {
  const hub = { x: SLOT.x - 22, y: SLOT.y - 22 };
  const head = useTransform(t, (v) => gantryState(v).headZ + MOD);
  const rodBottom = useTransform(head, (z) => project(SLOT.x, SLOT.y, z + 8)[1]);
  const headY = useTransform(head, (z) => -(z - CORE_TOP - MOD));
  const spread = useTransform(t, (v) => 30 + gantryState(v).open * 9);
  const lx = useTransform(spread, (s) => -s);
  const top = project(SLOT.x, SLOT.y, BEAM_Z);
  const base = project(SLOT.x, SLOT.y, CORE_TOP + MOD);
  return (
    <g>
      <IsoBox x={-128} y={SLOT.y - 6} z={BEAM_Z + 4} w={hub.x + 128} d={12} h={10} r={2} />
      <IsoBox x={SLOT.x - 6} y={-128} z={BEAM_Z + 4} w={12} d={hub.y + 128} h={10} r={2} />
      <IsoBox x={hub.x} y={hub.y} z={BEAM_Z - 6} w={44} d={44} h={30} r={5} />
      <motion.line x1={top[0] - 3} x2={top[0] - 3} y1={top[1]} y2={rodBottom} stroke={INK} strokeWidth={1.4} />
      <motion.line x1={top[0] + 3} x2={top[0] + 3} y1={top[1]} y2={rodBottom} stroke={INK} strokeWidth={1.4} />
      <motion.g style={{ y: headY }}>
        <g transform={`translate(${base[0]} ${base[1]})`}>
          <IsoBox x={-12} y={-12} z={-12 + 4} w={24} d={24} h={8} r={3} />
          {[lx, spread].map((offset, i) => (
            <motion.g key={i} style={{ x: offset }}>
              <path
                d="M0 -4V30L-6 38"
                transform={i === 0 ? "scale(-1 1)" : undefined}
                fill="none"
                stroke={INK}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.g>
          ))}
        </g>
      </motion.g>
    </g>
  );
}

// ── Modules on the core ──────────────────────────────────────────────
function Modules({ t }: { t: MotionValue<number> }) {
  const lift = useTransform(t, (v) => -(gantryState(v).cubeZ - CORE_TOP));
  const opacity = useTransform(t, (v) => gantryState(v).cubeO);
  const cell = (x: number, y: number, accent?: boolean, icon?: "db" | "layers" | "plug") => (
    <g>
      <IsoBox x={x} y={y} z={CORE_TOP} w={MOD} d={MOD} h={MOD} r={4} {...(accent ? ORANGE : {})} />
      {icon ? <Icon kind={icon} x={x} y={y} accent={accent} /> : null}
    </g>
  );
  return (
    <g>
      <motion.g style={{ y: lift, opacity }}>{cell(SLOT.x - MOD / 2, SLOT.y - MOD / 2, true)}</motion.g>
      {cell(8, -66, false, "layers")}
      {cell(-66, 8, false, "db")}
      {cell(8, 8, true, "plug")}
    </g>
  );
}

function Icon({ kind, x, y, accent }: { kind: "db" | "layers" | "plug"; x: number; y: number; accent?: boolean }) {
  const ink = accent ? ON_ACCENT : INK;
  const u = x + MOD / 2;
  const v = CORE_TOP + MOD / 2;
  if (kind === "plug")
    return (
      <g transform={wallX(x + MOD)}>
        <g stroke={ink} strokeWidth={1.6} fill="none" strokeLinecap="round">
          <circle cx={y + MOD / 2} cy={v} r={8} {...nss} />
          <path d={`M${y + MOD / 2 - 3} ${v + 8}v6M${y + MOD / 2 + 3} ${v + 8}v6M${y + MOD / 2} ${v - 8}v-7`} {...nss} />
        </g>
      </g>
    );
  return (
    <g transform={wallY(y + MOD)}>
      <g stroke={ink} strokeWidth={1.4} fill="none" strokeLinecap="round">
        {kind === "db" ? (
          <>
            <ellipse cx={u} cy={v + 8} rx={11} ry={4} {...nss} />
            <path d={`M${u - 11} ${v + 8}v-16M${u + 11} ${v + 8}v-16`} {...nss} />
            <path d={`M${u - 11} ${v}a11 4 0 0 0 22 0M${u - 11} ${v - 8}a11 4 0 0 0 22 0`} {...nss} />
          </>
        ) : (
          [0, 1, 2].map((k) => <path key={k} d={`M${u - 12} ${v - 8 + k * 7}L${u} ${v - 3 + k * 7}L${u + 12} ${v - 8 + k * 7}`} {...nss} />)
        )}
      </g>
    </g>
  );
}

// ── Robot arms ───────────────────────────────────────────────────────
const SOCKET = project(78, 0, DECK + 58);

function sideArmPose(v: number): ArmPose {
  const l = mod(v, 3000);
  const push = ease(span(l, 0, 700)) * (1 - ease(span(l, 1900, 2600)));
  const out: Pt = [SOCKET[0] + 46, SOCKET[1] + 10];
  const wrist = lerp(out, [SOCKET[0] + 22, SOCKET[1] + 4], push);
  return { wrist, grip: 1 };
}

function SideArm({ t }: { t: MotionValue<number> }) {
  const pose = useTransform(t, sideArmPose);
  const px = useTransform(pose, (p) => p.wrist[0]);
  const py = useTransform(pose, (p) => p.wrist[1]);
  return (
    <g>
      <RobotArm x={235} y={-70} pose={pose} l1={110} l2={100} claw={false} />
      <motion.g style={{ x: px, y: py }}>
        <g transform="translate(-14 -2)">
          <IsoBox x={-8} y={-7} z={-7} w={16} d={14} h={14} r={2} {...ORANGE} />
          <path d="M-14 -2h-8M-14 4h-8" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        </g>
      </motion.g>
      <Led cx={SOCKET[0] - 2} cy={SOCKET[1] - 12} t={t} period={3000} />
    </g>
  );
}

function backArmPose(v: number): ArmPose {
  const k = 0.5 + 0.5 * Math.sin(v / 900);
  const wrist = lerp([-60, -170], [-20, -130], ease(k));
  return { wrist, grip: 0.5 + 0.5 * Math.sin(v / 450) };
}

function BackArm({ t }: { t: MotionValue<number> }) {
  const pose = useTransform(t, backArmPose);
  return <RobotArm x={-230} y={-60} pose={pose} l1={100} l2={95} />;
}

// ── Conveyor into the tunnel ─────────────────────────────────────────
function Conveyor({ t }: { t: MotionValue<number> }) {
  const B = BELT;
  const len = B.to - B.from;
  const step = 20;
  const offset = useTransform(t, (v) => (v / 1500) * ITEM_PITCH);
  const slats = useTransform(offset, (o) => -(o % step));
  return (
    <g>
      {/* Legs */}
      {[260, 345].map((y) =>
        [B.x + 6, B.x + B.w - 14].map((x) => <IsoBox key={`${x}${y}`} x={x} y={y} w={8} d={8} h={B.z} r={1} />),
      )}
      <IsoBox x={B.x} y={B.from} z={B.z} w={B.w} d={len} h={B.h} r={4}>
        <clipPath id="cs-slat-clip">
          <rect x={B.x + 3} y={B.from + 1} width={B.w - 6} height={len - 2} />
        </clipPath>
        <g clipPath="url(#cs-slat-clip)">
          <motion.g style={{ y: slats }}>
            {Array.from({ length: Math.ceil(len / step) + 2 }, (_, i) => (
              <line key={i} x1={B.x + 4} x2={B.x + B.w - 4} y1={B.from + i * step} y2={B.from + i * step} stroke={INK} strokeWidth={0.8} opacity={0.45} {...nss} />
            ))}
          </motion.g>
        </g>
      </IsoBox>

      {/* Tunnel */}
      <IsoBox x={TUNNEL.x} y={TUNNEL.y} z={DECK} w={TUNNEL.w} d={TUNNEL.d} h={TUNNEL.h} r={8} />
      <g transform={wallY(TUNNEL.y + TUNNEL.d)}>
        <rect x={MOUTH.from - 6} y={MOUTH.z0} width={MOUTH.to - MOUTH.from + 12} height={MOUTH.z1 - MOUTH.z0 + 6} rx={6} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
        <rect x={MOUTH.from} y={MOUTH.z0} width={MOUTH.to - MOUTH.from} height={MOUTH.z1 - MOUTH.z0} rx={4} fill={SOLID} />
      </g>

      <g clipPath="url(#cs-belt-clip)">
        {Array.from({ length: ITEMS }, (_, i) => (
          <BeltItem key={i} i={i} t={t} />
        ))}
      </g>
    </g>
  );
}

function BeltItem({ i, t }: { i: number; t: MotionValue<number> }) {
  const u = useTransform(t, (v) => mod(v / 1500 + i, ITEMS)); // 0 = far end, ITEMS = deep in tunnel
  const y = useTransform(u, (k) => BELT.to - 20 - k * ITEM_PITCH);
  const shift = useTransform(y, (wy) => project(0, wy - BELT.to, 0));
  const sx = useTransform(shift, (p) => p[0]);
  const sy = useTransform(shift, (p) => p[1]);
  const opacity = useTransform(u, (k) => Math.min(1, k / 0.4));
  const x0 = BELT.x + (BELT.w - ITEM) / 2;
  return (
    <motion.g style={{ x: sx, y: sy, opacity }}>
      <IsoBox x={x0} y={BELT.to - ITEM / 2} z={BELT_TOP} w={ITEM} d={ITEM} h={ITEM} r={3} {...(i % 2 ? ORANGE : {})} />
    </motion.g>
  );
}


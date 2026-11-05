"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { cx } from "@/utils/cx";
import { project, topPlane, wallX, wallY, type Pt } from "./iso";
import { IsoBox } from "./primitives";
import {
  ACCENT,
  Bob,
  INK,
  Led,
  ON_ACCENT,
  ORANGE,
  PAD_H,
  PAPER,
  Pad,
  RECESS,
  RobotArm,
  SERVICE_VIEWBOX,
  SHADED,
  along,
  clamp01,
  ease,
  lerp,
  mod,
  nss,
  useSceneClock,
  useValue,
  type ArmPose,
} from "./kit";

// ── Layout (world units) ─────────────────────────────────────────────
const SERVER_PAD = { x: -400, y: -70, w: 150, d: 100 };
const STACK_PAD = { x: -80, y: -380, w: 150, d: 140 };
const CHART_PAD = { x: -90, y: 240, w: 150, d: 110 };
const DB_PAD = { x: 300, y: 40, w: 130, d: 130 };

const ROUTES: { pts: Pt[]; out?: boolean }[] = [
  { pts: [[-250, -20], [-190, -20], [-190, -70], [-130, -70]] },
  { pts: [[-15, 240], [-15, 190], [-70, 190], [-70, 130]] },
  { pts: [[-5, -240], [-5, -190], [60, -190], [60, -130]], out: true },
  { pts: [[300, 110], [200, 110], [200, 90], [130, 90]], out: true },
];

// Neural lattice inside the engine
const COLS: Pt[] = [
  [-40, -40],
  [35, -40],
  [-40, 35],
  [35, 35],
];
const LEVELS = [80, 135, 190];
type Node3 = { x: number; y: number; z: number; key: string };
const NODES: Node3[] = COLS.flatMap(([x, y]) => LEVELS.map((z) => ({ x, y, z, key: `${x},${y},${z}` }))).sort(
  (a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z,
);
const EDGES: [Node3, Node3][] = [];
for (const a of NODES)
  for (const b of NODES) {
    if (a.key >= b.key) continue;
    const same = [a.x === b.x, a.y === b.y, a.z === b.z].filter(Boolean).length;
    const adjacentLevel = a.z === b.z || Math.abs(LEVELS.indexOf(a.z) - LEVELS.indexOf(b.z)) === 1;
    if (same === 2 && adjacentLevel) EDGES.push([a, b]);
  }

// Robot arm
const ARM_STEP = 2200;
const ARM_MOVE = 900;
const ARM_STOPS: Node3[] = [
  [35, -40, 135],
  [35, 35, 80],
  [35, -40, 80],
  [35, 35, 135],
].map(([x, y, z]) => NODES.find((n) => n.x === x && n.y === y && n.z === z)!);
const ROBOT = { x: 160, y: -120 }; // base plate corner
const GRIP_OFFSET: Pt = [22, -5];
function armState(v: number) {
  const n = Math.floor(v / ARM_STEP);
  const f = v - n * ARM_STEP;
  const from = ARM_STOPS[mod(n, ARM_STOPS.length)];
  const to = ARM_STOPS[mod(n + 1, ARM_STOPS.length)];
  const e = f < ARM_MOVE ? ease(f / ARM_MOVE) : 1;
  const grip = clamp01((f - ARM_MOVE - 60) / 180) * (1 - clamp01((f - (ARM_STEP - 260)) / 200));
  return { from, to, e, grip, held: f >= ARM_MOVE ? to.key : null };
}

// ── Scene ────────────────────────────────────────────────────────────
export function AiScene({ className }: { className?: string }) {
  const { ref, t } = useSceneClock(ARM_MOVE + 600);

  return (
    <svg
      ref={ref}
      viewBox={SERVICE_VIEWBOX}
      className={cx("scene-machine", className)}
      role="img"
      aria-label="An AI engine with a neural network core, fed by servers, data stores and analytics, tended by a robotic arm"
    >
      {ROUTES.map((r, i) => (
        <Route key={i} route={r} i={i} t={t} />
      ))}

      <Servers t={t} />
      <Floater x={-260} y={-150} z={110} t={t} phase={0} accent />
      <Stack t={t} />
      <Floater x={-40} y={-260} z={170} t={t} phase={1.4} />
      <Floater x={-250} y={170} z={50} t={t} phase={2.2} />

      <Engine t={t} />
      <Robot t={t} />

      <Chart t={t} />
      <Database t={t} />
      <Floater x={260} y={230} z={40} t={t} phase={0.7} accent />
    </svg>
  );
}

// ── Ground traces with travelling packets ────────────────────────────
function Route({ route, i, t }: { route: (typeof ROUTES)[number]; i: number; t: MotionValue<number> }) {
  const k = useTransform(t, (v) => mod(v / 2600 + i * 0.27, 1));
  const pos = useTransform(k, (p) => along(route.pts, route.out ? 1 - p : p));
  const x = useTransform(pos, (p) => p[0] - 4.5);
  const y = useTransform(pos, (p) => p[1] - 4.5);
  const opacity = useTransform(k, (p) => clamp01(p / 0.12) * clamp01((1 - p) / 0.12));
  const mid = along(route.pts, 0.5);
  const d = route.pts.map((p, j) => `${j ? "L" : "M"}${p[0]} ${p[1]}`).join("");
  return (
    <g transform={topPlane(0)}>
      <path d={d} fill="none" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" {...nss} />
      <rect x={mid[0] - 4} y={mid[1] - 4} width={8} height={8} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
      <motion.rect x={x} y={y} width={9} height={9} fill={ACCENT} stroke={INK} strokeWidth={1} style={{ opacity }} {...nss} />
    </g>
  );
}

// ── Server racks (top left) ──────────────────────────────────────────
const RACK = { y: -55, w: 40, d: 60, h: 100 };

function Servers({ t }: { t: MotionValue<number> }) {
  return (
    <g>
      <Pad {...SERVER_PAD} />
      {[-388, -342, -296].map((x, i) => (
        <g key={x}>
          <IsoBox x={x} y={RACK.y} z={PAD_H} w={RACK.w} d={RACK.d} h={RACK.h} r={4} />
          <g transform={wallY(RACK.y + RACK.d)}>
            {[0, 1, 2].map((b) => {
              const v = PAD_H + 12 + b * 28;
              return (
                <g key={b}>
                  <rect x={x + 5} y={v} width={30} height={20} rx={2} fill={RECESS} stroke={INK} strokeWidth={1} {...nss} />
                  <line x1={x + 10} x2={x + 21} y1={v + 10} y2={v + 10} stroke={INK} strokeWidth={1.4} strokeLinecap="round" {...nss} />
                  <Led cx={x + 28} cy={v + 10} t={t} delay={(i * 3 + b) * 370} />
                </g>
              );
            })}
          </g>
        </g>
      ))}
    </g>
  );
}

// ── Layered stack with hovering blocks (top right) ───────────────────
const PLATE = { x: -60, y: -355, w: 110, d: 90, h: 10 };
const BLOCKS: Pt[] = [
  [-35, -280],
  [-5, -310],
  [25, -340],
];

function Stack({ t }: { t: MotionValue<number> }) {
  const lift = useTransform(t, (v) => -(3 + 3 * Math.sin(v / 800)));
  const flow = useTransform(t, (v) => -mod(v / 40, 6));
  const topZ = PAD_H + 3 * (PLATE.h + 4);
  return (
    <g>
      <Pad {...STACK_PAD} />
      <IsoBox {...PLATE} z={PAD_H} r={6} />
      <IsoBox {...PLATE} z={PAD_H + PLATE.h + 4} r={6} {...ORANGE} />
      <motion.g style={{ y: lift }}>
        <IsoBox {...PLATE} z={PAD_H + 2 * (PLATE.h + 4)} r={6} />
      </motion.g>
      {BLOCKS.map(([bx, by], i) => (
        <WiredBlock key={i} at={[bx, by]} z={topZ} i={i} t={t} flow={flow} />
      ))}
    </g>
  );
}

/** Block hovering on a dashed data wire; the wire stretches with the bob so it stays attached. */
function WiredBlock({ at: [bx, by], z, i, t, flow }: { at: Pt; z: number; i: number; t: MotionValue<number>; flow: MotionValue<number> }) {
  const GAP = 64;
  const bob = useTransform(t, (v) => Math.sin(v / 950 + i * 1.1) * 4);
  const base = project(bx, by, z);
  const top = useTransform(bob, (b) => base[1] - GAP + b);
  return (
    <g>
      <circle cx={base[0]} cy={base[1]} r={2} fill={INK} />
      <motion.line x1={base[0]} x2={base[0]} y1={base[1]} y2={top} stroke={INK} strokeWidth={1.1} strokeDasharray="3 3" style={{ strokeDashoffset: flow }} />
      <motion.g style={{ y: bob }}>
        <IsoBox x={bx - 10} y={by - 10} z={z + GAP} w={20} d={20} h={20} r={2} {...(i === 1 ? ORANGE : {})} />
      </motion.g>
    </g>
  );
}

// ── Bar chart (bottom left) ──────────────────────────────────────────
const BARS = [
  { x: -75, base: 50, amp: 14 },
  { x: -30, base: 78, amp: 18 },
  { x: 15, base: 112, amp: 20, accent: true },
];

function Chart({ t }: { t: MotionValue<number> }) {
  return (
    <g>
      <Pad {...CHART_PAD} />
      {BARS.map((bar, i) => (
        <Bar key={bar.x} bar={bar} i={i} t={t} />
      ))}
    </g>
  );
}

function Bar({ bar, i, t }: { bar: (typeof BARS)[number]; i: number; t: MotionValue<number> }) {
  const h = useValue(useTransform(t, (v) => Math.round(bar.base + bar.amp * Math.sin(v / 900 + i * 1.4))));
  return <IsoBox x={bar.x} y={278} z={PAD_H} w={34} d={36} h={h} r={3} {...(bar.accent ? ORANGE : {})} />;
}

// ── Database tiers (bottom right) ────────────────────────────────────
function Database({ t }: { t: MotionValue<number> }) {
  const tier = { x: 325, y: 65, w: 80, d: 80, h: 26 };
  return (
    <g>
      <Pad {...DB_PAD} />
      {[0, 1, 2].map((i) => {
        const z = PAD_H + i * (tier.h + 4);
        return (
          <g key={i}>
            <IsoBox {...tier} z={z} r={10}>
              {i === 2 ? (
                <rect x={tier.x + 16} y={tier.y + 16} width={48} height={48} rx={6} fill={ACCENT} stroke={INK} strokeWidth={1.1} {...nss} />
              ) : null}
            </IsoBox>
            <g transform={wallX(tier.x + tier.w)}>
              <Led cx={tier.y + tier.d - 16} cy={z + tier.h / 2} t={t} delay={-i * 420} period={1260} rect />
            </g>
          </g>
        );
      })}
    </g>
  );
}

// ── Floating cubes ───────────────────────────────────────────────────
function Floater({ x, y, z, t, phase, accent }: { x: number; y: number; z: number; t: MotionValue<number>; phase: number; accent?: boolean }) {
  return (
    <Bob t={t} phase={phase}>
      <IsoBox x={x - 13} y={y - 13} z={z} w={26} d={26} h={26} r={2} {...(accent ? ORANGE : {})} />
    </Bob>
  );
}

// ── Engine: base, open housing, neural core, lid ─────────────────────
function Engine({ t }: { t: MotionValue<number> }) {
  const lid = useTransform(t, (v) => -(3 + 3 * Math.sin(v / 1100)));
  return (
    <g>
      {/* Base platform with vents and trim */}
      <IsoBox x={-130} y={-130} w={260} d={260} h={30} r={20} />
      <g transform={wallY(130)}>
        {[0, 1, 2, 3, 4].map((k) => (
          <rect key={k} x={-100 + k * 9} y={8} width={4} height={15} rx={2} fill="var(--scene-solid)" />
        ))}
        <rect x={-30} y={5} width={70} height={20} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
      </g>
      <g transform={wallX(130)}>
        {[0, 1, 2, 3, 4].map((k) => (
          <rect key={k} x={60 + k * 9} y={8} width={4} height={15} rx={2} fill="var(--scene-solid)" />
        ))}
        <rect x={-40} y={5} width={70} height={20} fill={ACCENT} stroke={INK} strokeWidth={1} {...nss} />
      </g>
      <IsoBox x={-100} y={-100} z={30} w={200} d={200} h={10} r={14} {...ORANGE} top={PAPER} />

      {/* Housing: back walls first */}
      <IsoBox x={-90} y={-90} z={40} w={168} d={12} h={180} r={3} left={SHADED} />
      <IsoBox x={-90} y={-78} z={40} w={12} d={156} h={180} r={3} />
      <g transform={topPlane(40)}>
        <rect x={-70} y={-70} width={140} height={140} rx={10} fill={RECESS} stroke={INK} strokeWidth={1} {...nss} />
      </g>

      <Lattice t={t} />

      {/* Front sills and side slabs */}
      <IsoBox x={-20} y={78} z={40} w={98} d={12} h={24} r={3} />
      <IsoBox x={78} y={-20} z={40} w={12} d={110} h={24} r={3} />
      <IsoBox x={-90} y={78} z={40} w={70} d={12} h={180} r={3} />
      <g transform={wallY(90)}>
        <rect x={-82} y={62} width={44} height={110} fill={ACCENT} stroke={INK} strokeWidth={1.1} {...nss} />
      </g>
      <IsoBox x={78} y={-90} z={40} w={12} d={70} h={180} r={3} />
      <g transform={wallX(90)}>
        <rect x={-82} y={62} width={44} height={110} fill={ACCENT} stroke={INK} strokeWidth={1.1} {...nss} />
      </g>

      {/* Hovering lid */}
      <motion.g style={{ y: lid }}>
        <IsoBox x={-98} y={-98} z={220} w={196} d={196} h={22} r={18}>
          <rect x={-50} y={-50} width={100} height={100} rx={8} fill={ACCENT} stroke={INK} strokeWidth={1.1} {...nss} />
        </IsoBox>
      </motion.g>
    </g>
  );
}

function Lattice({ t }: { t: MotionValue<number> }) {
  return (
    <g>
      {EDGES.map(([a, b]) => {
        const p = project(a.x, a.y, a.z);
        const q = project(b.x, b.y, b.z);
        return <line key={`${a.key}-${b.key}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={INK} strokeWidth={1.1} opacity={0.6} />;
      })}
      {NODES.map((n, i) => (
        <LatticeNode key={n.key} n={n} i={i} t={t} />
      ))}
    </g>
  );
}

function LatticeNode({ n, i, t }: { n: Node3; i: number; t: MotionValue<number> }) {
  const [x, y] = project(n.x, n.y, n.z);
  const halo = useTransform(t, (v) => {
    const s = armState(v);
    if (s.held === n.key) return 0.55 + 0.25 * s.grip;
    return 0.1 + 0.3 * (0.5 + 0.5 * Math.sin(v / 420 - (n.z / 55 + i * 0.35)));
  });
  const haloR = useTransform(halo, (h) => 11 + h * 9);
  return (
    <g>
      <motion.circle cx={x} cy={y} r={haloR} fill={ACCENT} style={{ opacity: halo }} />
      <circle cx={x} cy={y} r={8.5} fill={ACCENT} stroke={INK} strokeWidth={1.1} />
      <circle cx={x - 2.6} cy={y - 2.6} r={2.4} fill={ON_ACCENT} opacity={0.75} />
    </g>
  );
}

// ── Robot arm ────────────────────────────────────────────────────────
function armPose(v: number): ArmPose {
  const s = armState(v);
  const a = project(s.from.x, s.from.y, s.from.z);
  const b = project(s.to.x, s.to.y, s.to.z);
  const target = lerp(a, b, s.e);
  return {
    wrist: [target[0] + GRIP_OFFSET[0], target[1] + GRIP_OFFSET[1] - Math.sin(s.e * Math.PI) * 18],
    grip: s.grip,
  };
}

function Robot({ t }: { t: MotionValue<number> }) {
  const pose = useTransform(t, armPose);
  return <RobotArm x={ROBOT.x + 30} y={ROBOT.y + 30} pose={pose} />;
}

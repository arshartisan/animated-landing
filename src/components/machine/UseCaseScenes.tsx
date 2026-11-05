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
import { S, project, topPlane, wallY, type Pt } from "./iso";
import { Cylinder, IsoBox } from "./primitives";

// ── Shared ───────────────────────────────────────────────────────────
// Every color is a theme token (styles/scene.css), so the scenes follow light/dark.
// Brand marks (Slack, Gmail) keep their own colors in both themes.
const INK = "var(--scene-ink)";
const ACCENT = "var(--scene-accent)";
const ACCENT_SOFT = "var(--scene-accent-soft)";
const LINE = "var(--scene-accent-line)";

const NAVY_BOX = {
  top: "var(--scene-solid)",
  left: ["var(--scene-solid-left)", "var(--scene-solid-mid)"] as [string, string],
  right: ["var(--scene-solid-right)", "var(--scene-solid-mid)"] as [string, string],
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
const span = (l: number, a: number, b: number) => clamp01((l - a) / (b - a));
const bump = (p: number) => Math.sin(clamp01(p) * Math.PI);
const mod = (v: number, m: number) => ((v % m) + m) % m;

/** World (x, y) whose projection at height z lands on screen point (sx, sy). */
export const toWorld = (sx: number, sy: number, z = 0): Pt => {
  const a = sx / S;
  const b = 2 * (sy + z);
  return [(a + b) / 2, (b - a) / 2];
};

const cubic = (p: number, a: Pt, b: Pt, c: Pt, d: Pt): Pt => {
  const q = 1 - p;
  const k = [q * q * q, 3 * q * q * p, 3 * q * p * p, p * p * p];
  return [
    k[0] * a[0] + k[1] * b[0] + k[2] * c[0] + k[3] * d[0],
    k[0] * a[1] + k[1] * b[1] + k[2] * c[1] + k[3] * d[1],
  ];
};

/** Raw time in ms (frozen at `still` when the user prefers reduced motion). */
function useClock(still: number) {
  const reduce = useReducedMotion();
  const live = useTime();
  const frozen = useMotionValue(still);
  return reduce ? frozen : live;
}

function Scene({ viewBox, label, children }: { viewBox: string; label: string; children: ReactNode }) {
  return (
    <svg viewBox={viewBox} className="scene-usecase h-full w-full" role="img" aria-label={label}>
      {children}
    </svg>
  );
}

/** Upright slab facing +y (screen lower-left). Children draw on its face: u = world x, v = world z. */
export function Panel({
  x,
  y,
  z = 0,
  w,
  h,
  t = 5,
  top,
  left,
  right,
  children,
}: {
  x: number;
  y: number;
  z?: number;
  w: number;
  h: number;
  t?: number;
  top?: string;
  left?: [string, string];
  right?: [string, string];
  children?: ReactNode;
}) {
  return (
    <g>
      <IsoBox x={x} y={y} z={z} w={w} d={t} h={h} r={2} top={top} left={left} right={right} />
      {children ? <g transform={wallY(y + t)}>{children}</g> : null}
    </g>
  );
}

export function WallText({
  u,
  v,
  size = 10,
  fill = INK,
  weight = 600,
  anchor = "middle",
  children,
}: {
  u: number;
  v: number;
  size?: number;
  fill?: string;
  weight?: number;
  anchor?: "start" | "middle" | "end";
  children: ReactNode;
}) {
  return (
    <text
      transform={`translate(${u} ${v}) scale(1 -1)`}
      fontSize={size}
      fontWeight={weight}
      textAnchor={anchor}
      dominantBaseline="central"
      fill={fill}
    >
      {children}
    </text>
  );
}

const nss = { vectorEffect: "non-scaling-stroke" as const };

// ═════════════════════════════════════════════════════════════════════
// 1. Document generation & filing
// ═════════════════════════════════════════════════════════════════════
const DOC_PERIOD = 4200;

export function DocsScene() {
  const t = useClock(1600);
  return (
    <Scene viewBox="-200 -215 360 290" label="Documents being generated and dropped into Contracts and Proposals folders">
      <FloatingSheet x={-190} y={-40} z={118} t={t} phase={0} />
      <FloatingSheet x={-150} y={-95} z={150} t={t} phase={1.8} />

      <Panel x={-90} y={-50} w={122} h={94} t={6}>
        <rect x={-82} y={70} width={56} height={15} rx={7.5} fill={ACCENT} />
        <WallText u={-54} v={77.5} size={7.5} fill="var(--scene-on-accent)">
          Contracts
        </WallText>
      </Panel>
      <IsoBox x={-90} y={-50} z={94} w={40} d={6} h={7} r={2} />

      {[0, 1, 2].map((i) => (
        <FilingSheet key={i} i={i} t={t} />
      ))}

      <Panel x={-62} y={26} w={128} h={80} t={6}>
        <rect x={4} y={44} width={58} height={16} rx={8} fill={ACCENT} />
        <WallText u={33} v={52} size={7.5} fill="var(--scene-on-accent)">
          Proposals
        </WallText>
      </Panel>
      <IsoBox x={-62} y={26} z={80} w={42} d={6} h={7} r={2} />
    </Scene>
  );
}

function FloatingSheet({ x, y, z, t, phase }: { x: number; y: number; z: number; t: MotionValue<number>; phase: number }) {
  const bob = useTransform(t, (v) => Math.sin(v / 700 + phase) * 4);
  return (
    <motion.g style={{ y: bob }}>
      <IsoBox x={x} y={y} z={z} w={56} d={42} h={2} r={3} strokeWidth={0.9}>
        {[0, 1, 2, 3].map((k) => (
          <line key={k} x1={x + 8} x2={x + (k === 3 ? 34 : 48)} y1={y + 10 + k * 7} y2={y + 10 + k * 7} stroke={LINE} strokeWidth={1.1} strokeLinecap="round" {...nss} />
        ))}
      </IsoBox>
    </motion.g>
  );
}

function FilingSheet({ i, t }: { i: number; t: MotionValue<number> }) {
  const x = -52 + i * 10;
  const y = -32 + i * 16;
  const z = 26;
  const offset = useTransform(t, (v) => {
    const l = mod(v + i * (DOC_PERIOD / 3), DOC_PERIOD);
    const drop = ease(span(l, 300, 1300));
    return -(1 - drop) * 120;
  });
  const opacity = useTransform(t, (v) => {
    const l = mod(v + i * (DOC_PERIOD / 3), DOC_PERIOD);
    return span(l, 0, 300) * (1 - span(l, DOC_PERIOD - 300, DOC_PERIOD));
  });
  return (
    <motion.g style={{ y: offset, opacity }}>
      <Panel x={x} y={y} z={z} w={82} h={68} t={2}>
        {[0, 1, 2, 3, 4].map((k) => (
          <line
            key={k}
            x1={x + 10}
            x2={x + (k === 0 ? 40 : k === 4 ? 50 : 72)}
            y1={z + 56 - k * 9}
            y2={z + 56 - k * 9}
            stroke={k === 0 ? ACCENT : LINE}
            strokeWidth={k === 0 ? 1.8 : 1.2}
            strokeLinecap="round"
            {...nss}
          />
        ))}
      </Panel>
    </motion.g>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 2. Email & Slack workflows
// ═════════════════════════════════════════════════════════════════════
const MAIL_PERIOD = 4000;
const TILE = 66;
const TILE_H = 12;

const tileAt = (sx: number, sy: number) => {
  const [cx, cy] = toWorld(sx, sy, TILE_H);
  return { x: cx - TILE / 2, y: cy - TILE / 2, cx, cy, top: [sx, sy] as Pt };
};
const SLACK = tileAt(20, -62);
const GMAIL = tileAt(-100, 22);
const HUB = tileAt(100, 52);

const ROUTES: { from: Pt; c1: Pt; c2: Pt; to: Pt; at: number }[] = [
  { from: [GMAIL.top[0] + 30, GMAIL.top[1] + 22], c1: [-20, 110], c2: [40, 100], to: [HUB.top[0] - 30, HUB.top[1] + 16], at: 300 },
  { from: [SLACK.top[0] + 36, SLACK.top[1] + 14], c1: [150, -40], c2: [170, 10], to: [HUB.top[0] + 24, HUB.top[1] - 12], at: 1900 },
];
const TRAVEL = 1000;

export function MailScene() {
  const t = useClock(TRAVEL + 400);
  const hubGlow = useTransform(t, (v) => {
    const l = mod(v, MAIL_PERIOD);
    return Math.max(...ROUTES.map((r) => bump(span(l, r.at + TRAVEL - 100, r.at + TRAVEL + 600)))) * 0.75;
  });
  const badge = useTransform(t, (v) => -bump(span(mod(v, MAIL_PERIOD), 0, 400)) * 6);

  return (
    <Scene viewBox="-190 -150 370 270" label="Gmail and Slack events flowing into an automation hub">
      {ROUTES.map((r, i) => (
        <path
          key={i}
          d={`M${r.from[0]} ${r.from[1]}C${r.c1[0]} ${r.c1[1]} ${r.c2[0]} ${r.c2[1]} ${r.to[0]} ${r.to[1]}`}
          fill="none"
          stroke={LINE}
          strokeWidth={1.2}
          strokeDasharray="4 4"
        />
      ))}

      <IsoBox x={SLACK.x} y={SLACK.y} w={TILE} d={TILE} h={TILE_H} r={14}>
        <SlackMark cx={SLACK.cx} cy={SLACK.cy} />
      </IsoBox>
      <IsoBox x={GMAIL.x} y={GMAIL.y} w={TILE} d={TILE} h={TILE_H} r={14}>
        <MailMark cx={GMAIL.cx} cy={GMAIL.cy} />
      </IsoBox>
      <IsoBox x={HUB.x} y={HUB.y} w={TILE} d={TILE} h={TILE_H} r={14}>
        <motion.rect x={HUB.x + 2} y={HUB.y + 2} width={TILE - 4} height={TILE - 4} rx={12} fill={ACCENT_SOFT} style={{ opacity: hubGlow }} />
        <path
          d={`M${HUB.cx} ${HUB.cy - 15}Q${HUB.cx + 2} ${HUB.cy - 2} ${HUB.cx + 15} ${HUB.cy}Q${HUB.cx + 2} ${HUB.cy + 2} ${HUB.cx} ${HUB.cy + 15}Q${HUB.cx - 2} ${HUB.cy + 2} ${HUB.cx - 15} ${HUB.cy}Q${HUB.cx - 2} ${HUB.cy - 2} ${HUB.cx} ${HUB.cy - 15}Z`}
          fill={ACCENT}
        />
        <circle cx={HUB.cx + 11} cy={HUB.cy - 11} r={3} fill={ACCENT} />
      </IsoBox>

      {ROUTES.map((r, i) => (
        <RouteDot key={i} route={r} t={t} />
      ))}

      {/* Notification badge */}
      <motion.g style={{ y: badge }}>
        <circle cx={GMAIL.top[0] + 4} cy={GMAIL.top[1] - 34} r={8.5} fill="var(--danger)" stroke="var(--scene-paper)" strokeWidth={2} />
        <text x={GMAIL.top[0] + 4} y={GMAIL.top[1] - 34} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={700} fill="var(--scene-on-accent)">
          2
        </text>
      </motion.g>
    </Scene>
  );
}

function RouteDot({ route, t }: { route: (typeof ROUTES)[number]; t: MotionValue<number> }) {
  const p = useTransform(t, (v) => ease(span(mod(v, MAIL_PERIOD), route.at, route.at + TRAVEL)));
  const cx = useTransform(p, (k) => cubic(k, route.from, route.c1, route.c2, route.to)[0]);
  const cy = useTransform(p, (k) => cubic(k, route.from, route.c1, route.c2, route.to)[1]);
  const opacity = useTransform(t, (v) => {
    const l = mod(v, MAIL_PERIOD);
    return span(l, route.at - 100, route.at + 50) * (1 - span(l, route.at + TRAVEL, route.at + TRAVEL + 200));
  });
  return (
    <motion.g style={{ opacity }}>
      <motion.circle cx={cx} cy={cy} r={7} fill={ACCENT} opacity={0.2} />
      <motion.circle cx={cx} cy={cy} r={3.5} fill={ACCENT} />
    </motion.g>
  );
}

function SlackMark({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 16} y={cy - 9} width={19} height={6.5} rx={3.25} fill="#36c5f0" />
      <rect x={cx + 2.5} y={cy - 16} width={6.5} height={19} rx={3.25} fill="#2eb67d" />
      <rect x={cx - 3} y={cy + 2.5} width={19} height={6.5} rx={3.25} fill="#ecb22e" />
      <rect x={cx - 9} y={cy - 3} width={6.5} height={19} rx={3.25} fill="#e01e5a" />
    </g>
  );
}

function MailMark({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={`M${cx - 14} ${cy + 11}V${cy - 8}`} stroke="#4285f4" strokeWidth={5.5} />
      <path d={`M${cx + 14} ${cy + 11}V${cy - 8}`} stroke="#34a853" strokeWidth={5.5} />
      <path d={`M${cx - 14} ${cy - 8}L${cx} ${cy + 3}L${cx + 14} ${cy - 8}`} stroke="#ea4335" strokeWidth={5.5} />
      <path d={`M${cx + 14} ${cy - 8}L${cx + 9} ${cy - 4}`} stroke="#fbbc04" strokeWidth={5.5} />
    </g>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 3. CRM & data syncing
// ═════════════════════════════════════════════════════════════════════
const CRM_PERIOD = 4800;
const CHART = { x: -30, y: -92, w: 162, h: 112, t: 4 };
const DONUT = { x: -132, y: -52, w: 80, h: 86, t: 4 };
const DB = { x: -62, y: 52 };

export function CrmScene() {
  const t = useClock(2400);
  const area = useTransform(t, (v) => {
    const ph = v / 900;
    const u0 = CHART.x + 10;
    const u1 = CHART.x + CHART.w - 14;
    const pts: Pt[] = [];
    for (let i = 0; i <= 14; i++) {
      const k = i / 14;
      const val = 30 + 22 * Math.sin(k * 5 + ph) * (0.6 + 0.4 * Math.sin(ph * 0.7)) + 14 * Math.sin(k * 11 - ph * 1.3) + k * 18;
      pts.push([u0 + (u1 - u0) * k, 16 + Math.max(6, val)]);
    }
    const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
    return { line, fill: `${line}L${u1} 16L${u0} 16Z` };
  });
  const areaLine = useTransform(area, (a) => a.line);
  const areaFill = useTransform(area, (a) => a.fill);
  const donut = useTransform(t, (v) => 0.2 + 0.45 * ease(bump(mod(v, CRM_PERIOD) / CRM_PERIOD)));

  const dc = { u: DONUT.x + DONUT.w / 2, v: DONUT.h / 2 + 4 };

  return (
    <Scene viewBox="-200 -230 360 300" label="A database syncing records into dashboards and charts">
      <Panel x={-6} y={-138} w={150} h={124} t={3} />

      <Panel {...CHART}>
        <rect x={CHART.x + 6} y={8} width={CHART.w - 12} height={CHART.h - 16} rx={4} fill="none" stroke={LINE} strokeWidth={1} {...nss} />
        <motion.path d={areaFill} fill={ACCENT} opacity={0.12} />
        <motion.path d={areaLine} fill="none" stroke={ACCENT} strokeWidth={1.6} strokeLinejoin="round" {...nss} />
        <WallText u={CHART.x + 92} v={90} size={11}>
          40%
        </WallText>
        <rect x={CHART.x + 14} y={86} width={10} height={10} rx={2} fill={ACCENT} />
        <rect x={CHART.x + 28} y={89} width={26} height={4} rx={2} fill={ACCENT_SOFT} />
      </Panel>

      <Panel {...DONUT}>
        <circle cx={dc.u} cy={dc.v} r={22} fill="none" stroke="var(--scene-accent-faint)" strokeWidth={10} />
        <motion.circle
          cx={dc.u}
          cy={dc.v}
          r={22}
          fill="none"
          stroke={ACCENT}
          strokeWidth={10}
          transform={`rotate(90 ${dc.u} ${dc.v})`}
          style={{ pathLength: donut }}
        />
      </Panel>

      {/* Database stack */}
      {[0, 1, 2].map((i) => (
        <Cylinder key={i} x={DB.x} y={DB.y} z={i * 17} r={30} h={15} side="var(--scene-paper-recess)" stroke="var(--iso-ink)" />
      ))}
      <IsoBox x={DB.x - 24} y={DB.y - 24} z={51} w={48} d={48} h={12} r={12} {...NAVY_BOX} />

      {[0, 1, 2].map((i) => (
        <Packet key={i} i={i} t={t} />
      ))}
    </Scene>
  );
}

const PACKET_FROM = project(DB.x, DB.y, 72);
const PACKET_TO = project(CHART.x + 30, CHART.y + CHART.t, 70);

function Packet({ i, t }: { i: number; t: MotionValue<number> }) {
  const p = useTransform(t, (v) => mod(v / 1600 + i / 3, 1));
  const x = useTransform(p, (k) => PACKET_FROM[0] + (PACKET_TO[0] - PACKET_FROM[0]) * ease(k));
  const y = useTransform(p, (k) => PACKET_FROM[1] + (PACKET_TO[1] - PACKET_FROM[1]) * ease(k) - Math.sin(k * Math.PI) * 26);
  const opacity = useTransform(p, (k) => bump(k));
  return (
    <motion.g style={{ x, y, opacity }}>
      <rect x={-4} y={-4} width={8} height={8} rx={2} fill={ACCENT} transform="rotate(45)" />
    </motion.g>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 4. Internal approvals
// ═════════════════════════════════════════════════════════════════════
const APPROVAL_PERIOD = 6000;
const STEP = 1200;
const AP_TILE = 58;
const LANES = [
  { y: -150, xs: [-60, 50, 160], color: ACCENT, delay: 0 },
  { y: -40, xs: [-170, -60, 50, 160], color: INK, delay: 700 },
  { y: 70, xs: [-170, -60, 50], color: ACCENT, delay: 1400 },
];

/** Continuous position (in tiles) of the lane's reviewer, or -1 when hidden. */
const laneProgress = (l: number, lane: (typeof LANES)[number]) => {
  const n = lane.xs.length;
  const k = l - 300 - lane.delay;
  if (k < 0) return -1;
  const step = Math.floor(k / STEP);
  if (step >= n - 1) return n - 1;
  return step + ease(clamp01((k - step * STEP) / 600));
};
const laneReset = (l: number) => 1 - span(l, APPROVAL_PERIOD - 500, APPROVAL_PERIOD);

const AP_TILES = LANES.flatMap((lane, li) => lane.xs.map((x, k) => ({ li, k, x, y: lane.y, last: k === lane.xs.length - 1 }))).sort(
  (a, b) => a.x + a.y - (b.x + b.y),
);

export function ApprovalsScene() {
  const t = useClock(APPROVAL_PERIOD - 800);
  return (
    <Scene viewBox="-260 -175 590 290" label="Approval requests moving between reviewers until they are signed off">
      <g transform={topPlane(0)} stroke={LINE} strokeWidth={1} strokeDasharray="4 5" fill="none">
        {LANES.map((lane) => (
          <line key={lane.y} x1={-340} x2={320} y1={lane.y} y2={lane.y} {...nss} />
        ))}
      </g>
      {AP_TILES.map((tile) => (
        <ApprovalTile key={`${tile.li}-${tile.k}`} tile={tile} t={t} />
      ))}
      {LANES.map((lane, i) => (
        <Reviewer key={i} lane={lane} t={t} />
      ))}
    </Scene>
  );
}

function ApprovalTile({ tile, t }: { tile: (typeof AP_TILES)[number]; t: MotionValue<number> }) {
  const lane = LANES[tile.li];
  const lit = useTransform(t, (v) => {
    const l = mod(v, APPROVAL_PERIOD);
    return clamp01((laneProgress(l, lane) - tile.k + 0.35) / 0.35) * laneReset(l);
  });
  const x = tile.x - AP_TILE / 2;
  const y = tile.y - AP_TILE / 2;
  return (
    <IsoBox x={x} y={y} w={AP_TILE} d={AP_TILE} h={8} r={10}>
      <motion.rect x={x} y={y} width={AP_TILE} height={AP_TILE} rx={10} fill={tile.last ? INK : "var(--scene-accent-top)"} style={{ opacity: lit }} />
    </IsoBox>
  );
}

function Reviewer({ lane, t }: { lane: (typeof LANES)[number]; t: MotionValue<number> }) {
  const pos = useTransform(t, (v) => {
    const l = mod(v, APPROVAL_PERIOD);
    const p = Math.max(0, laneProgress(l, lane));
    const i = Math.min(Math.floor(p), lane.xs.length - 2);
    const f = p - i;
    const x = lane.xs[i] + (lane.xs[i + 1] - lane.xs[i]) * f;
    const [sx, sy] = project(x, lane.y, 8);
    return [sx, sy - Math.sin(f * Math.PI) * 16] as Pt;
  });
  const x = useTransform(pos, (p) => p[0]);
  const y = useTransform(pos, (p) => p[1]);
  const opacity = useTransform(t, (v) => {
    const l = mod(v, APPROVAL_PERIOD);
    return span(l, lane.delay, lane.delay + 300) * laneReset(l);
  });
  return (
    <motion.g style={{ x, y, opacity }}>
      <line x1={0} x2={0} y1={-16} y2={0} stroke={lane.color} strokeWidth={1.2} strokeDasharray="2 3" />
      <path d="M-8 -18C-8 -26 -4 -30 0 -30S8 -26 8 -18Z" fill={lane.color} />
      <circle cx={0} cy={-37} r={5.5} fill={lane.color} />
    </motion.g>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 5. HR onboarding & offboarding
// ═════════════════════════════════════════════════════════════════════
const HR_PERIOD = 5600;
const WELCOME = "Welcome!";
const LAPTOP = { x: -40, y: -60, w: 200, d: 150 };
const SCREEN = { x: LAPTOP.x, y: LAPTOP.y - 8, w: LAPTOP.w, h: 152, t: 8, z: 4 };

const card = (sx: number, sy: number, z: number, w = 58, h = 62, t = 5) => {
  const [X, Y] = toWorld(sx, sy, z + h / 2);
  return { x: X - w / 2, y: Y - t, z, w, h, t, sx, sy };
};
const AVATAR = card(-70, -150, 120);
const CHECKLIST = card(-200, -55, 70, 62, 66);
const CHAT = card(150, 30, 30, 54, 54);

export function HrScene() {
  const t = useClock(3600);
  const typed = useTransform(t, (v) => {
    const l = mod(v, HR_PERIOD);
    if (l > HR_PERIOD - 400) return "";
    return WELCOME.slice(0, Math.round(span(l, 400, 1500) * WELCOME.length));
  });
  const fu = SCREEN.x + SCREEN.w / 2;
  const fv = SCREEN.z + SCREEN.h / 2 + 4;

  return (
    <Scene viewBox="-260 -235 480 365" label="A new hire triggering a welcome message, account setup and an onboarding checklist">
      {/* Connectors */}
      <g fill="none" stroke={LINE} strokeWidth={1.2} strokeDasharray="4 4">
        <path d={`M${AVATAR.sx - 34} ${AVATAR.sy + 4}C${AVATAR.sx - 110} ${AVATAR.sy + 10} ${CHECKLIST.sx + 20} ${CHECKLIST.sy - 70} ${CHECKLIST.sx + 10} ${CHECKLIST.sy - 40}`} />
        <path d={`M${AVATAR.sx + 34} ${AVATAR.sy + 10}C${AVATAR.sx + 60} ${AVATAR.sy + 20} ${AVATAR.sx + 70} ${AVATAR.sy + 40} ${AVATAR.sx + 92} ${AVATAR.sy + 46}`} />
      </g>

      {/* Laptop screen */}
      <Panel {...SCREEN}>
        <rect x={SCREEN.x + 10} y={SCREEN.z + 10} width={SCREEN.w - 20} height={SCREEN.h - 20} rx={6} fill="var(--scene-paper)" stroke="var(--scene-stroke-warm)" strokeWidth={1} {...nss} />
        <g transform={`translate(${fu} ${fv}) scale(1 -1)`}>
          <motion.text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize={26} fontWeight={600} fill={INK}>
            {typed}
          </motion.text>
        </g>
      </Panel>

      {/* Laptop base */}
      <IsoBox {...LAPTOP} h={8} r={14}>
        <rect x={LAPTOP.x + 12} y={LAPTOP.y + 10} width={LAPTOP.w - 24} height={62} rx={6} fill="var(--scene-accent-wash)" stroke="var(--scene-accent-line)" strokeWidth={1} {...nss} />
        <rect x={LAPTOP.x + LAPTOP.w / 2 - 34} y={LAPTOP.y + 88} width={68} height={44} rx={6} fill={ACCENT_SOFT} stroke="var(--scene-stroke-warm)" strokeWidth={1} {...nss} />
      </IsoBox>

      <FloatCard c={CHECKLIST} t={t} phase={0.8}>
        {[0, 1, 2].map((i) => (
          <ChecklistRow key={i} i={i} c={CHECKLIST} t={t} />
        ))}
      </FloatCard>

      <FloatCard c={AVATAR} t={t} phase={0}>
        <circle cx={AVATAR.x + AVATAR.w / 2} cy={AVATAR.z + 40} r={9} fill={ACCENT} />
        <path
          d={`M${AVATAR.x + AVATAR.w / 2 - 16} ${AVATAR.z + 14}C${AVATAR.x + AVATAR.w / 2 - 16} ${AVATAR.z + 30} ${AVATAR.x + AVATAR.w / 2 + 16} ${AVATAR.z + 30} ${AVATAR.x + AVATAR.w / 2 + 16} ${AVATAR.z + 14}Z`}
          fill={ACCENT}
        />
      </FloatCard>

      <FloatCard c={CHAT} t={t} phase={2}>
        <rect x={CHAT.x + 12} y={CHAT.z + 18} width={30} height={22} rx={11} fill={INK} />
        <path d={`M${CHAT.x + 18} ${CHAT.z + 22}L${CHAT.x + 12} ${CHAT.z + 12}L${CHAT.x + 26} ${CHAT.z + 19}Z`} fill={INK} />
      </FloatCard>
    </Scene>
  );
}

function FloatCard({ c, t, phase, children }: { c: ReturnType<typeof card>; t: MotionValue<number>; phase: number; children: ReactNode }) {
  const bob = useTransform(t, (v) => Math.sin(v / 800 + phase) * 4);
  return (
    <motion.g style={{ y: bob }}>
      <Panel x={c.x} y={c.y} z={c.z} w={c.w} h={c.h} t={c.t}>
        {children}
      </Panel>
    </motion.g>
  );
}

function ChecklistRow({ i, c, t }: { i: number; c: ReturnType<typeof card>; t: MotionValue<number> }) {
  const v = c.z + c.h - 16 - i * 17;
  const done = useTransform(t, (time) => {
    const l = mod(time, HR_PERIOD);
    return span(l, 1800 + i * 500, 2000 + i * 500) * (1 - span(l, HR_PERIOD - 400, HR_PERIOD));
  });
  const u = c.x + 9;
  return (
    <g>
      <rect x={u} y={v - 5} width={10} height={10} rx={2.5} fill="var(--scene-paper)" stroke="var(--scene-stroke-warm)" strokeWidth={1} {...nss} />
      <motion.g style={{ opacity: done }}>
        <rect x={u} y={v - 5} width={10} height={10} rx={2.5} fill={ACCENT} />
        <path d={`M${u + 2.5} ${v}L${u + 4.5} ${v - 2.5}L${u + 8} ${v + 2.5}`} fill="none" stroke="var(--scene-on-accent)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" {...nss} />
      </motion.g>
      <rect x={u + 15} y={v - 2.5} width={c.w - 32} height={5} rx={2.5} fill={ACCENT_SOFT} />
    </g>
  );
}


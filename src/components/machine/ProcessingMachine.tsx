"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTime,
  useInView,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef } from "react";
import { ApprovedDoc, CarCard, SignedDoc } from "./cards";
import { halfSpaceClip, project, roundedPolygon, topPlane, wallRect, wallX, wallY, type Pt } from "./iso";
import { CoinStack, Cylinder, INK, IsoBox } from "./primitives";
import { cx } from "@/utils/cx";
import { RingMark } from "@/components/brand/Emblem";

// ── Timing ────────────────────────────────────────────────────────────
const STEP = 2600; // ms per conveyor step
const MOVE = 1500; // ms of each step spent moving
const PITCH = 120; // world units between items
const SLOTS = 4;

const easeInOut = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);

function phase(t: number) {
  const n = Math.floor(t / STEP);
  const f = t - n * STEP;
  const e = f < MOVE ? easeInOut(f / MOVE) : 1;
  return { n, e, moving: f < MOVE, f };
}
/** Continuous conveyor progress measured in steps. */
const progress = (t: number) => {
  const { n, e } = phase(t);
  return n + e;
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ── Layout (world units) ─────────────────────────────────────────────
const BASE = { x: 0, y: 0, w: 220, d: 220, h: 10 };
const BODY = { x: 20, y: 20, w: 180, d: 180, z: 10, h: 100 };
const TOP_Z = BODY.z + BODY.h;
const BELT_H = 16;
const LANE = { from: 56, to: 106 }; // cross-axis span of both belts
const BELT_END = 500;
const CARD = { long: 40, short: 34 };

const CLIP_Z = 40;
const MOUTH = { from: LANE.from - 4, to: LANE.to + 4 }; // wall opening span (see Machine)

/**
 * Items are visible in front of the wall plane, but an item already past the
 * plane must only show through the opening: the wall face around it (from the
 * belt top up to CLIP_Z) is cut out with even-odd fill, the opening punched back in.
 */
const beltClip = (axis: "x" | "y", c: number, wallFrom: number, wallTo: number) =>
  halfSpaceClip(axis, c, CLIP_Z) +
  wallRect(axis, c, wallFrom, wallTo, BELT_H, CLIP_Z) +
  wallRect(axis, c, MOUTH.from, MOUTH.to, BELT_H, CLIP_Z);

const CLIP_LEFT = beltClip("y", BODY.y + BODY.d, BODY.x, BODY.x + BODY.w);
const CLIP_RIGHT = beltClip("x", BODY.x + BODY.w, BODY.y, BODY.y + BODY.d);

// Ground footprint (dashed) around base + both belts.
const m = 18;
const FOOTPRINT: Pt[] = [
  [-m, -m],
  [BASE.w + m, -m],
  [BASE.w + m, LANE.from - m],
  [BELT_END + m, LANE.from - m],
  [BELT_END + m, LANE.to + m],
  [BASE.w + m, LANE.to + m],
  [BASE.w + m, BASE.d + m],
  [LANE.to + m, BASE.d + m],
  [LANE.to + m, BELT_END + m],
  [LANE.from - m, BELT_END + m],
  [LANE.from - m, BASE.d + m],
  [-m, BASE.d + m],
];
const PANEL = { x: 262, y: 258, w: 132, d: 72, h: 13 };

export function ProcessingMachine({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { margin: "100px" });
  const reduce = useReducedMotion();
  const live = useTime();
  const still = useMotionValue(STEP + MOVE);
  // Only animate while on screen, so scrolling never has to repaint this scene.
  const t = reduce || !inView ? still : live;

  return (
    <svg
      ref={ref}
      viewBox="-420 -112 840 500"
      className={cx("scene-machine", className)}
      role="img"
      aria-label="Isometric machine processing documents on conveyor belts"
    >
      <defs>
        <clipPath id="clip-left">
          <path d={CLIP_LEFT} clipRule="evenodd" />
        </clipPath>
        <clipPath id="clip-right">
          <path d={CLIP_RIGHT} clipRule="evenodd" />
        </clipPath>
        <filter id="led-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Ground outlines */}
      <g transform={topPlane(0)} fill="none" stroke="var(--iso-dash)" strokeWidth={1} strokeDasharray="5 5">
        <path d={roundedPolygon(FOOTPRINT, 26)} vectorEffect="non-scaling-stroke" />
        <rect
          x={PANEL.x - 16}
          y={PANEL.y - 16}
          width={PANEL.w + 32}
          height={PANEL.d + 32}
          rx={22}
          vectorEffect="non-scaling-stroke"
        />
      </g>

      {/* Base plate + machine */}
      <IsoBox {...BASE} r={24} />
      <Machine t={t} />

      {/* Belts */}
      <Belt axis="y" t={t} />
      <Belt axis="x" t={t} />

      {/* Items riding the belts */}
      <g clipPath="url(#clip-left)">
        {Array.from({ length: SLOTS }, (_, i) => (
          <InputItem key={i} index={i} t={t} />
        ))}
      </g>
      <g clipPath="url(#clip-right)">
        {Array.from({ length: SLOTS }, (_, i) => (
          <OutputItem key={i} index={i} t={t} />
        ))}
      </g>

      <ControlPanel t={t} />
    </svg>
  );
}

// ── Machine ──────────────────────────────────────────────────────────
function Machine({ t }: { t: MotionValue<number> }) {
  const cx = BODY.x + BODY.w / 2;
  const cy = BODY.y + BODY.d / 2;
  const ledOpacity = useTransform(t, (v) => {
    const { moving, f } = phase(v);
    return moving ? 0.55 + 0.45 * Math.sin((f / MOVE) * Math.PI * 6) ** 2 : 0.25;
  });
  const ringGlow = useTransform(t, (v) => {
    const { moving, f } = phase(v);
    return moving ? Math.sin((f / MOVE) * Math.PI) * 0.9 : 0;
  });
  const plateGlow = useTransform(ringGlow, (g) => g * 0.22);
  const [lx, ly] = project(176, 132, TOP_Z);
  return (
    <g>
      <IsoBox {...BODY} r={18}>
        <rect
          x={BODY.x + 7}
          y={BODY.y + 7}
          width={BODY.w - 14}
          height={BODY.d - 14}
          rx={13}
          fill="none"
          stroke="var(--scene-hairline)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        {/* Logo plate */}
        <rect x={cx - 50} y={cy - 50} width={100} height={100} rx={20} fill="var(--scene-accent-soft)" stroke={INK} strokeWidth={1.15} vectorEffect="non-scaling-stroke" />
        <motion.rect
          x={cx - 50}
          y={cy - 50}
          width={100}
          height={100}
          rx={20}
          fill="var(--iso-accent)"
          style={{ opacity: plateGlow }}
        />
        <rect x={cx - 40} y={cy - 40} width={80} height={80} rx={13} fill="var(--scene-paper-tint)" stroke={INK} strokeWidth={1.15} vectorEffect="non-scaling-stroke" />
        {/* Brand mark: concentric rings */}
        <RingMark cx={cx} cy={cy} size={56} fill="var(--iso-accent)" />
        {/* Slot */}
        <rect x={BODY.x + 30} y={BODY.y + BODY.d - 24} width={92} height={7} rx={3.5} fill="var(--scene-paper-recess)" stroke={INK} strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
      </IsoBox>

      {/* Wall openings where the belts enter/exit */}
      <g transform={wallY(BODY.y + BODY.d)}>
        <rect x={MOUTH.from} y={BELT_H} width={MOUTH.to - MOUTH.from} height={34} rx={5} fill="var(--scene-solid)" />
      </g>
      <g transform={wallX(BODY.x + BODY.w)}>
        <rect x={MOUTH.from} y={BELT_H} width={MOUTH.to - MOUTH.from} height={34} rx={5} fill="var(--scene-solid)" />
      </g>

      {/* Bolts */}
      {[
        [BODY.x + 18, BODY.y + 18],
        [BODY.x + BODY.w - 18, BODY.y + 18],
        [BODY.x + 18, BODY.y + BODY.d - 18],
        [BODY.x + BODY.w - 18, BODY.y + BODY.d - 18],
      ].map(([bx, by]) => (
        <Cylinder key={`${bx}-${by}`} x={bx} y={by} z={TOP_Z} r={7} h={4} />
      ))}

      {/* Status LED */}
      <motion.ellipse cx={lx} cy={ly} rx={11} ry={6.5} fill="var(--iso-accent)" filter="url(#led-glow)" style={{ opacity: ledOpacity }} />
      <ellipse cx={lx} cy={ly} rx={5.2} ry={3} fill="var(--scene-accent-led)" stroke="var(--scene-accent-r1)" strokeWidth={0.8} />
      <motion.ellipse cx={lx} cy={ly - 0.5} rx={3.4} ry={1.9} fill="var(--iso-accent)" style={{ opacity: ledOpacity }} />
    </g>
  );
}

// ── Belts ────────────────────────────────────────────────────────────
function Belt({ axis, t }: { axis: "x" | "y"; t: MotionValue<number> }) {
  const start = BODY.x + BODY.w; // same for both since body is square
  const len = BELT_END - start;
  const spacing = 24;
  // Belt surface scrolls in sync with the items.
  const offset = useTransform(t, (v) => (progress(v) * PITCH) % spacing);
  const tx = useTransform(offset, (o) => (axis === "x" ? o : 0));
  const ty = useTransform(offset, (o) => (axis === "y" ? -o : 0));

  const box =
    axis === "y"
      ? { x: LANE.from, y: start, w: LANE.to - LANE.from, d: len }
      : { x: start, y: LANE.from, w: len, d: LANE.to - LANE.from };
  const clipId = `belt-${axis}`;
  const lines = Array.from({ length: Math.ceil(len / spacing) + 2 }, (_, i) => start - spacing + i * spacing);

  return (
    <IsoBox {...box} h={BELT_H} r={4} top="var(--scene-paper-tint)">
      <clipPath id={clipId}>
        <rect x={box.x + 3} y={box.y + 1} width={box.w - 6} height={box.d - 2} />
      </clipPath>
      <rect x={box.x + 4} y={box.y + 2} width={box.w - 8} height={box.d - 4} rx={2} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <g clipPath={`url(#${clipId})`}>
        <motion.g style={{ x: tx, y: ty }}>
          {lines.map((p) =>
            axis === "y" ? (
              <line key={p} x1={box.x + 4} x2={box.x + box.w - 4} y1={p} y2={p} stroke="var(--scene-hairline)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ) : (
              <line key={p} y1={box.y + 4} y2={box.y + box.d - 4} x1={p} x2={p} stroke="var(--scene-hairline)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ),
          )}
        </motion.g>
      </g>
    </IsoBox>
  );
}

// ── Items ────────────────────────────────────────────────────────────
function useSlot(t: MotionValue<number>, index: number) {
  return useTransform(t, (v) => (((progress(v) + index) % SLOTS) + SLOTS) % SLOTS);
}

function InputItem({ index, t }: { index: number; t: MotionValue<number> }) {
  const u = useSlot(t, index);
  // centre y = 590 - 120u → stops at 470, 350, 230 (mouth), then into the machine.
  const x = useTransform(u, (s) => project(0, 590 - PITCH * s)[0]);
  const y = useTransform(u, (s) => project(0, 590 - PITCH * s)[1] + project(0, 0, BELT_H)[1]);
  const opacity = useTransform(u, (s) => clamp01((s - 0.45) / 0.45));
  const cx = LANE.from + (LANE.to - LANE.from - CARD.long) / 2;
  const Comp = index % 2 === 0 ? CarCard : SignedDoc;
  return (
    <motion.g style={{ x, y, opacity }}>
      <Comp x={cx} y={-CARD.short / 2} w={CARD.long} d={CARD.short} />
    </motion.g>
  );
}

function OutputItem({ index, t }: { index: number; t: MotionValue<number> }) {
  const u = useSlot(t, index);
  // centre x = 110 + 120u → emerges at 230, then 350, 470, fades past the belt end.
  const x = useTransform(u, (s) => project(110 + PITCH * s, 0)[0]);
  const y = useTransform(u, (s) => project(110 + PITCH * s, 0)[1] + project(0, 0, BELT_H)[1]);
  const opacity = useTransform(u, (s) => 1 - clamp01((s - 3.2) / 0.45));
  const cy = LANE.from + (LANE.to - LANE.from - CARD.long) / 2;
  return (
    <motion.g style={{ x, y, opacity }}>
      <ApprovedDoc x={-CARD.short / 2} y={cy} w={CARD.short} d={CARD.long} />
    </motion.g>
  );
}

// ── Control panel ────────────────────────────────────────────────────
function ControlPanel({ t }: { t: MotionValue<number> }) {
  const P = PANEL;
  const topZ = P.h;
  const track = { from: P.x + 14, to: P.x + 72 };
  const knob = 15;
  const rows = [P.y + 20, P.y + 46];
  const travel = track.to - track.from - knob;

  const swing = useTransform(t, (v) => {
    const { n, e } = phase(v);
    return n % 2 === 0 ? e : 1 - e;
  });
  const shiftA = useTransform(swing, (s) => project(travel * s, 0));
  const shiftB = useTransform(swing, (s) => project(travel * (1 - s), 0));
  const ax = useTransform(shiftA, (p) => p[0]);
  const ay = useTransform(shiftA, (p) => p[1]);
  const bx = useTransform(shiftB, (p) => p[0]);
  const by = useTransform(shiftB, (p) => p[1]);

  return (
    <g>
      <IsoBox x={P.x} y={P.y} w={P.w} d={P.d} h={P.h} r={12}>
        {rows.map((ry) => (
          <rect
            key={ry}
            x={track.from}
            y={ry - 2.5}
            width={track.to - track.from}
            height={5}
            rx={2.5}
            fill="var(--scene-paper-recess)"
            stroke={INK}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </IsoBox>
      <motion.g style={{ x: ax, y: ay }}>
        <IsoBox
          x={track.from}
          y={rows[0] - knob / 2}
          z={topZ}
          w={knob}
          d={knob}
          h={9}
          r={2.5}
          top="var(--scene-accent-l1)"
          left={["var(--scene-accent-r1)", "var(--scene-accent-deep)"]}
          right={["var(--scene-accent-deeper)", "var(--scene-accent-deep)"]}
        />
      </motion.g>
      <motion.g style={{ x: bx, y: by }}>
        <IsoBox x={track.from} y={rows[1] - knob / 2} z={topZ} w={knob} d={knob} h={9} r={2.5} />
      </motion.g>
      <CoinStack x={P.x + 104} y={P.y + 22} z={topZ} count={3} />
      <CoinStack x={P.x + 100} y={P.y + 50} z={topZ} count={4} />
    </g>
  );
}

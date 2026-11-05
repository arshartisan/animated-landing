"use client";

/**
 * Extra pieces for the service card scenes: extruded flat shapes, gears and
 * cables with a travelling accent segment. Colors are scene tokens only.
 */
import { motion, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import { ACCENT, SOLID, mod } from "./kit";

/** Path for a gear centred on (0, 0), rotated by `angle` radians. */
export function gearPath(r: number, teeth: number, depth: number, hole: number, angle = 0) {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  const rr = [r - depth, r - depth, r, r];
  const off = [0, 0.18, 0.32, 0.68];
  for (let i = 0; i < teeth; i++) {
    const base = angle + i * step;
    // valley → rise → top → fall
    const seq: [number, number][] = [
      [rr[0], base],
      [rr[1], base + step * off[1]],
      [rr[2], base + step * off[2]],
      [rr[3], base + step * off[3]],
      [r - depth, base + step * 0.82],
    ];
    for (const [rad, a] of seq) pts.push(`${(Math.cos(a) * rad).toFixed(2)} ${(Math.sin(a) * rad).toFixed(2)}`);
  }
  const ring = `M${pts.join("L")}Z`;
  const h = `M${hole} 0A${hole} ${hole} 0 1 0 ${-hole} 0A${hole} ${hole} 0 1 0 ${hole} 0Z`;
  return ring + h;
}

/**
 * Flat shape extruded along a plane normal: solid layers from `from` to `to`
 * (plane offsets), then the face drawn on top. `plane(c)` returns a transform.
 */
export function Extrude({
  plane,
  from,
  to,
  step = 2,
  side = SOLID,
  shape,
  face,
}: {
  plane: (c: number) => string;
  from: number;
  to: number;
  step?: number;
  side?: string;
  /** Silhouette, rendered with the given fill (layers) */
  shape: (fill: string) => ReactNode;
  /** Front face, drawn on plane `to` */
  face: ReactNode;
}) {
  const n = Math.max(1, Math.round(Math.abs(to - from) / step));
  const layers = Array.from({ length: n }, (_, i) => from + ((to - from) * i) / n);
  return (
    <g>
      {layers.map((c) => (
        <g key={c} transform={plane(c)}>
          {shape(side)}
        </g>
      ))}
      <g transform={plane(to)}>{face}</g>
    </g>
  );
}

/** A spinning gear standing in a wall plane, with an extruded rim. */
export function SpinGear({
  plane,
  from,
  to,
  cx,
  cy,
  r,
  teeth,
  hole,
  t,
  speed,
  fill,
  stroke,
}: {
  plane: (c: number) => string;
  from: number;
  to: number;
  cx: number;
  cy: number;
  r: number;
  teeth: number;
  hole: number;
  t: MotionValue<number>;
  /** radians per ms (negative spins the other way) */
  speed: number;
  fill: string;
  stroke: string;
}) {
  const d = useTransform(t, (v) => gearPath(r, teeth, r * 0.2, hole, v * speed));
  return (
    <Extrude
      plane={plane}
      from={from}
      to={to}
      shape={(f) => (
        <motion.path d={d} transform={`translate(${cx} ${cy})`} fill={f} fillRule="evenodd" />
      )}
      face={
        <motion.path
          d={d}
          transform={`translate(${cx} ${cy})`}
          fill={fill}
          fillRule="evenodd"
          stroke={stroke}
          strokeWidth={1.2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      }
    />
  );
}

/** Thick cable (screen-space path) with a lit segment that runs along it. */
export function Cable({ d, t, period = 2600, phase = 0, width = 6, length = 600 }: { d: string; t: MotionValue<number>; period?: number; phase?: number; width?: number; length?: number }) {
  const offset = useTransform(t, (v) => -mod(v / period + phase, 1) * length);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={SOLID} strokeWidth={width} />
      <motion.path d={d} stroke={ACCENT} strokeWidth={width - 2} strokeDasharray={`22 ${length}`} style={{ strokeDashoffset: offset }} />
    </g>
  );
}

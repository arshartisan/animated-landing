import { useId, type ReactNode } from "react";
import { S, hull, project, roundedRectPoints, toPath, topPlane } from "./iso";

export const INK = "var(--iso-ink)";
const STROKE = 1.15;

type BoxProps = {
  x: number;
  y: number;
  z?: number;
  w: number; // extent along x
  d: number; // extent along y
  h: number; // extent along z
  r?: number;
  top?: string;
  left?: [string, string]; // +y facing wall gradient (screen lower-left)
  right?: [string, string]; // +x facing wall gradient (screen lower-right)
  stroke?: string;
  strokeWidth?: number;
  children?: ReactNode; // drawn on the top face, in top-plane local coords
};

/** A rounded box extruded in isometric space. */
export function IsoBox({
  x,
  y,
  z = 0,
  w,
  d,
  h,
  r = 6,
  top = "var(--iso-top)",
  left = ["var(--iso-wall-l1)", "var(--iso-wall-l2)"],
  right = ["var(--iso-wall-r1)", "var(--iso-wall-r2)"],
  stroke = INK,
  strokeWidth = STROKE,
  children,
}: BoxProps) {
  const id = useId().replace(/:/g, "");
  const outline = roundedRectPoints(x, y, w, d, r);
  const pts = [
    ...outline.map(([px, py]) => project(px, py, z)),
    ...outline.map(([px, py]) => project(px, py, z + h)),
  ];
  const side = hull(pts);
  const xs = side.map((p) => p[0]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const split = (x + w - (y + d)) * S; // front corner, screen x
  const soft = r * S;
  const at = (v: number) => Math.min(1, Math.max(0, (v - minX) / (maxX - minX || 1)));

  return (
    <g>
      <defs>
        <linearGradient id={`g${id}`} gradientUnits="userSpaceOnUse" x1={minX} x2={maxX} y1={0} y2={0}>
          <stop offset={0} stopColor={left[0]} />
          <stop offset={at(split - soft)} stopColor={left[1]} />
          <stop offset={at(split + soft)} stopColor={right[0]} />
          <stop offset={1} stopColor={right[1]} />
        </linearGradient>
      </defs>
      <path d={toPath(side)} fill={`url(#g${id})`} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <g transform={topPlane(z + h)}>
        <rect
          x={x}
          y={y}
          width={w}
          height={d}
          rx={r}
          fill={top}
          stroke={stroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
        {children}
      </g>
    </g>
  );
}

type CylProps = {
  x: number;
  y: number;
  z?: number;
  r: number;
  h: number;
  top?: string;
  side?: string;
  stroke?: string;
};

/** Vertical cylinder. Its projected outline is an axis-aligned ellipse. */
export function Cylinder({ x, y, z = 0, r, h, top = "var(--iso-top)", side = "var(--iso-wall-r1)", stroke = INK }: CylProps) {
  const rx = r * Math.SQRT2 * S;
  const ry = r * Math.SQRT1_2;
  const [cx, cyB] = project(x, y, z);
  const cyT = cyB - h;
  const body = `M${cx - rx} ${cyT}L${cx - rx} ${cyB}A${rx} ${ry} 0 0 0 ${cx + rx} ${cyB}L${cx + rx} ${cyT}Z`;
  return (
    <g>
      <path d={body} fill={side} stroke={stroke} strokeWidth={STROKE} strokeLinejoin="round" />
      <ellipse cx={cx} cy={cyT} rx={rx} ry={ry} fill={top} stroke={stroke} strokeWidth={STROKE} />
    </g>
  );
}

/** Stack of coins. */
export function CoinStack({ x, y, z = 0, count }: { x: number; y: number; z?: number; count: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <Cylinder key={i} x={x} y={y} z={z + i * 4} r={11} h={4} />
      ))}
    </g>
  );
}

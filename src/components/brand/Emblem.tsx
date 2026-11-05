import type { CSSProperties } from "react";
import { cx } from "@/utils/cx";

const PATHS = [
  "M853.82 236.49L717.4 157.73V395L648.31 434.91L425 563.81L239.15 671.1V907.86L273.38 927.68L443.65 1026H443.73L887.46 769.79V255.89L853.82 236.49ZM717.4 671.32L648.31 711.23L425 840.16V760.44L648.31 631.51L717.4 591.6V671.32Z",
  "M614.51 98.32L425 207.74L239.15 315.04L170.06 354.9L0 453.11V256.47L170.06 158.26L239.15 118.41L425 11.11L444.23 0L614.51 98.32Z",
  "M648.31 158.53V355.16L425 484.09L239.15 591.39L170.06 631.25L0 729.46V532.82L170.06 434.61L239.15 394.75L425 287.46L648.31 158.53Z",
  "M170.06 710.96V868L34.0698 789.51L170.06 710.96Z",
];
const W = 888;
const H = 1026;

/**
 * Brand emblem, filled with the `--emblem` token (brand orange in both themes).
 */
export function Emblem({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 888 1026"
      className={cx("h-auto shrink-0", className)}
      fill="var(--emblem)"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/**
 * The emblem as an SVG fragment for use inside illustrations: centred on
 * (cx, cy), `size` units tall. `rotate` lets a decal on an isometric top
 * plane read upright on screen (-45 for the scenes' top planes).
 */
export function EmblemMark({
  cx = 0,
  cy = 0,
  size,
  fill,
  rotate = -45,
  opacity,
  style,
}: {
  cx?: number;
  cy?: number;
  size: number;
  fill: string;
  rotate?: number;
  opacity?: number;
  style?: CSSProperties;
}) {
  const k = size / H;
  return (
    <g
      transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${k}) translate(${-W / 2} ${-H / 2})`}
      fill={fill}
      opacity={opacity}
      style={style}
    >
      {PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
}

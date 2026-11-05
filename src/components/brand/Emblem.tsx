import { cx } from "@/utils/cx";

/**
 * Brand mark: two concentric rings and a dot, in the `--emblem` token
 * (brand orange in both themes).
 */
export function Emblem({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cx("h-auto shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <circle cx="16" cy="16" r="14" fill="none" stroke="var(--emblem)" strokeWidth="3" />
      <circle cx="16" cy="16" r="8" fill="none" stroke="var(--emblem)" strokeWidth="3" />
      <circle cx="16" cy="16" r="3" fill="var(--emblem)" />
    </svg>
  );
}

/**
 * The rounded ring mark used on the scene plates: two concentric rings and a
 * dot, centred on (cx, cy). `size` is the outer diameter.
 */
export function RingMark({
  cx = 0,
  cy = 0,
  size,
  fill,
}: {
  cx?: number;
  cy?: number;
  size: number;
  fill: string;
}) {
  const k = size / 56; // proportions of the original 56-unit mark
  return (
    <g fill="none" stroke={fill} strokeWidth={6 * k}>
      <circle cx={cx} cy={cy} r={25 * k} />
      <circle cx={cx} cy={cy} r={13.5 * k} />
      <circle cx={cx} cy={cy} r={4.5 * k} fill={fill} stroke="none" />
    </g>
  );
}

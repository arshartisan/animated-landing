import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/utils/cx";

type StarBorderProps = {
  children: ReactNode;
  className?: string;
  /** Any CSS color; defaults to the brand primary. */
  color?: string;
  /** Duration of one sweep, e.g. "6s". */
  speed?: string;
  /** Ring thickness in px. */
  thickness?: number;
};

/**
 * Wraps a pill button with a thin ring that two "stars" of light sweep across
 * (React Bits Star Border). The wrapped element keeps its own styles and focus ring.
 */
export function StarBorder({ children, className, color, speed, thickness }: StarBorderProps) {
  const style = {
    ...(color && { "--star-color": color }),
    ...(speed && { "--star-speed": speed }),
    ...(thickness !== undefined && { "--star-thickness": `${thickness}px` }),
  } as CSSProperties;
  return (
    <span className={cx("star-border", className)} style={style}>
      <span aria-hidden className="star-border-glow" data-edge="bottom" />
      <span aria-hidden className="star-border-glow" data-edge="top" />
      {children}
    </span>
  );
}

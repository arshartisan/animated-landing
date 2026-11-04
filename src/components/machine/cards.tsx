import { IsoBox, INK } from "./primitives";

type CardProps = { x: number; y: number; w: number; d: number; z?: number };

const lineProps = {
  stroke: "var(--iso-line)",
  strokeWidth: 1.1,
  strokeLinecap: "round" as const,
  vectorEffect: "non-scaling-stroke" as const,
};

/** Sheets of paper stacked on top of each other. Returns the top z. */
function Sheets({ x, y, w, d, z = 0, count = 3, children }: CardProps & { count?: number; children?: React.ReactNode }) {
  const sheet = 2.6;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <IsoBox
          key={i}
          x={x}
          y={y}
          z={z + i * sheet}
          w={w}
          d={d}
          h={sheet}
          r={2.5}
          strokeWidth={0.9}
        >
          {i === count - 1 ? children : null}
        </IsoBox>
      ))}
    </g>
  );
}

function TextLines({ x, y, w, from = 0 }: { x: number; y: number; w: number; from?: number }) {
  return (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={x + from} x2={x + w - (i === 3 ? 10 : 0)} y1={y + i * 4.2} y2={y + i * 4.2} {...lineProps} />
      ))}
    </g>
  );
}

export function CarCard({ x, y, w, d, z = 0 }: CardProps) {
  const cx = x + w / 2;
  const cy = y + d / 2 + 2;
  return (
    <IsoBox x={x} y={y} z={z} w={w} d={d} h={5} r={4}>
      <rect x={x + 3} y={y + 3} width={w - 6} height={d - 6} rx={2.5} fill="none" stroke="var(--iso-line)" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
      <path
        d={`M${cx - 13} ${cy + 3}v-5l5-1.2 4.5-5h9l5 5 2.5.8v5.4`}
        fill="none"
        stroke={INK}
        strokeWidth={1.2}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <line x1={cx - 3} x2={cx + 3} y1={cy + 3} y2={cy + 3} stroke={INK} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      <circle cx={cx - 7} cy={cy + 3} r={2.6} fill="var(--iso-top)" stroke={INK} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      <circle cx={cx + 8} cy={cy + 3} r={2.6} fill="var(--iso-top)" stroke={INK} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      <line x1={cx - 1} x2={cx - 1} y1={cy - 2} y2={cy - 6} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
    </IsoBox>
  );
}

export function SignedDoc({ x, y, w, d, z = 0 }: CardProps) {
  return (
    <Sheets x={x} y={y} w={w} d={d} z={z}>
      <TextLines x={x + 14} y={y + 6} w={w - 19} />
      <path
        d={`M${x + 5} ${y + d - 8}c1.5-3 2.5-3 3 0s1.5 3 3 0 2.5-3 3 0`}
        fill="none"
        stroke={INK}
        strokeWidth={1.2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </Sheets>
  );
}

export function ApprovedDoc({ x, y, w, d, z = 0 }: CardProps) {
  const bx = x + 5;
  const by = y + d - 15;
  return (
    <Sheets x={x} y={y} w={w} d={d} z={z}>
      <TextLines x={x + 6} y={y + 5} w={w - 11} from={8} />
      <rect x={bx} y={by} width={13} height={10} rx={2} fill="var(--iso-accent)" stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <path
        d={`M${bx + 3.5} ${by + 5}l2.4 2.2 4-4.6`}
        fill="none"
        stroke="#fff"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </Sheets>
  );
}

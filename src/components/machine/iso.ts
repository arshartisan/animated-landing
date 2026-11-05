// Isometric projection helpers.
// World axes: +x goes screen down-right, +y goes screen down-left, +z goes up.
export const S = Math.cos(Math.PI / 6); // ≈ 0.866

export type Pt = [number, number];

export const project = (x: number, y: number, z = 0): Pt => [
  (x - y) * S,
  (x + y) * 0.5 - z,
];

/** Screen-space offset produced by moving dx/dy/dz in world space. */
export const delta = (dx: number, dy: number, dz = 0): Pt => project(dx, dy, dz);

/** SVG transform that maps local 2D coords (x, y) onto the horizontal plane at height z. */
export const topPlane = (z: number) => `matrix(${S} 0.5 ${-S} 0.5 0 ${-z})`;

/** Wall facing +y at y = c. Local coords: (u = world x, v = world z), v drawn upward. */
export const wallY = (c: number) => `matrix(${S} 0.5 0 -1 ${-c * S} ${c * 0.5})`;

/** Wall facing +x at x = c. Local coords: (u = world y, v = world z), v drawn upward. */
export const wallX = (c: number) => `matrix(${-S} 0.5 0 -1 ${c * S} ${c * 0.5})`;

/** Sample a rounded rectangle's outline in the xy plane. */
export function roundedRectPoints(
  x: number,
  y: number,
  w: number,
  d: number,
  r: number,
  seg = 6,
): Pt[] {
  r = Math.min(r, w / 2, d / 2);
  const corners: [number, number, number][] = [
    [x + w - r, y + r, -Math.PI / 2],
    [x + w - r, y + d - r, 0],
    [x + r, y + d - r, Math.PI / 2],
    [x + r, y + r, Math.PI],
  ];
  const pts: Pt[] = [];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  return pts;
}

/** Andrew's monotone chain convex hull. */
export function hull(points: Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0)
      lower.pop();
    lower.push(pt);
  }
  const upper: Pt[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const pt = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0)
      upper.pop();
    upper.push(pt);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

export const toPath = (pts: Pt[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join("") + "Z";

/** Rounded polygon path (works for concave corners) using quadratic corners. */
export function roundedPolygon(pts: Pt[], r: number): string {
  const n = pts.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const v1: Pt = [prev[0] - cur[0], prev[1] - cur[1]];
    const v2: Pt = [next[0] - cur[0], next[1] - cur[1]];
    const l1 = Math.hypot(...v1);
    const l2 = Math.hypot(...v2);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const a: Pt = [cur[0] + (v1[0] / l1) * rr, cur[1] + (v1[1] / l1) * rr];
    const b: Pt = [cur[0] + (v2[0] / l2) * rr, cur[1] + (v2[1] / l2) * rr];
    d += `${i ? "L" : "M"}${a[0]} ${a[1]}Q${cur[0]} ${cur[1]} ${b[0]} ${b[1]}`;
  }
  return d + "Z";
}

/** Screen-space clip polygon for the half space of world points with axis >= value. */
export function halfSpaceClip(axis: "x" | "y", value: number, zMax = 120): string {
  const far = 2000;
  const corners: Pt[] =
    axis === "y"
      ? [
          [-far, value],
          [far, value],
          [far, far],
          [-far, far],
        ]
      : [
          [value, -far],
          [far, -far],
          [far, far],
          [value, far],
        ];
  const pts = corners.flatMap(([x, y]) => [project(x, y, 0), project(x, y, zMax)]);
  return toPath(hull(pts));
}

/** Screen-space outline of an axis-aligned rectangle lying on the wall plane `axis = c`
 * (u runs along the other ground axis, z is height). */
export function wallRect(axis: "x" | "y", c: number, u0: number, u1: number, z0: number, z1: number): string {
  const at = (u: number, z: number) => (axis === "y" ? project(u, c, z) : project(c, u, z));
  return toPath([at(u0, z0), at(u1, z0), at(u1, z1), at(u0, z1)]);
}

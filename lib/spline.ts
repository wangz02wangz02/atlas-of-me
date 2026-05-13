/**
 * Convert a sequence of (x, y) screen-space points into a single SVG path
 * using a Catmull-Rom-derived cubic Bezier spline.  Cubic Beziers produced
 * this way share tangents at the shared endpoint of consecutive segments
 * (C1 continuity), so the resulting curve glides smoothly through every
 * point — no triangle-y corners at the stops.
 *
 * For pts.length < 2 → empty string.
 * For pts.length === 2 → straight `M..L..` line.
 */
export function catmullRomPath(pts: Array<[number, number]>): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) {
    return `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)} L${pts[1][0].toFixed(2)},${pts[1][1].toFixed(2)}`;
  }
  const out: string[] = [`M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    out.push(
      `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`,
    );
  }
  return out.join(" ");
}

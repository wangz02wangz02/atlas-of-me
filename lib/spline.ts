/**
 * Convert a sequence of (x, y) screen-space points into a single SVG path
 * using a Catmull-Rom-derived cubic Bezier spline.  Cubic Beziers produced
 * this way share tangents at the shared endpoint of consecutive segments
 * (C1 continuity), so the resulting curve glides smoothly through every
 * point — no triangle-y corners at the stops.
 *
 * Consecutive identical points are deduped before the spline runs.  Without
 * this, callers that build their input by concatenating per-leg
 * interpolations (where the join is `[…, leg.to, leg.from, …]` with
 * leg.to == leg.from) feed two identical points to the algorithm, which
 * collapses the tangent calculation and produces a visible kink at every
 * city junction.
 *
 * For pts.length < 2 → empty string.
 * For pts.length === 2 → straight `M..L..` line.
 */
export function catmullRomPath(pts: Array<[number, number]>): string {
  // Dedupe consecutive identical (or near-identical) points.
  const cleaned: Array<[number, number]> = [];
  const EPS = 0.25;
  for (const p of pts) {
    const last = cleaned[cleaned.length - 1];
    if (last && Math.abs(p[0] - last[0]) < EPS && Math.abs(p[1] - last[1]) < EPS) {
      continue;
    }
    cleaned.push(p);
  }
  if (cleaned.length < 2) return "";
  if (cleaned.length === 2) {
    return `M${cleaned[0][0].toFixed(2)},${cleaned[0][1].toFixed(2)} L${cleaned[1][0].toFixed(2)},${cleaned[1][1].toFixed(2)}`;
  }
  const out: string[] = [
    `M${cleaned[0][0].toFixed(2)},${cleaned[0][1].toFixed(2)}`,
  ];
  for (let i = 0; i < cleaned.length - 1; i++) {
    const p0 = cleaned[i - 1] ?? cleaned[i];
    const p1 = cleaned[i];
    const p2 = cleaned[i + 1];
    const p3 = cleaned[i + 2] ?? cleaned[i + 1];
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

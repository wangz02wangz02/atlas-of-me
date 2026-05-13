/**
 * Constellation matcher.
 *
 * Compares the chronological shape of the traveler's journey against a curated
 * set of well-known IAU constellations and returns the closest match, with a
 * short blurb to read aloud.
 *
 * The matcher does *not* try to be astronomically accurate — it normalizes
 * both shapes to a unit square, resamples to a common point count, finds the
 * optimal rotation (and reflection) via 2-D orthogonal Procrustes, then
 * scores by residual sum-of-squares.  Lower = better match.
 *
 * The curated set covers the zodiac (12) + a roster of bright, recognizable
 * northern and southern constellations (≈30 total).  Plenty for the user to
 * get a fun, plausible reveal even though the IAU recognizes 88.
 */

export type Constellation = {
  name: string;
  abbr: string;
  /** Asterism stars in line-figure order, normalized to roughly [-1, 1]^2.
   *  +x = right (east-ish), +y = up (north-ish). */
  shape: [number, number][];
  zodiac: boolean;
  /** A short, evocative blurb to read on the reveal. */
  story: string;
};

// Shapes are eyeballed approximations of each asterism's pattern.  Not RA/Dec —
// we're matching by silhouette, not stellar position.
const C: Constellation[] = [
  // ---- Zodiac (12) ----
  {
    name: "Aries",
    abbr: "Ari",
    zodiac: true,
    shape: [
      [-1, 0.2],
      [-0.3, 0.4],
      [0.4, 0],
      [1, -0.4],
    ],
    story:
      "The ram with the golden fleece. A small, modest curve in the sky that gave its name to the equinox.",
  },
  {
    name: "Taurus",
    abbr: "Tau",
    zodiac: true,
    shape: [
      [-1, 0.5],
      [-0.4, 0.1],
      [0, -0.2],
      [0.4, 0.1],
      [1, 0.5],
      [0.1, -0.2],
      [0.6, -0.8],
    ],
    story:
      "The bull — and the V of the Hyades for his face, with red Aldebaran as his angry eye.",
  },
  {
    name: "Gemini",
    abbr: "Gem",
    zodiac: true,
    shape: [
      [-0.8, 1],
      [-0.6, 0],
      [-0.4, -1],
      [0.4, 1],
      [0.6, 0],
      [0.8, -1],
    ],
    story:
      "The twins, Castor and Pollux — parallel lives, parallel stars, hand in hand across the sky.",
  },
  {
    name: "Cancer",
    abbr: "Cnc",
    zodiac: true,
    shape: [
      [-0.6, 0.6],
      [0, 0.1],
      [0.6, 0.6],
      [0, -0.7],
    ],
    story:
      "The crab who pinched Heracles. Faintest of the zodiac — you almost have to know it's there to see it.",
  },
  {
    name: "Leo",
    abbr: "Leo",
    zodiac: true,
    shape: [
      [-1, 0.6],
      [-0.6, 0.8],
      [-0.3, 0.4],
      [-0.5, 0],
      [-0.1, -0.2],
      [0.6, 0],
      [1, 0.3],
    ],
    story:
      "The lion. The 'Sickle' is his head, the triangle his haunch. A regal arc, sleeping on its back.",
  },
  {
    name: "Virgo",
    abbr: "Vir",
    zodiac: true,
    shape: [
      [-1, 0.6],
      [-0.4, 0.2],
      [0, -0.2],
      [0.4, -0.5],
      [1, -0.4],
      [-0.3, -0.7],
    ],
    story:
      "The maiden with a sheaf of wheat — Spica, the bright star at her hand, is her promise of harvest.",
  },
  {
    name: "Libra",
    abbr: "Lib",
    zodiac: true,
    shape: [
      [-0.7, 0.4],
      [0, 0.7],
      [0.7, 0.4],
      [0, -0.6],
    ],
    story:
      "The scales of justice. Once the claws of the scorpion, until Rome decided balance mattered more.",
  },
  {
    name: "Scorpius",
    abbr: "Sco",
    zodiac: true,
    shape: [
      [-1, 0.6],
      [-0.6, 0.2],
      [-0.2, 0],
      [0.2, -0.2],
      [0.6, -0.5],
      [0.8, -0.9],
      [0.4, -1],
      [0, -0.7],
    ],
    story:
      "The scorpion that stung Orion — they share the sky but never the season. Antares is its red heart.",
  },
  {
    name: "Sagittarius",
    abbr: "Sgr",
    zodiac: true,
    shape: [
      [-0.9, 0.3],
      [-0.4, 0.6],
      [0, 0.4],
      [0.4, 0.6],
      [0.7, 0.2],
      [0.4, -0.2],
      [0, -0.5],
      [-0.4, -0.2],
    ],
    story:
      "The archer — drawn as a teapot in modern eyes. Aim for the galactic center; that's where its arrow points.",
  },
  {
    name: "Capricornus",
    abbr: "Cap",
    zodiac: true,
    shape: [
      [-0.9, 0.4],
      [-0.4, 0.5],
      [0.2, 0.3],
      [0.7, 0],
      [0.5, -0.5],
      [-0.2, -0.4],
      [-0.7, -0.1],
    ],
    story:
      "The sea-goat — half goat, half fish, all mystery. A triangular smile low above the horizon.",
  },
  {
    name: "Aquarius",
    abbr: "Aqr",
    zodiac: true,
    shape: [
      [-1, 0.6],
      [-0.4, 0.4],
      [0, 0],
      [0.4, -0.4],
      [0.8, -0.8],
      [0.2, -0.7],
      [-0.6, -0.5],
    ],
    story:
      "The water-bearer, pouring an endless stream onto the southern fish. The age that everyone keeps insisting we're entering.",
  },
  {
    name: "Pisces",
    abbr: "Psc",
    zodiac: true,
    shape: [
      [-1, 0.5],
      [-0.5, 0.2],
      [0, 0],
      [0.5, -0.2],
      [1, -0.5],
      [0.4, -0.6],
      [-0.4, 0.6],
    ],
    story:
      "Two fish tied by a cord — they swim in opposite directions but never apart. Pisces stretches further across the sky than you'd expect.",
  },

  // ---- Famous non-zodiac ----
  {
    name: "Orion",
    abbr: "Ori",
    zodiac: false,
    shape: [
      [-0.6, 1],
      [0.6, 0.9],
      [0.3, 0],
      [0, 0],
      [-0.3, 0],
      [-0.7, -1],
      [0.7, -1],
    ],
    story:
      "The hunter. His belt of three stars points one way to Sirius, the other to the Pleiades — a sky-map written in the brightest stars we have.",
  },
  {
    name: "Ursa Major",
    abbr: "UMa",
    zodiac: false,
    shape: [
      [-1, 0.2],
      [-0.5, 0.4],
      [0, 0.4],
      [0.4, 0.6],
      [0.5, 0],
      [0, -0.2],
      [-0.5, -0.2],
    ],
    story:
      "The Great Bear, but really: the Big Dipper. Follow the arc to Arcturus, then spike on to Spica.",
  },
  {
    name: "Ursa Minor",
    abbr: "UMi",
    zodiac: false,
    shape: [
      [-0.8, 1],
      [-0.2, 0.7],
      [0.3, 0.4],
      [0.6, 0],
      [0.4, -0.5],
      [-0.1, -0.6],
    ],
    story:
      "The Little Dipper. Polaris at the tip of the handle has been the still point of the sky for centuries.",
  },
  {
    name: "Cassiopeia",
    abbr: "Cas",
    zodiac: false,
    shape: [
      [-1, 0],
      [-0.5, 0.7],
      [0, 0],
      [0.5, 0.7],
      [1, 0],
    ],
    story:
      "The vain queen, condemned to spin upside-down around the pole for half the year. Her W (or M) is unmistakable.",
  },
  {
    name: "Cygnus",
    abbr: "Cyg",
    zodiac: false,
    shape: [
      [0, 1],
      [0, 0.3],
      [-0.8, 0],
      [0, 0],
      [0.8, 0],
      [0, -1],
    ],
    story:
      "The swan flying along the Milky Way. Northern hemisphere observers know it as the Northern Cross.",
  },
  {
    name: "Lyra",
    abbr: "Lyr",
    zodiac: false,
    shape: [
      [-0.3, 1],
      [-0.5, 0.2],
      [0.5, 0.2],
      [-0.4, -0.5],
      [0.4, -0.5],
    ],
    story:
      "The lyre — Orpheus's instrument. Vega, its brightest star, will be the pole star 12,000 years from now.",
  },
  {
    name: "Aquila",
    abbr: "Aql",
    zodiac: false,
    shape: [
      [-1, 0],
      [-0.3, 0.4],
      [0, 0.2],
      [0.3, 0.4],
      [1, 0],
      [0, -0.5],
    ],
    story:
      "The eagle that carried Zeus's thunderbolts. Altair, in the center, is one of the closest bright stars to Earth.",
  },
  {
    name: "Pegasus",
    abbr: "Peg",
    zodiac: false,
    shape: [
      [-0.8, 0.8],
      [0.8, 0.8],
      [0.8, -0.8],
      [-0.8, -0.8],
      [-0.8, 0.8],
    ],
    story:
      "The winged horse — recognizable as a Great Square hanging in the autumn sky.",
  },
  {
    name: "Andromeda",
    abbr: "And",
    zodiac: false,
    shape: [
      [-1, 0.5],
      [-0.3, 0.6],
      [0.3, 0.4],
      [0.8, 0.2],
      [1, -0.3],
    ],
    story:
      "The chained princess — and home to the nearest spiral galaxy you can see with your naked eye on a dark night.",
  },
  {
    name: "Perseus",
    abbr: "Per",
    zodiac: false,
    shape: [
      [-0.6, 1],
      [-0.3, 0.3],
      [0, -0.2],
      [0.4, -0.6],
      [0.7, -1],
      [-0.2, -0.5],
    ],
    story:
      "The hero who rescued Andromeda from Cetus. Algol, his demon star, dims every three days — a wink from Medusa's severed head.",
  },
  {
    name: "Boötes",
    abbr: "Boo",
    zodiac: false,
    shape: [
      [0, 1],
      [-0.6, 0.4],
      [-0.3, -0.4],
      [0.3, -0.4],
      [0.6, 0.4],
      [0, 1],
    ],
    story:
      "The herdsman, a kite of stars. Arcturus, his orange anchor, is the fourth brightest star in the night sky.",
  },
  {
    name: "Hercules",
    abbr: "Her",
    zodiac: false,
    shape: [
      [-0.6, 1],
      [-0.5, 0.2],
      [0.5, 0.2],
      [0.6, 1],
      [-0.7, -0.5],
      [0.7, -0.5],
    ],
    story:
      "The hero of twelve labors — the Keystone in his torso holds M13, one of the finest globular clusters in the sky.",
  },
  {
    name: "Auriga",
    abbr: "Aur",
    zodiac: false,
    shape: [
      [0, 1],
      [-0.9, 0.3],
      [-0.5, -0.7],
      [0.5, -0.7],
      [0.9, 0.3],
      [0, 1],
    ],
    story:
      "The charioteer — a pentagon high overhead in winter, with golden Capella nearly straight up.",
  },
  {
    name: "Canis Major",
    abbr: "CMa",
    zodiac: false,
    shape: [
      [-0.5, 0.8],
      [0, 0.2],
      [0.5, 0],
      [0.3, -0.7],
      [-0.5, -0.5],
    ],
    story:
      "Orion's larger dog. Sirius — the brightest star in the night sky — is its collar tag.",
  },
  {
    name: "Corona Borealis",
    abbr: "CrB",
    zodiac: false,
    shape: [
      [-1, 0],
      [-0.6, 0.5],
      [0, 0.7],
      [0.6, 0.5],
      [1, 0],
    ],
    story:
      "The Northern Crown — a tidy arc of stars sometimes called the Cup of Wine or the Crown of Ariadne.",
  },
  {
    name: "Hydra",
    abbr: "Hya",
    zodiac: false,
    shape: [
      [-1, 0.5],
      [-0.7, 0.3],
      [-0.4, 0.4],
      [-0.1, 0.1],
      [0.2, -0.1],
      [0.5, 0],
      [0.7, -0.4],
      [1, -0.5],
    ],
    story:
      "The water snake. The longest constellation in the sky — your eye has to crawl from spring all the way to summer.",
  },
  {
    name: "Draco",
    abbr: "Dra",
    zodiac: false,
    shape: [
      [-1, 1],
      [-0.6, 0.6],
      [-0.2, 0.3],
      [0.2, 0],
      [0.6, -0.3],
      [0.4, -0.7],
      [-0.1, -0.6],
      [-0.4, -0.3],
    ],
    story:
      "The dragon coiling around the pole. Thuban, mid-tail, was the pole star when the pyramids were built.",
  },
];

export const CONSTELLATIONS = C;

// ----- shape utilities -----

type P = [number, number];

function polylineLength(pts: P[]): number {
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    total += Math.hypot(x2 - x1, y2 - y1);
  }
  return total;
}

/** Resample a polyline to exactly `n` points, evenly spaced by arc length. */
function resamplePolyline(pts: P[], n: number): P[] {
  if (pts.length === 0 || n <= 0) return [];
  if (pts.length === 1) return Array.from({ length: n }, () => pts[0]);
  const total = polylineLength(pts);
  if (total === 0) return Array.from({ length: n }, () => pts[0]);
  const step = total / (n - 1);
  const out: P[] = [pts[0]];
  let acc = 0;
  let segIndex = 0;
  let segStart: P = pts[0];
  let segEnd: P = pts[1];
  let segLen = Math.hypot(segEnd[0] - segStart[0], segEnd[1] - segStart[1]);
  for (let i = 1; i < n - 1; i++) {
    const target = i * step;
    while (acc + segLen < target && segIndex < pts.length - 2) {
      acc += segLen;
      segIndex++;
      segStart = pts[segIndex];
      segEnd = pts[segIndex + 1];
      segLen = Math.hypot(segEnd[0] - segStart[0], segEnd[1] - segStart[1]);
    }
    const t = segLen === 0 ? 0 : (target - acc) / segLen;
    out.push([
      segStart[0] + (segEnd[0] - segStart[0]) * t,
      segStart[1] + (segEnd[1] - segStart[1]) * t,
    ]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Centroid + max-radius normalize so the cloud sits roughly in [-1, 1]. */
function normalize(pts: P[]): P[] {
  if (pts.length === 0) return [];
  let cx = 0,
    cy = 0;
  for (const [x, y] of pts) {
    cx += x;
    cy += y;
  }
  cx /= pts.length;
  cy /= pts.length;
  let rmax = 1e-9;
  for (const [x, y] of pts) {
    const r = Math.hypot(x - cx, y - cy);
    if (r > rmax) rmax = r;
  }
  return pts.map(([x, y]) => [(x - cx) / rmax, (y - cy) / rmax] as P);
}

/** Mean squared distance assuming i↔i correspondence. */
function msd(a: P[], b: P[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return Infinity;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const dx = a[i][0] - b[i][0];
    const dy = a[i][1] - b[i][1];
    s += dx * dx + dy * dy;
  }
  return s / n;
}

/** Closed-form optimal 2-D rotation of `b` to fit `a`. */
function rotateBToA(a: P[], b: P[]): P[] {
  let xx = 0,
    xy = 0;
  for (let i = 0; i < a.length; i++) {
    xx += a[i][0] * b[i][0] + a[i][1] * b[i][1];
    xy += a[i][0] * b[i][1] - a[i][1] * b[i][0];
  }
  const theta = Math.atan2(xy, xx);
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return b.map(([x, y]) => [c * x - s * y, s * x + c * y] as P);
}

function reflectX(b: P[]): P[] {
  return b.map(([x, y]) => [-x, y] as P);
}

/** Best-fit residual under rotation + optional reflection.
 *  Returns the residual AND the aligned version of `b` so the caller can
 *  overlay it visually on `a`. */
function bestFitWithAlignment(a: P[], b: P[]): { distance: number; aligned: P[] } {
  const r1 = rotateBToA(a, b);
  const m1 = msd(a, r1);
  const bRef = reflectX(b);
  const r2 = rotateBToA(a, bRef);
  const m2 = msd(a, r2);
  if (m1 <= m2) return { distance: m1, aligned: r1 };
  return { distance: m2, aligned: r2 };
}

export type Match = {
  constellation: Constellation;
  /** Lower is better. */
  distance: number;
  /** Higher is better, derived from distance for the UI. */
  similarity: number;
  /** Full journey, normalized (centroid 0, max-radius 1). For the overlay. */
  journeyNormFull: P[];
  /** Constellation shape rotated/reflected to best overlay the journey,
   *  expressed in the same normalized coordinate space as journeyNormFull. */
  shapeAligned: P[];
  /** Same aligned constellation but un-normalized back into the journey's
   *  ORIGINAL coordinate space (i.e. unwrapped lon/lat). Lets the orb
   *  project them through its own projection and trace the matched
   *  constellation directly onto the visible journey path. */
  shapeAlignedLonLat: P[];
};

/**
 * Compare a chronological journey path to every constellation in the catalog
 * and return the matches sorted by similarity (best first).
 *
 * journeyPoints: ordered points in (x, y) — typically projected (lon, lat) or
 * orthographic screen-space; only relative shape matters.
 */
export function matchConstellation(journeyPoints: P[]): Match[] {
  if (journeyPoints.length < 3) return [];
  // Centroid + max-radius of the journey in its ORIGINAL (lon/lat) space.
  // We mirror what normalize() does so we can run the inverse transform
  // and project the matched constellation back into the same space the
  // orb uses for its journey path.
  let cx = 0;
  let cy = 0;
  for (const [x, y] of journeyPoints) {
    cx += x;
    cy += y;
  }
  cx /= journeyPoints.length;
  cy /= journeyPoints.length;
  let rmax = 1e-9;
  for (const [x, y] of journeyPoints) {
    const r = Math.hypot(x - cx, y - cy);
    if (r > rmax) rmax = r;
  }

  const journeyNorm = normalize(journeyPoints);

  const results: Match[] = CONSTELLATIONS.map((con) => {
    const n = con.shape.length;
    const journeyRes = resamplePolyline(journeyNorm, n);
    const conNorm = normalize(con.shape);
    const { distance, aligned } = bestFitWithAlignment(journeyRes, conNorm);
    // Inverse-normalize the aligned constellation back to lon/lat space.
    const shapeAlignedLonLat: P[] = aligned.map(([x, y]) => [
      x * rmax + cx,
      y * rmax + cy,
    ]);
    return {
      constellation: con,
      distance,
      similarity: 1 / (1 + distance),
      journeyNormFull: journeyNorm,
      shapeAligned: aligned,
      shapeAlignedLonLat,
    };
  });
  results.sort((a, b) => b.similarity - a.similarity);
  return results;
}

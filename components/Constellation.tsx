"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ComposableMap,
  Sphere,
  Marker,
  useMapContext,
} from "react-simple-maps";
import { geoInterpolate } from "d3-geo";
import { motion, AnimatePresence } from "motion/react";
import type { Place } from "@/lib/places-types";
import { LEGS, CITIES } from "@/lib/places";
import {
  matchConstellation,
  type Match,
  CONSTELLATIONS,
} from "@/lib/constellations";
import { catmullRomPath } from "@/lib/spline";

type Props = {
  places: Place[];
  size?: number;
  /** Stops (1-based) revealed so far. Null = show all. */
  legsThrough?: number | null;
  focusedSlug?: string | null;
  onCountryHover?: (countryName: string | null) => void;
  onCountryClick?: (countryName: string) => void;
};

const TO_RAD = Math.PI / 180;

function isVisible(
  coord: [number, number],
  rotate: [number, number, number],
): boolean {
  const [lon, lat] = coord;
  const [lambda, phi] = rotate;
  const cx = -lambda * TO_RAD;
  const cy = -phi * TO_RAD;
  const px = lon * TO_RAD;
  const py = lat * TO_RAD;
  const cosD =
    Math.sin(cy) * Math.sin(py) +
    Math.cos(cy) * Math.cos(py) * Math.cos(px - cx);
  return cosD > 0.05;
}

/** Draws a curved chronological "constellation" — the projected line
 *  through every visited stop in journey order.
 *
 *  The path is built as a Catmull-Rom spline through the projected points
 *  (split into runs at back-hemisphere transitions) so the curve glides
 *  smoothly between segments instead of corner-ing at each shared
 *  endpoint. We still pass `rotate` here to manually skip back-hemisphere
 *  points; on geoOrthographic the raw projection function returns finite
 *  values everywhere (clipAngle only applies inside .stream()), so without
 *  this the journey path would bleed through to the far side of the orb. */
function ConstellationLines({
  points,
  rotate,
  color,
  width,
}: {
  points: Array<[number, number]>;
  rotate: [number, number, number];
  color: string;
  width: number;
}) {
  const { projection } = useMapContext() as {
    projection: (c: [number, number]) => [number, number] | null;
  };
  const segments = useMemo(() => {
    // Project, splitting into continuous front-hemisphere runs.
    const runs: Array<Array<[number, number]>> = [];
    let current: Array<[number, number]> = [];
    for (const p of points) {
      if (!isVisible(p, rotate)) {
        if (current.length >= 2) runs.push(current);
        current = [];
        continue;
      }
      const proj = projection(p);
      if (!proj || !Number.isFinite(proj[0]) || !Number.isFinite(proj[1])) {
        if (current.length >= 2) runs.push(current);
        current = [];
        continue;
      }
      current.push([proj[0], proj[1]]);
    }
    if (current.length >= 2) runs.push(current);
    return runs.map(catmullRomPath).join(" ");
  }, [points, projection, rotate]);
  if (!segments) return null;
  return (
    <path
      d={segments}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

const ConstellationSVG = memo(function ConstellationSVG({
  places,
  rotate,
  zoom,
  size,
  hoveredCountry,
  legsThrough,
  focusedSlug,
  traceShape,
  onCountryEnter,
  onCountryClick,
}: {
  places: Place[];
  rotate: [number, number, number];
  zoom: number;
  size: number;
  hoveredCountry: string | null;
  legsThrough: number | null;
  focusedSlug: string | null;
  /** Matched constellation in lon/lat space; rendered on top of the journey
   *  so the user can see "your trip looks like Cassiopeia" visually. */
  traceShape: [number, number][] | null;
  onCountryEnter: (name: string) => void;
  onCountryClick: (country: string) => void;
}) {
  // Build chronological stop list (slugs in visit order)
  const stopSlugs = useMemo(() => {
    return [LEGS[0].from, ...LEGS.map((l) => l.to)];
  }, []);
  const upTo = legsThrough != null ? legsThrough + 1 : stopSlugs.length;
  const visibleStops = stopSlugs.slice(0, upTo);

  // Curved great-circle line through stops in order
  const linePoints = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (let i = 0; i < visibleStops.length - 1; i++) {
      const from = CITIES[visibleStops[i]]?.coordinates;
      const to = CITIES[visibleStops[i + 1]]?.coordinates;
      if (!from || !to) continue;
      const interp = geoInterpolate(from, to);
      const steps = 18;
      for (let s = 0; s <= steps; s++) out.push(interp(s / steps));
    }
    return out;
  }, [visibleStops]);

  const visibleByPlace = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const p of places) m.set(p.slug, isVisible(p.coordinates, rotate));
    return m;
  }, [places, rotate]);

  // Memory density per place (for star size)
  const density = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of places) {
      const stops = p.stops?.length ?? 1;
      const photos = p.photos?.length ?? 0;
      const journal = (p.journal?.length ?? 0) / 600;
      const score = stops * 3 + photos * 1.5 + journal + (p.hasRealPhotos ? 4 : 0);
      m.set(p.slug, score);
    }
    return m;
  }, [places]);
  const maxScore = Math.max(1, ...density.values());

  const projectionScale = (size / 2 - 8) * zoom;
  const focusedPlace = focusedSlug ? places.find((p) => p.slug === focusedSlug) : null;

  return (
    <ComposableMap
      projection="geoOrthographic"
      projectionConfig={{ scale: projectionScale, rotate }}
      width={size}
      height={size}
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        <radialGradient id="con-sphere" cx="38%" cy="34%" r="74%">
          <stop offset="0%" stopColor="#2b3760" />
          <stop offset="55%" stopColor="#161d35" />
          <stop offset="100%" stopColor="#0a0f20" />
        </radialGradient>
        <radialGradient id="star-glow">
          <stop offset="0%" stopColor="#fde8b8" stopOpacity="1" />
          <stop offset="35%" stopColor="#ffd87f" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffd87f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="star-hi-glow">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor="#fde8b8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#fde8b8" stopOpacity="0" />
        </radialGradient>
        <filter id="star-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>

      <Sphere
        id="con-sphere-shape"
        fill="url(#con-sphere)"
        stroke="rgba(253, 232, 184, 0.18)"
        strokeWidth={0.6}
      />

      {/* Background star field */}
      <BackgroundStars seed={0} />

      {/* Constellation lines through visited places in journey order */}
      {linePoints.length > 1 && (
        <g pointerEvents="none">
          {/* Three-layer trail so the route reads brightly on the dark
           *  sky: wide soft halo + warm gold mid + crisp cream core. */}
          <ConstellationLines
            points={linePoints}
            rotate={rotate}
            color="rgba(253, 220, 150, 0.20)"
            width={5}
          />
          <ConstellationLines
            points={linePoints}
            rotate={rotate}
            color="rgba(245, 195, 110, 0.65)"
            width={2}
          />
          <ConstellationLines
            points={linePoints}
            rotate={rotate}
            color="rgba(255, 240, 200, 0.95)"
            width={1}
          />
        </g>
      )}

      {/* Invisible hit-circles for clickability per visited place */}
      {places.map((place) => {
        if (!visibleByPlace.get(place.slug)) return null;
        return (
          <Marker
            key={`hit-${place.slug}`}
            coordinates={place.coordinates}
            onMouseEnter={() => onCountryEnter(place.country)}
            onClick={() => onCountryClick(place.country)}
            style={{
              default: { cursor: "pointer", outline: "none" },
              hover: { cursor: "pointer", outline: "none" },
              pressed: { cursor: "pointer", outline: "none" },
            }}
          >
            <circle r={8} fill="transparent" />
          </Marker>
        );
      })}

      {/* Stars (visible places) — brighter, bigger, with a 4-point spike
       *  so visited cities pop against the night sky. Stars are now built
       *  in three layers: ambient halo + core + faint cross spike. */}
      {places.map((place) => {
        if (!visibleByPlace.get(place.slug)) return null;
        const score = density.get(place.slug) ?? 1;
        const t = score / maxScore;
        const r = 2 + t * 3.6;
        const isHi =
          hoveredCountry !== null &&
          place.country.toLowerCase() === hoveredCountry.toLowerCase();
        const spike = r * 4.8;
        return (
          <Marker key={place.slug} coordinates={place.coordinates}>
            <g pointerEvents="none">
              {/* Outer ambient glow — much larger and warmer */}
              <circle
                r={r * 5}
                fill={isHi ? "url(#star-hi-glow)" : "url(#star-glow)"}
                opacity={isHi ? 0.95 : 0.75}
              />
              {/* Diffraction spikes — two thin cross lines through center */}
              <line
                x1={-spike}
                y1={0}
                x2={spike}
                y2={0}
                stroke={isHi ? "#ffffff" : "#fde8b8"}
                strokeOpacity={isHi ? 0.65 : 0.45}
                strokeWidth={0.6}
                strokeLinecap="round"
              />
              <line
                x1={0}
                y1={-spike}
                x2={0}
                y2={spike}
                stroke={isHi ? "#ffffff" : "#fde8b8"}
                strokeOpacity={isHi ? 0.65 : 0.45}
                strokeWidth={0.6}
                strokeLinecap="round"
              />
              {/* Soft inner glow */}
              <circle
                r={r * 1.8}
                fill={isHi ? "#ffffff" : "#fff2c8"}
                opacity={0.35}
                filter="url(#star-blur)"
              />
              {/* Bright core */}
              <circle
                r={r * 0.95}
                fill={isHi ? "#ffffff" : "#fde8b8"}
              />
              {/* White hot center */}
              <circle r={r * 0.5} fill="#ffffff" />
            </g>
          </Marker>
        );
      })}

      {/* Matched constellation trace — bright cream lines + stars
       *  rendered through the same orthographic projection as the
       *  journey, so the user can see the resemblance directly on the
       *  orb. Receives `rotate` so we can manually clip to the front
       *  hemisphere. */}
      {traceShape && traceShape.length > 1 && (
        <MatchedConstellationOverlay points={traceShape} rotate={rotate} />
      )}

      {/* Focused stop pulse */}
      {focusedPlace && visibleByPlace.get(focusedPlace.slug) && (
        <Marker coordinates={focusedPlace.coordinates}>
          <g pointerEvents="none">
            <motion.circle
              r={20}
              fill="url(#star-hi-glow)"
              initial={{ opacity: 0.9, scale: 0.7 }}
              animate={{ opacity: [0.9, 0.2, 0.9], scale: [0.7, 1.5, 0.7] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </g>
        </Marker>
      )}
    </ComposableMap>
  );
});

/**
 * Renders the matched constellation directly on the orb, using the same
 * orthographic projection as the rest of the SVG.  Lines fade in; each
 * star pops in turn so the shape is "drawn" over the journey path.
 *
 * Points are in unwrapped lon/lat space — we re-wrap them into [-180, 180]
 * for the projection (orthographic naturally returns null on the back
 * hemisphere, splitting the polyline cleanly).
 */
function MatchedConstellationOverlay({
  points,
  rotate,
}: {
  points: [number, number][];
  rotate: [number, number, number];
}) {
  const { projection } = useMapContext() as {
    projection: (c: [number, number]) => [number, number] | null;
  };
  const wrap = (lon: number) =>
    ((((lon + 180) % 360) + 360) % 360) - 180;
  const projected = useMemo(() => {
    return points.map((p) => {
      const lon = wrap(p[0]);
      const lat = Math.max(-89, Math.min(89, p[1]));
      // Back-hemisphere check — raw projection() returns finite values for
      // points behind the orb, so without this filter the constellation
      // trace bleeds through to the far side.
      if (!isVisible([lon, lat], rotate)) return null;
      const proj = projection([lon, lat]);
      if (
        !proj ||
        !Number.isFinite(proj[0]) ||
        !Number.isFinite(proj[1])
      ) {
        return null;
      }
      return proj;
    });
  }, [points, projection, rotate]);

  // Build path as a Catmull-Rom spline so the matched constellation
  // overlay also flows smoothly between vertices.
  const path = useMemo(() => {
    const runs: Array<Array<[number, number]>> = [];
    let curr: Array<[number, number]> = [];
    for (const proj of projected) {
      if (!proj) {
        if (curr.length >= 2) runs.push(curr);
        curr = [];
        continue;
      }
      curr.push([proj[0], proj[1]]);
    }
    if (curr.length >= 2) runs.push(curr);
    return runs.map(catmullRomPath).join(" ");
  }, [projected]);

  if (!path) return null;
  return (
    <g pointerEvents="none">
      {/* outer glow */}
      <motion.path
        d={path}
        stroke="#fde8b8"
        strokeOpacity={0.25}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />
      {/* bright core */}
      <motion.path
        d={path}
        stroke="#fff5d8"
        strokeOpacity={0.95}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />
      {/* stars at each vertex, popping in one-by-one */}
      {projected.map((proj, i) =>
        proj ? (
          <motion.g
            key={i}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.5 + i * 0.1 }}
          >
            <circle
              cx={proj[0]}
              cy={proj[1]}
              r={6}
              fill="#fde8b8"
              opacity={0.4}
            />
            <circle
              cx={proj[0]}
              cy={proj[1]}
              r={2.6}
              fill="#ffffff"
              stroke="#fde8b8"
              strokeWidth={0.6}
            />
          </motion.g>
        ) : null,
      )}
    </g>
  );
}

function BackgroundStars({ seed }: { seed: number }) {
  // Deterministic pseudo-random star field — quiet decoration for the night sky
  const stars = useMemo(() => {
    const out: Array<{ x: number; y: number; r: number; o: number }> = [];
    let s = seed + 1;
    const rng = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let i = 0; i < 90; i++) {
      out.push({
        x: rng() * 100,
        y: rng() * 100,
        r: rng() * 0.9 + 0.2,
        o: rng() * 0.6 + 0.18,
      });
    }
    return out;
  }, [seed]);
  return (
    <g pointerEvents="none">
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x + "%"}
          cy={s.y + "%"}
          r={s.r}
          fill="#fde8b8"
          opacity={s.o}
        />
      ))}
    </g>
  );
}

function unwrapLongitudes(
  pts: [number, number][],
): [number, number][] {
  if (pts.length === 0) return [];
  const out: [number, number][] = pts.map(([x, y]) => [x, y]);
  for (let i = 1; i < out.length; i++) {
    let dx = out[i][0] - out[i - 1][0];
    while (dx > 180) {
      out[i][0] -= 360;
      dx = out[i][0] - out[i - 1][0];
    }
    while (dx < -180) {
      out[i][0] += 360;
      dx = out[i][0] - out[i - 1][0];
    }
  }
  return out;
}

function ConstellationImpl({
  places,
  size = 520,
  legsThrough = null,
  focusedSlug = null,
  onCountryHover,
  onCountryClick,
}: Props) {
  const [rotate, setRotate] = useState<[number, number, number]>([-15, -25, 0]);
  const [zoom, setZoom] = useState<number>(1);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [revealOpen, setRevealOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  // Match the chronological shape of the trip against known constellations.
  // Re-computed only when the underlying CITIES/LEGS change, which is never
  // during a session — so this is effectively a one-shot.
  const matches = useMemo<Match[]>(() => {
    const stopSlugs = [LEGS[0].from, ...LEGS.map((l) => l.to)];
    const raw: [number, number][] = stopSlugs
      .map((slug) => CITIES[slug]?.coordinates)
      .filter(
        (c): c is [number, number] => Array.isArray(c) && c.length === 2,
      );
    const journey = unwrapLongitudes(raw);
    return matchConstellation(journey);
  }, []);
  const best = matches[0];

  // Fly to focused city
  useEffect(() => {
    if (!focusedSlug) return;
    const place = places.find((p) => p.slug === focusedSlug);
    if (!place) return;
    const target: [number, number, number] = [
      -place.coordinates[0],
      -place.coordinates[1],
      0,
    ];
    let raf: number;
    const start = rotate;
    const t0 = performance.now();
    const dur = 900;
    const ease = (t: number) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      const k = ease(t);
      let dl = target[0] - start[0];
      while (dl > 180) dl -= 360;
      while (dl < -180) dl += 360;
      setRotate([start[0] + dl * k, start[1] + (target[1] - start[1]) * k, 0]);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedSlug]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !lastPointer.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setRotate(([l, p, g]) => {
      const nl = (l + (dx * 0.4) / zoom) % 360;
      const np = Math.max(-89, Math.min(89, p - (dy * 0.4) / zoom));
      return [nl, np, g];
    });
  };
  const onPointerUp = () => {
    dragging.current = false;
    lastPointer.current = null;
  };

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      setZoom((z) => Math.max(0.7, Math.min(4, z * factor)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const onCountryEnter = useCallback(
    (name: string) => {
      setHoveredCountry(name);
      onCountryHover?.(name);
    },
    [onCountryHover],
  );
  const onCountryClickInner = useCallback(
    (country: string) => onCountryClick?.(country),
    [onCountryClick],
  );

  return (
    <div
      ref={wrapperRef}
      className="relative w-full select-none touch-none rounded-full"
      style={{
        aspectRatio: "1 / 1",
        maxWidth: size,
        background:
          "radial-gradient(circle at 50% 50%, rgba(253,232,184,0.14) 47%, rgba(253,232,184,0.26) 49%, rgba(253,232,184,0) 56%)",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => {
        onPointerUp();
        setHoveredCountry(null);
        onCountryHover?.(null);
      }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-full">
      <ConstellationSVG
        places={places}
        rotate={rotate}
        zoom={zoom}
        size={size}
        hoveredCountry={hoveredCountry}
        legsThrough={legsThrough}
        focusedSlug={focusedSlug}
        traceShape={revealOpen && best ? best.shapeAlignedLonLat : null}
        onCountryEnter={onCountryEnter}
        onCountryClick={onCountryClickInner}
      />
      </div>

      <AnimatePresence>
        {hoveredCountry && (
          <motion.div
            key={hoveredCountry}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md border border-white/15 bg-black/60 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-amber backdrop-blur"
          >
            {hoveredCountry}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal toggle pinned to the *viewport*, not the orb, so it's
       *  always visible regardless of where the orb sits. */}
      {best && (
        <button
          type="button"
          onClick={() => setRevealOpen((v) => !v)}
          className="pointer-events-auto fixed left-1/2 top-24 z-40 -translate-x-1/2 rounded-full border border-white/20 bg-black/60 px-4 py-1.5 text-[10px] uppercase tracking-[0.28em] text-amber backdrop-blur transition hover:border-amber/40"
        >
          {revealOpen ? "✕ Hide reveal" : "✦ Which constellation?"}
        </button>
      )}

      {/* Reveal panel — fixed to the LEFT edge so the orb stays fully
       *  visible behind. The matched constellation is also traced live
       *  on the orb itself (see traceShape prop on ConstellationSVG). */}
      <AnimatePresence>
        {revealOpen && best && (
          <motion.div
            key="reveal-panel"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            className="pointer-events-auto fixed left-6 top-1/2 z-40 w-[min(380px,42vw)] max-h-[78vh] -translate-y-1/2 overflow-y-auto rounded-lg border border-white/15 bg-black/82 p-4 text-paper shadow-2xl backdrop-blur"
          >
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.3em] text-paper/60">
                  Your trip looks like…
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-amber">
                  {best.constellation.zodiac ? "Zodiac" : "Constellation"}
                </div>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-4">
                <div className="font-display text-2xl text-paper">
                  {best.constellation.name}
                </div>
                <div className="font-mono text-[10px] text-paper/50">
                  {(best.similarity * 100).toFixed(0)}% match
                </div>
              </div>

              <MatchDiagram match={best} />

              <p className="mt-3 text-[12px] leading-snug text-paper/85">
                {best.constellation.story}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-2 text-[10px] text-paper/55">
                <span className="uppercase tracking-[0.22em]">Also like</span>
                {matches.slice(1, 4).map((m) => (
                  <span
                    key={m.constellation.abbr}
                    className="uppercase tracking-[0.18em]"
                  >
                    {m.constellation.name}{" "}
                    <span className="text-paper/40">
                      {(m.similarity * 100).toFixed(0)}%
                    </span>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-2 text-[9px] uppercase tracking-[0.22em] text-paper/40">
                <span>
                  Matched against {CONSTELLATIONS.length} of the 88 IAU
                  constellations.
                </span>
                <button
                  type="button"
                  onClick={() => setRevealOpen(false)}
                  className="text-paper/60 hover:text-amber"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Side-by-side overlay diagram for the constellation reveal panel.  Shows the
 * traveler's full journey path (faint amber) with the matched constellation
 * shape rotated/reflected onto it (bright cream stars and lines).  The
 * constellation traces in over ~1.5s and the stars pop in one by one.
 */
function MatchDiagram({ match }: { match: Match }) {
  // Diagram viewBox: 240×170. Both journey and aligned constellation live in
  // [-1, 1] coords after normalize(). Scale to fit with padding.
  const VW = 240;
  const VH = 170;
  const scale = 64;
  const cx = VW / 2;
  const cy = VH / 2 + 4;
  const toX = (p: [number, number]) => cx + p[0] * scale;
  const toY = (p: [number, number]) => cy + p[1] * scale;

  const journey = match.journeyNormFull;
  const journeyPath = useMemo(() => {
    if (!journey.length) return "";
    const parts = journey.map(
      (p, i) => `${i === 0 ? "M" : "L"}${toX(p).toFixed(2)},${toY(p).toFixed(2)}`,
    );
    return parts.join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey]);

  const aligned = match.shapeAligned;
  const conPath = useMemo(() => {
    if (!aligned.length) return "";
    const parts = aligned.map(
      (p, i) => `${i === 0 ? "M" : "L"}${toX(p).toFixed(2)},${toY(p).toFixed(2)}`,
    );
    return parts.join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aligned]);

  return (
    <div className="mt-3 overflow-hidden rounded-md border border-white/10 bg-black/40 p-2">
      <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-[0.22em] text-paper/55">
        <span className="flex items-center gap-1">
          <span className="inline-block h-1 w-3 rounded-full bg-[#b6803a]/70" />
          your trip
        </span>
        <span className="text-paper/40">overlay · approx fit</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1 w-3 rounded-full bg-[#fde8b8]" />
          {match.constellation.name}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width="100%"
        className="block"
        aria-hidden
      >
        <defs>
          <radialGradient id="diag-star-glow">
            <stop offset="0%" stopColor="#fde8b8" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#ffd87f" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffd87f" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* faint frame so the diagram reads as its own box */}
        <rect
          x={0.5}
          y={0.5}
          width={VW - 1}
          height={VH - 1}
          rx={4}
          fill="none"
          stroke="rgba(253,232,184,0.08)"
        />

        {/* Journey path — faint amber polyline */}
        <path
          d={journeyPath}
          stroke="#b6803a"
          strokeWidth={0.9}
          strokeOpacity={0.55}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Journey dots */}
        {journey.map((p, i) => (
          <circle
            key={`j-${i}`}
            cx={toX(p)}
            cy={toY(p)}
            r={0.9}
            fill="#b6803a"
            fillOpacity={0.6}
          />
        ))}

        {/* Constellation lines — trace in over 1.5s */}
        <motion.path
          key={`con-${match.constellation.abbr}`}
          d={conPath}
          stroke="#fde8b8"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.9 }}
          transition={{
            pathLength: { duration: 1.5, ease: "easeInOut" },
            opacity: { duration: 0.3 },
          }}
        />

        {/* Constellation stars — fade in one by one */}
        {aligned.map((p, i) => (
          <g key={`s-${match.constellation.abbr}-${i}`}>
            <motion.circle
              cx={toX(p)}
              cy={toY(p)}
              r={6}
              fill="url(#diag-star-glow)"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.12 }}
            />
            <motion.circle
              cx={toX(p)}
              cy={toY(p)}
              r={2.6}
              fill="#ffffff"
              stroke="#fde8b8"
              strokeWidth={0.6}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.45 + i * 0.12 }}
            />
            <motion.text
              x={toX(p) + 4}
              y={toY(p) - 4}
              fontSize={6}
              fill="#fde8b8"
              fillOpacity={0.65}
              fontFamily="ui-monospace, monospace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.55 + i * 0.12 }}
            >
              {i + 1}
            </motion.text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function Constellation(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div
        className="relative w-full"
        style={{ aspectRatio: "1 / 1", maxWidth: props.size ?? 520 }}
        aria-hidden
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_38%_34%,#2b3760_0%,#161d35_55%,#0a0f20_100%)] opacity-90" />
      </div>
    );
  }
  return <ConstellationImpl {...props} />;
}

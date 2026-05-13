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
  Geographies,
  Geography,
  Graticule,
  Sphere,
  Marker,
  Line,
  useMapContext,
} from "react-simple-maps";
import { geoCircle, geoInterpolate } from "d3-geo";
import { motion, AnimatePresence } from "motion/react";
import type { Place } from "@/lib/places-types";
import {
  MODE_STYLE,
  getResolvedLegs,
  CITIES,
  getCountryMemoryDensity,
} from "@/lib/places";
import LandmarkLayer from "./LandmarkLayer";

const GEO_URL = "/geo/countries-110m.json";

type Props = {
  places: Place[];
  focusedSlug?: string | null;
  showRoute?: boolean;
  showTerminator?: boolean;
  showClocks?: boolean;
  showLandmarks?: boolean;
  showHeatmap?: boolean;
  legsThrough?: number | null;
  size?: number;
  /** When true, the focus marker shines/sparkles brighter — used during the
   *  Random Place spinner. */
  sparkle?: boolean;
  /** Camera offset in pixels. Drives both the globe's own translate
   *  AND the parallax in the surrounding universe — they live together
   *  in Stage so the whole scene flies coherently. */
  cameraOffset?: { x: number; y: number };
  onCameraChange?: (next: { x: number; y: number }) => void;
  placeSlugs?: Set<string>;
  onCountryHover?: (countryName: string | null) => void;
  onCountryClick?: (countryName: string) => void;
};

const PARIS_SLUG = "paris";
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

function subsolarPoint(date: Date): [number, number] {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000);
  const decl = 23.45 * Math.sin(((360 * (dayOfYear - 81)) / 365) * TO_RAD);
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const lon = -((utcHours - 12) * 15);
  return [lon, decl];
}

function heatColor(t: number): string {
  // Pale cream → soft amber.  t ∈ [0, 1].  Cap at 0.85 so the hottest
  // country stays in the amber family instead of going rust-red.
  const tt = Math.max(0, Math.min(0.85, t));
  // mix between #f0e3ca (240, 227, 202) and #b6803a (182, 128, 58)
  const r = Math.round(240 + (182 - 240) * tt);
  const g = Math.round(227 + (128 - 227) * tt);
  const b = Math.round(202 + (58 - 202) * tt);
  return `rgb(${r}, ${g}, ${b})`;
}

function NightTerminator({ now, strength = 0.16 }: { now: number; strength?: number }) {
  const { path } = useMapContext() as { path: (g: unknown) => string | null };
  const d = useMemo(() => {
    const [sunLon, sunLat] = subsolarPoint(new Date(now));
    const circle = geoCircle()
      .center([sunLon + 180, -sunLat])
      .radius(90);
    return path(circle());
  }, [path, now]);
  if (!d) return null;
  return (
    <g pointerEvents="none">
      <path d={d} fill={`rgba(31, 54, 64, ${strength})`} />
      <path d={d} fill="none" stroke="rgba(140, 93, 34, 0.2)" strokeWidth={0.6} />
    </g>
  );
}

/** Memoized SVG body — re-renders only when its own deps change.
 *  Critically: it does NOT depend on cursor position. */
const GlobeSVG = memo(function GlobeSVG({
  places,
  rotate,
  zoom,
  size,
  hoveredCountry,
  hoveredMarkerCountry,
  placeSlugs,
  showRoute,
  showTerminator,
  showLandmarks,
  showClocks,
  showHeatmap,
  legsThrough,
  focusedSlug,
  sparkle,
  nowMs,
  onCountryEnter,
  onCountryClick,
  onMarkerEnter,
  onMarkerLeave,
}: {
  places: Place[];
  rotate: [number, number, number];
  zoom: number;
  size: number;
  hoveredCountry: string | null;
  hoveredMarkerCountry: string | null;
  placeSlugs?: Set<string>;
  showRoute: boolean;
  showTerminator: boolean;
  showLandmarks: boolean;
  showClocks: boolean;
  showHeatmap: boolean;
  legsThrough: number | null;
  focusedSlug: string | null;
  sparkle: boolean;
  nowMs: number;
  onCountryEnter: (name: string) => void;
  onCountryClick: (name: string, hasPlace: boolean) => void;
  onMarkerEnter: (slug: string | null) => void;
  onMarkerLeave: () => void;
}) {
  const placesByCountry = useMemo(() => {
    const m = new Map<string, Place>();
    for (const p of places) m.set(p.country.toLowerCase(), p);
    return m;
  }, [places]);
  const heatByCountry = useMemo(
    () => (showHeatmap ? getCountryMemoryDensity(places) : new Map<string, number>()),
    [places, showHeatmap],
  );

  const visibleByPlace = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const p of places) m.set(p.slug, isVisible(p.coordinates, rotate));
    return m;
  }, [places, rotate]);

  const legs = useMemo(() => getResolvedLegs(), []);
  const visibleLegCount = legsThrough ?? legs.length;

  const trailPoints = useMemo(() => {
    const out: Array<[number, number]> = [];
    const upTo = Math.min(visibleLegCount, legs.length);
    for (let i = 0; i < upTo; i++) {
      const leg = legs[i];
      const interp = geoInterpolate(leg.fromCoord, leg.toCoord);
      const steps = 24;
      for (let s = 0; s <= steps; s++) out.push(interp(s / steps));
    }
    return out;
  }, [legs, visibleLegCount]);

  const projectionScale = (size / 2 - 8) * zoom;
  const focusedPlace = focusedSlug
    ? places.find((p) => p.slug === focusedSlug)
    : null;

  return (
    <ComposableMap
      projection="geoOrthographic"
      projectionConfig={{ scale: projectionScale, rotate }}
      width={size}
      height={size}
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        {/* Vintage globe ocean — deep aged-ink teal at the limb, easing to
         *  a warm slate at the highlighted face. Matches the project's
         *  warm paper aesthetic but with real depth so it doesn't read
         *  flat. */}
        <radialGradient id="ocean" cx="36%" cy="32%" r="76%">
          <stop offset="0%" stopColor="#4b6878" />
          <stop offset="48%" stopColor="#2c4858" />
          <stop offset="82%" stopColor="#152633" />
          <stop offset="100%" stopColor="#0a1620" />
        </radialGradient>
        {/* Land — sun-aged parchment, brighter on the lit face and
         *  deepening to warm umber in the shadowed band. */}
        <linearGradient id="land" x1="0.3" x2="0.7" y1="0" y2="1">
          <stop offset="0%" stopColor="#e6cb95" />
          <stop offset="55%" stopColor="#b9905c" />
          <stop offset="100%" stopColor="#7d5d33" />
        </linearGradient>
        {/* Hover highlight — same family but lifted. */}
        <linearGradient id="land-highlight" x1="0.3" x2="0.7" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff1cb" />
          <stop offset="60%" stopColor="#e3bf80" />
          <stop offset="100%" stopColor="#a88245" />
        </linearGradient>
        {/* Visited countries — saturated amber that pops against the
         *  unvisited parchment. */}
        <linearGradient id="land-place" x1="0.3" x2="0.7" y1="0" y2="1">
          <stop offset="0%" stopColor="#f5cf86" />
          <stop offset="55%" stopColor="#c8893a" />
          <stop offset="100%" stopColor="#8a5a1e" />
        </linearGradient>
        {/* Thin warm atmospheric rim. */}
        <radialGradient id="atmosphere" cx="50%" cy="50%" r="50%">
          <stop offset="92%" stopColor="rgba(255, 210, 150, 0)" />
          <stop offset="97%" stopColor="rgba(255, 220, 170, 0.35)" />
          <stop offset="100%" stopColor="rgba(255, 230, 180, 0.0)" />
        </radialGradient>
        <radialGradient id="globe-marker">
          <stop offset="0%" stopColor="#b6803a" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#b6803a" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#b6803a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="globe-marker-paris">
          <stop offset="0%" stopColor="#fde8b8" stopOpacity="1" />
          <stop offset="50%" stopColor="#b6803a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#b6803a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="focus-pulse">
          <stop offset="0%" stopColor="#9a4a28" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#9a4a28" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#9a4a28" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sparkle-burst-globe">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="22%" stopColor="#ffd87f" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#ff9a3a" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ff9a3a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ocean sphere */}
      <Sphere
        id="globe-sphere"
        fill="url(#ocean)"
        stroke="rgba(255, 210, 150, 0.25)"
        strokeWidth={0.8}
      />
      {/* Warm atmospheric rim just inside the limb */}
      <Sphere
        id="globe-atmo"
        fill="url(#atmosphere)"
        stroke="none"
        strokeWidth={0}
      />

      {/* Graticule visibility scales up with zoom — at high zoom we want
       *  the lat/lon curves to remain readable so curvature is felt. */}
      <Graticule
        stroke={`rgba(255, 210, 150, ${Math.min(0.28, 0.08 + zoom * 0.04)})`}
        strokeWidth={0.4}
        step={[15, 15]}
      />

      <Geographies geography={GEO_URL}>
        {({ geographies }: { geographies: Array<{ rsmKey: string; properties: { name: string } }> }) =>
          geographies.map((geo) => {
            const name = geo.properties?.name ?? "";
            const place = placesByCountry.get(name.toLowerCase());
            const hasPlace = !!place && (placeSlugs?.has(place.slug) ?? true);
            const isMarkerHi = hoveredMarkerCountry !== null && name.toLowerCase() === hoveredMarkerCountry.toLowerCase();
            const isCountryHi = hoveredCountry !== null && name === hoveredCountry;
            const isHi = isMarkerHi || isCountryHi;
            const heat = showHeatmap ? heatByCountry.get(name) ?? 0 : 0;
            const fill = isHi
              ? "url(#land-highlight)"
              : showHeatmap && heat > 0
                ? heatColor(heat)
                : hasPlace
                  ? "url(#land-place)"
                  : "url(#land)";
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onMouseEnter={() => onCountryEnter(name)}
                onClick={() => onCountryClick(name, hasPlace)}
                fill={fill}
                stroke={isHi ? "#fff1cb" : "rgba(70, 45, 18, 0.55)"}
                strokeWidth={isHi ? 0.8 : 0.3}
                style={{
                  default: {
                    outline: "none",
                    transition: "fill 220ms",
                    cursor: hasPlace ? "pointer" : "default",
                  },
                  hover: {
                    fill: "url(#land-highlight)",
                    outline: "none",
                    cursor: hasPlace ? "pointer" : "default",
                  },
                  pressed: {
                    fill: "url(#land-highlight)",
                    outline: "none",
                  },
                }}
              />
            );
          })
        }
      </Geographies>

      {showTerminator && <NightTerminator now={nowMs} />}

      {showRoute && trailPoints.length > 1 && (
        <g pointerEvents="none">
          {/* Three-layer trail so the route glows on the dark universe
           *  without going neon. Outer cream halo + warm gold mid-band +
           *  bright cream-gold core. */}
          <Trail
            points={trailPoints}
            rotate={rotate}
            color="rgba(253, 220, 150, 0.18)"
            width={6.5}
          />
          <Trail
            points={trailPoints}
            rotate={rotate}
            color="rgba(245, 195, 110, 0.55)"
            width={2.6}
          />
          <Trail
            points={trailPoints}
            rotate={rotate}
            color="rgba(255, 232, 184, 0.95)"
            width={1.4}
          />
        </g>
      )}

      {showRoute && (() => {
        // Slugs of cities in the currently hovered country — used to
        // highlight just that country's incoming/outgoing routes
        const hoveredSlugs = new Set<string>();
        if (hoveredCountry) {
          for (const p of places) {
            if (p.country.toLowerCase() === hoveredCountry.toLowerCase()) {
              hoveredSlugs.add(p.slug);
            }
          }
        }
        return legs.slice(0, visibleLegCount).map((leg) => {
          const style = MODE_STYLE[leg.mode];
          const isCurrent = legsThrough === leg.index;
          const isConnected =
            hoveredSlugs.size > 0 &&
            (hoveredSlugs.has(leg.from) || hoveredSlugs.has(leg.to));
          const op = isCurrent ? 0.95 : isConnected ? 0.9 : 0.18;
          const w = isCurrent
            ? style.width + 1.2
            : isConnected
              ? 1.8
              : 0.85;
          return (
            <Line
              key={leg.index}
              from={leg.fromCoord}
              to={leg.toCoord}
              stroke={isConnected || isCurrent ? style.color : "#a3854a"}
              strokeWidth={w}
              strokeOpacity={op}
              strokeLinecap="round"
              strokeDasharray={style.dash === "0" ? undefined : style.dash}
              fill="none"
            />
          );
        });
      })()}

      {/* Focus pulse on current scrubbed stop — sparkles much brighter while
       *  the Random Place spinner is running so the eye can follow it. */}
      {focusedPlace && visibleByPlace.get(focusedPlace.slug) && (
        <Marker coordinates={focusedPlace.coordinates}>
          <g pointerEvents="none">
            {sparkle ? (
              <>
                <motion.circle
                  r={40}
                  fill="url(#sparkle-burst-globe)"
                  initial={{ opacity: 0.9, scale: 0.4 }}
                  animate={{ opacity: [1, 0.3, 1], scale: [0.55, 1.5, 0.55] }}
                  transition={{
                    duration: 0.55,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.g
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                >
                  <line x1={-28} y1={0} x2={28} y2={0} stroke="#ffd87f" strokeWidth={1.6} strokeLinecap="round" />
                  <line x1={0} y1={-28} x2={0} y2={28} stroke="#ffd87f" strokeWidth={1.6} strokeLinecap="round" />
                </motion.g>
                <motion.g
                  initial={{ rotate: 45 }}
                  animate={{ rotate: 45 - 360 }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                >
                  <line x1={-16} y1={0} x2={16} y2={0} stroke="#fff2d7" strokeWidth={1} strokeLinecap="round" opacity={0.9} />
                  <line x1={0} y1={-16} x2={0} y2={16} stroke="#fff2d7" strokeWidth={1} strokeLinecap="round" opacity={0.9} />
                </motion.g>
                <circle r={4} fill="#ffffff" />
                <circle r={1.8} fill="#9a4a28" />
              </>
            ) : (
              <>
                <motion.circle
                  r={22}
                  fill="url(#focus-pulse)"
                  initial={{ opacity: 0.9, scale: 0.6 }}
                  animate={{ opacity: [0.9, 0.2, 0.9], scale: [0.6, 1.4, 0.6] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <circle r={3} fill="#9a4a28" stroke="#fff" strokeWidth={1} />
              </>
            )}
          </g>
        </Marker>
      )}

      {/* Markers — visible-side only */}
      {places.map((place) => {
        const visible = visibleByPlace.get(place.slug);
        if (!visible) return null;
        const isHub = place.slug === PARIS_SLUG;
        return (
          <Marker
            key={place.slug}
            coordinates={place.coordinates}
            onMouseEnter={() => onMarkerEnter(place.country)}
            onMouseLeave={onMarkerLeave}
            onClick={() => onCountryClick(place.country, true)}
            style={{
              default: { cursor: "pointer", outline: "none" },
              hover: { cursor: "pointer", outline: "none" },
              pressed: { cursor: "pointer", outline: "none" },
            }}
          >
            <g>
              <circle
                r={isHub ? 10 : 6}
                fill={`url(#${isHub ? "globe-marker-paris" : "globe-marker"})`}
              />
              <circle
                r={isHub ? 3.2 : 2.2}
                fill={isHub ? "#fde8b8" : "#b6803a"}
                stroke="#3a2a14"
                strokeWidth={0.7}
              />
            </g>
          </Marker>
        );
      })}

      {/* Local clocks layer — for visited countries only */}
      {showClocks && (
        <ClockLayer places={places} visibleByPlace={visibleByPlace} nowMs={nowMs} />
      )}

      {/* Landmark figurines */}
      {showLandmarks && (
        <LandmarkLayer
          places={places}
          visibleByPlace={visibleByPlace}
        />
      )}
    </ComposableMap>
  );
});

function ClockLayer({
  places,
  visibleByPlace,
  nowMs,
}: {
  places: Place[];
  visibleByPlace: Map<string, boolean>;
  nowMs: number;
}) {
  // Use longitude / 15 to approximate timezone offset (no API call, instant)
  const date = new Date(nowMs);
  // De-duplicate by country: only one clock per country (use the hub city)
  const seen = new Set<string>();
  const items: Array<{ slug: string; coord: [number, number]; label: string }> = [];
  for (const p of places) {
    if (seen.has(p.country)) continue;
    seen.add(p.country);
    if (!visibleByPlace.get(p.slug)) continue;
    const offsetH = p.coordinates[0] / 15;
    const local = new Date(date.getTime() + offsetH * 3600_000);
    const hh = local.getUTCHours().toString().padStart(2, "0");
    const mm = local.getUTCMinutes().toString().padStart(2, "0");
    items.push({ slug: p.slug, coord: p.coordinates, label: `${hh}:${mm}` });
  }
  return (
    <g pointerEvents="none">
      {items.map((it) => (
        <Marker key={it.slug} coordinates={it.coord}>
          <g transform="translate(0,-14)">
            <rect
              x={-15}
              y={-7}
              width={30}
              height={12}
              rx={2.5}
              fill="rgba(243,239,231,0.92)"
              stroke="rgba(122,94,52,0.4)"
              strokeWidth={0.4}
            />
            <text
              y={2}
              textAnchor="middle"
              fontSize={8}
              fontFamily="monospace"
              fill="#1a1a1a"
            >
              {it.label}
            </text>
          </g>
        </Marker>
      ))}
    </g>
  );
}

function Trail({
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
    // For orthographic projection, the raw `projection(p)` returns finite
    // values even for back-hemisphere points — d3-geo's clipAngle only
    // applies inside .stream(). We therefore have to manually skip
    // back-hemisphere points so trails don't bleed through the far side
    // of the globe.
    const segs: string[] = [];
    let current: string[] = [];
    for (const p of points) {
      const visible = isVisible(p, rotate);
      if (!visible) {
        if (current.length > 1) segs.push(`M${current.join("L")}`);
        current = [];
        continue;
      }
      const proj = projection(p);
      if (!proj || !Number.isFinite(proj[0]) || !Number.isFinite(proj[1])) {
        if (current.length > 1) segs.push(`M${current.join("L")}`);
        current = [];
        continue;
      }
      current.push(`${proj[0].toFixed(2)},${proj[1].toFixed(2)}`);
    }
    if (current.length > 1) segs.push(`M${current.join("L")}`);
    return segs.join(" ");
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

function GlobeImpl({
  places,
  focusedSlug = null,
  showRoute = true,
  showTerminator = true,
  showClocks = false,
  showLandmarks = false,
  showHeatmap = false,
  legsThrough = null,
  size = 520,
  sparkle = false,
  cameraOffset = { x: 0, y: 0 },
  onCameraChange,
  placeSlugs,
  onCountryHover,
  onCountryClick,
}: Props) {
  const [rotate, setRotate] = useState<[number, number, number]>([-15, -25, 0]);
  const [zoom, setZoom] = useState<number>(1);
  // Translation is OWNED by the parent (Stage) so dragging here also drives
  // the parallax in the surrounding UniverseBackdrop — they share one
  // camera. We read the current value from props and shadow it in a ref so
  // pointer-move can compute deltas without going through React state.
  const offsetRef = useRef<{ x: number; y: number }>(cameraOffset);
  useEffect(() => {
    offsetRef.current = cameraOffset;
  }, [cameraOffset]);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredMarkerCountry, setHoveredMarkerCountry] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Cursor state — kept in a ref + a separate component so the SVG body
  // does NOT re-render on every mouse move (this caused the "shake").
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const dragging = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const interactingAt = useRef<number>(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Mirror of `rotate` so the fly-to animation can read the real-time
  // rotation even when React hasn't re-rendered yet between rapid
  // focusedSlug changes.  Without this, the animation captures a stale
  // rotate via closure and the globe appears to "shake" while it tries
  // to interpolate from a no-longer-true starting point.
  const rotateRef = useRef<[number, number, number]>(rotate);
  useEffect(() => {
    rotateRef.current = rotate;
  }, [rotate]);
  const lastFocusAt = useRef<number>(0);

  // Tick clocks every 30s — clocks layer only renders if enabled
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Fly to focused city.  Reads the current rotation via rotateRef so that
  // rapid focusedSlug changes (random spinner, fast filmstrip scrub) start
  // each new animation from where the globe actually IS, not from a stale
  // closure value.  And if changes come in faster than the animation can
  // play, we snap instead of starting an overlapping interpolation.
  useEffect(() => {
    if (!focusedSlug) return;
    const place = places.find((p) => p.slug === focusedSlug);
    if (!place) return;

    const now = performance.now();
    const sinceLast = now - lastFocusAt.current;
    lastFocusAt.current = now;

    const target: [number, number, number] = [
      -place.coordinates[0],
      -place.coordinates[1],
      0,
    ];
    interactingAt.current = now;

    // If focus is changing faster than a comfortable animation can play,
    // just snap.  Avoids the "shake" of two interpolations fighting.
    if (sinceLast < 260) {
      const startSnap = rotateRef.current;
      let dl = target[0] - startSnap[0];
      while (dl > 180) dl -= 360;
      while (dl < -180) dl += 360;
      const snapped: [number, number, number] = [
        startSnap[0] + dl,
        target[1],
        0,
      ];
      rotateRef.current = snapped;
      setRotate(snapped);
      return;
    }

    const start: [number, number, number] = [
      rotateRef.current[0],
      rotateRef.current[1],
      rotateRef.current[2],
    ];
    let raf = 0;
    const t0 = performance.now();
    const dur = 900;
    const ease = (t: number) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    let dl = target[0] - start[0];
    while (dl > 180) dl -= 360;
    while (dl < -180) dl += 360;
    const dp = target[1] - start[1];
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      const k = ease(t);
      const next: [number, number, number] = [
        start[0] + dl * k,
        start[1] + dp * k,
        0,
      ];
      rotateRef.current = next;
      setRotate(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [focusedSlug, places]);

  // Track whether the drag-down was started while shift was held so the
  // gesture stays in "translate mode" even if the user lets go of shift
  // mid-drag.
  const dragMode = useRef<"rotate" | "translate">("rotate");

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
    // Plain drag = TRANSLATE the globe across the universe (what the user
    // asked for: "drag the globe entirely in this universe"). Hold Shift,
    // or use middle/right button, to rotate the globe's surface instead.
    dragMode.current =
      e.shiftKey || e.button === 1 || e.button === 2 ? "rotate" : "translate";
    interactingAt.current = performance.now();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    // Update tooltip position via ref (no React re-render)
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (rect) {
      posRef.current.x = e.clientX - rect.left;
      posRef.current.y = e.clientY - rect.top;
      const t = tooltipRef.current;
      if (t) {
        t.style.transform = `translate(${posRef.current.x + 14}px, ${
          posRef.current.y + 14
        }px)`;
      }
    }
    if (!dragging.current || !lastPointer.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    if (dragMode.current === "translate") {
      const next = {
        x: offsetRef.current.x + dx,
        y: offsetRef.current.y + dy,
      };
      offsetRef.current = next;
      onCameraChange?.(next);
    } else {
      setRotate(([l, p, g]) => {
        const nl = (l + (dx * 0.4) / zoom) % 360;
        const np = Math.max(-89, Math.min(89, p - (dy * 0.4) / zoom));
        const next: [number, number, number] = [nl, np, g];
        rotateRef.current = next;
        return next;
      });
    }
    interactingAt.current = performance.now();
  };
  const onPointerUp = () => {
    dragging.current = false;
    lastPointer.current = null;
    dragMode.current = "rotate";
    interactingAt.current = performance.now();
  };

  // Double-click on empty area = recenter the camera back to the middle.
  const recenter = () => {
    offsetRef.current = { x: 0, y: 0 };
    onCameraChange?.({ x: 0, y: 0 });
  };

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      // Min 0.35 so the user can pull back and see lots of universe around
      // the globe; max 4 because past that the orthographic crop becomes
      // a flat disk and the sphere no longer reads as a sphere.
      setZoom((z) => Math.max(0.35, Math.min(4, z * factor)));
      interactingAt.current = performance.now();
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Stable callbacks for the memoized SVG body
  const onCountryEnter = useCallback(
    (name: string) => {
      setHoveredCountry(name);
      onCountryHover?.(name);
    },
    [onCountryHover],
  );
  const onCountryClickInner = useCallback(
    (name: string, hasPlace: boolean) => {
      if (hasPlace) onCountryClick?.(name);
    },
    [onCountryClick],
  );
  const onMarkerEnter = useCallback((country: string | null) => {
    setHoveredMarkerCountry(country);
  }, []);
  const onMarkerLeave = useCallback(() => setHoveredMarkerCountry(null), []);

  const tooltipName = hoveredMarkerCountry ?? hoveredCountry;

  return (
    <div
      ref={wrapperRef}
      className="relative w-full select-none touch-none"
      style={{
        aspectRatio: "1 / 1",
        maxWidth: size,
        transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px)`,
        transition: dragging.current ? "none" : "transform 220ms ease-out",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => {
        onPointerUp();
        setHoveredCountry(null);
        setHoveredMarkerCountry(null);
        onCountryHover?.(null);
      }}
      onDoubleClick={recenter}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Outer atmospheric bloom — a warm cream halo that extends just past
       *  the sphere edge so the planet reads as "in atmosphere," not flat. */}
      <div
        className="pointer-events-none absolute -inset-[8%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255, 220, 170, 0) 46%, rgba(255, 220, 170, 0.16) 50%, rgba(255, 220, 170, 0.06) 56%, rgba(255, 220, 170, 0) 68%)",
        }}
      />

      {/* Clip the SVG to a circle so zoomed-in content never reads as a square */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
      <GlobeSVG
        places={places}
        rotate={rotate}
        zoom={zoom}
        size={size}
        hoveredCountry={hoveredCountry}
        hoveredMarkerCountry={hoveredMarkerCountry}
        placeSlugs={placeSlugs}
        showRoute={showRoute}
        showTerminator={showTerminator}
        showClocks={showClocks}
        showLandmarks={showLandmarks}
        showHeatmap={showHeatmap}
        legsThrough={legsThrough}
        focusedSlug={focusedSlug}
        sparkle={sparkle}
        nowMs={nowMs}
        onCountryEnter={onCountryEnter}
        onCountryClick={onCountryClickInner}
        onMarkerEnter={onMarkerEnter}
        onMarkerLeave={onMarkerLeave}
      />
      </div>

      {/* Tooltip lives in its own DOM node — its position is updated via
          a ref so SVG paths never re-render on cursor movement. */}
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute left-0 top-0 z-20"
        style={{ transition: "opacity 120ms" }}
      >
        <AnimatePresence>
          {tooltipName && (
            <motion.div
              key={tooltipName}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="rounded-sm border border-paper-3 bg-paper/95 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-ink shadow-md backdrop-blur-md"
            >
              {tooltipName}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Globe(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div
        className="relative w-full"
        style={{ aspectRatio: "1 / 1", maxWidth: props.size ?? 520 }}
        aria-hidden
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 36% 32%, #4b6878 0%, #2c4858 55%, #0a1620 100%)",
            opacity: 0.85,
          }}
        />
      </div>
    );
  }
  return <GlobeImpl {...props} />;
}

// Avoid unused warnings for CITIES import (kept for future extension)
void CITIES;

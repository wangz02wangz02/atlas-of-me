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
  Marker,
  Sphere,
  ZoomableGroup,
  useMapContext,
} from "react-simple-maps";
import { geoCircle, geoInterpolate } from "d3-geo";
import { motion, AnimatePresence } from "motion/react";
import type { Place } from "@/lib/places-types";
import {
  getResolvedLegs,
  MODE_STYLE,
  getCountryMemoryDensity,
} from "@/lib/places";
import LandmarkLayer from "./LandmarkLayer";
import LegTraveler from "./LegTraveler";

const GEO_URL = "/geo/countries-110m.json";
const TO_RAD = Math.PI / 180;

// Equirectangular projection at scale 165: world width = 2π×scale
const FLAT_SCALE = 165;
const WORLD_W = 2 * Math.PI * FLAT_SCALE;

type Props = {
  places: Place[];
  center: [number, number];
  zoom: number;
  showRoute?: boolean;
  showTerminator?: boolean;
  showClocks?: boolean;
  showLandmarks?: boolean;
  showHeatmap?: boolean;
  legsThrough?: number | null;
  /** 0-based index of the leg that just brought the traveler to the focused stop.
   *  Drives the moving plane / mode glyph. */
  activeLegIndex?: number | null;
  focusedSlug?: string | null;
  /** When true, the focus marker shines/sparkles brighter — used during the
   *  Random Place spinner so the user can actually see what's being picked. */
  sparkle?: boolean;
  placeSlugs?: Set<string>;
  onMoveEnd?: (pos: { coordinates: [number, number]; zoom: number }) => void;
  onCountryHover?: (countryName: string | null) => void;
  onCountryClick?: (countryName: string) => void;
};

const PARIS_SLUG = "paris";

function subsolarPoint(date: Date): [number, number] {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000);
  const decl = 23.45 * Math.sin(((360 * (dayOfYear - 81)) / 365) * TO_RAD);
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const lon = -((utcHours - 12) * 15);
  return [lon, decl];
}

function heatColor(t: number): string {
  const tt = Math.max(0, Math.min(0.85, t));
  const r = Math.round(240 + (182 - 240) * tt);
  const g = Math.round(227 + (128 - 227) * tt);
  const b = Math.round(202 + (58 - 202) * tt);
  return `rgb(${r}, ${g}, ${b})`;
}

function NightShade({ now }: { now: number }) {
  const { path } = useMapContext() as { path: (g: unknown) => string | null };
  const d = useMemo(() => {
    const [sunLon, sunLat] = subsolarPoint(new Date(now));
    const circle = geoCircle()
      .center([sunLon + 180, -sunLat])
      .radius(90);
    return path(circle());
  }, [path, now]);
  if (!d) return null;
  return <path d={d} fill="rgba(31, 54, 64, 0.16)" pointerEvents="none" />;
}

/**
 * Convert a sequence of (lon, lat) into a single projected polyline.
 *
 * We deliberately DON'T split at the antimeridian here.  In equirectangular
 * space, a great-circle arc from Tokyo to LA crosses lon=180/-180 and the
 * naive polyline draws one near-horizontal segment at the great-circle apex
 * (high north latitudes for transpacific routes) that visually wraps the
 * map.  That's not pretty but it keeps the line continuous, which the user
 * preferred over seeing two disconnected stubs at the canvas edges.  We
 * still bail on non-finite projection (orthographic back-hemisphere).
 */
function projectSegments(
  points: Array<[number, number]>,
  projection: (c: [number, number]) => [number, number] | null,
): string {
  const segs: string[] = [];
  let current: string[] = [];
  for (const p of points) {
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
}

function Trail({
  points,
  color,
  width,
}: {
  points: Array<[number, number]>;
  color: string;
  width: number;
}) {
  const { projection } = useMapContext() as {
    projection: (c: [number, number]) => [number, number] | null;
  };
  const segments = useMemo(
    () => projectSegments(points, projection),
    [points, projection],
  );
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

/**
 * Per-leg colored arc, drawn as a great-circle interpolation and split at the
 * antimeridian.  Replaces react-simple-maps' built-in `<Line>` which only
 * connects two endpoints with a straight projected segment — that misses the
 * curvature of long flights and cuts diagonally across the whole map for
 * trans-pacific legs.
 */
function LegArc({
  from,
  to,
  color,
  width,
  dash,
  opacity,
}: {
  from: [number, number];
  to: [number, number];
  color: string;
  width: number;
  dash?: string;
  opacity?: number;
}) {
  const { projection } = useMapContext() as {
    projection: (c: [number, number]) => [number, number] | null;
  };
  const segments = useMemo(() => {
    const interp = geoInterpolate(from, to);
    const STEPS = 36;
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= STEPS; i++) pts.push(interp(i / STEPS));
    return projectSegments(pts, projection);
  }, [from, to, projection]);
  if (!segments) return null;
  return (
    <path
      d={segments}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash}
      fill="none"
      opacity={opacity}
    />
  );
}

const MapBody = memo(function MapBody({
  places,
  hoveredCountry,
  hoveredMarkerCountry,
  placeSlugs,
  showRoute,
  showTerminator,
  showClocks,
  showLandmarks,
  showHeatmap,
  legsThrough,
  activeLegIndex,
  focusedSlug,
  sparkle,
  zoom,
  nowMs,
  onCountryEnter,
  onCountryClick,
  onMarkerEnter,
  onMarkerLeave,
}: {
  places: Place[];
  hoveredCountry: string | null;
  hoveredMarkerCountry: string | null;
  placeSlugs?: Set<string>;
  showRoute: boolean;
  showTerminator: boolean;
  showClocks: boolean;
  showLandmarks: boolean;
  showHeatmap: boolean;
  legsThrough: number | null;
  activeLegIndex: number | null;
  focusedSlug: string | null;
  sparkle: boolean;
  zoom: number;
  nowMs: number;
  onCountryEnter: (name: string) => void;
  onCountryClick: (name: string, hasPlace: boolean) => void;
  onMarkerEnter: (country: string) => void;
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
  const legs = useMemo(() => getResolvedLegs(), []);
  const visibleLegCount = legsThrough ?? legs.length;
  const trailPoints = useMemo(() => {
    const out: Array<[number, number]> = [];
    const upTo = Math.min(visibleLegCount, legs.length);
    for (let i = 0; i < upTo; i++) {
      const leg = legs[i];
      const interp = geoInterpolate(leg.fromCoord, leg.toCoord);
      const steps = 18;
      for (let s = 0; s <= steps; s++) out.push(interp(s / steps));
    }
    return out;
  }, [legs, visibleLegCount]);

  const markerScale = Math.max(0.5, Math.min(1.4, zoom / 2));
  const focusedPlace = focusedSlug ? places.find((p) => p.slug === focusedSlug) : null;

  const visibleAll = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const p of places) m.set(p.slug, true);
    return m;
  }, [places]);

  const hoveredSlugs = useMemo(() => {
    const set = new Set<string>();
    if (hoveredCountry) {
      for (const p of places) {
        if (p.country.toLowerCase() === hoveredCountry.toLowerCase()) {
          set.add(p.slug);
        }
      }
    }
    return set;
  }, [hoveredCountry, places]);

  return (
    <>
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
              ? "url(#flat-land-hi)"
              : showHeatmap && heat > 0
                ? heatColor(heat)
                : hasPlace
                  ? "url(#flat-land-place)"
                  : "url(#flat-land)";
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onMouseEnter={() => onCountryEnter(name)}
                onClick={() => onCountryClick(name, hasPlace)}
                fill={fill}
                stroke={isHi ? "#9a4a28" : "rgba(122,94,52,0.30)"}
                strokeWidth={isHi ? 0.6 / zoom : 0.25 / zoom}
                style={{
                  default: {
                    outline: "none",
                    transition: "fill 220ms",
                    cursor: hasPlace ? "pointer" : "default",
                  },
                  hover: {
                    fill: "url(#flat-land-hi)",
                    outline: "none",
                    cursor: hasPlace ? "pointer" : "default",
                  },
                  pressed: {
                    fill: "url(#flat-land-hi)",
                    outline: "none",
                  },
                }}
              />
            );
          })
        }
      </Geographies>

      {showTerminator && <NightShade now={nowMs} />}

      {/* Bulk amber glow under the whole journey — kept fatter and brighter
       *  so the trail reads even at zoomed-out defaults. */}
      {showRoute && trailPoints.length > 1 && (
        <g pointerEvents="none">
          <Trail
            points={trailPoints}
            color="rgba(182, 128, 58, 0.16)"
            width={5 / zoom}
          />
          <Trail
            points={trailPoints}
            color="rgba(154, 74, 40, 0.75)"
            width={1.3 / zoom}
          />
        </g>
      )}

      {/* Per-leg arcs — ALL legs render with the mode color at low opacity
       *  so the user always sees the full route. Hovered country lights up
       *  its arrival/departure arcs, and the currently scrubbed leg jumps
       *  to full prominence. Great-circle and antimeridian-seam aware. */}
      {showRoute &&
        legs.slice(0, visibleLegCount).map((leg) => {
          const isCurrent = legsThrough === leg.index;
          const isConnected =
            hoveredSlugs.size > 0 &&
            (hoveredSlugs.has(leg.from) || hoveredSlugs.has(leg.to));
          const style = MODE_STYLE[leg.mode];
          const isHi = isConnected || isCurrent;
          return (
            <LegArc
              key={leg.index}
              from={leg.fromCoord}
              to={leg.toCoord}
              color={style.color}
              width={(isCurrent ? 1.8 : isHi ? 1.2 : 0.55) / zoom}
              opacity={isCurrent ? 0.95 : isHi ? 0.85 : 0.35}
              dash={style.dash === "0" ? undefined : style.dash}
            />
          );
        })}

      {/* Plane / mode glyph riding the most-recent arrival leg. Indiana Jones effect. */}
      {activeLegIndex != null && legs[activeLegIndex] && (
        <LegTraveler
          fromCoord={legs[activeLegIndex].fromCoord}
          toCoord={legs[activeLegIndex].toCoord}
          mode={legs[activeLegIndex].mode}
          legKey={legs[activeLegIndex].index}
          zoom={zoom}
        />
      )}

      {focusedPlace && (
        <Marker coordinates={focusedPlace.coordinates}>
          <g pointerEvents="none">
            {sparkle ? (
              <>
                {/* outer hot halo */}
                <motion.circle
                  r={36 / zoom}
                  fill="url(#sparkle-burst-flat)"
                  initial={{ opacity: 0.9, scale: 0.4 }}
                  animate={{ opacity: [1, 0.25, 1], scale: [0.55, 1.5, 0.55] }}
                  transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* rotating cross spokes */}
                <motion.g
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                >
                  <line
                    x1={-26 / zoom}
                    y1={0}
                    x2={26 / zoom}
                    y2={0}
                    stroke="#ffd87f"
                    strokeWidth={1.3 / zoom}
                    strokeLinecap="round"
                  />
                  <line
                    x1={0}
                    y1={-26 / zoom}
                    x2={0}
                    y2={26 / zoom}
                    stroke="#ffd87f"
                    strokeWidth={1.3 / zoom}
                    strokeLinecap="round"
                  />
                </motion.g>
                {/* counter-rotating shorter cross */}
                <motion.g
                  initial={{ rotate: 45 }}
                  animate={{ rotate: 45 - 360 }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                >
                  <line
                    x1={-15 / zoom}
                    y1={0}
                    x2={15 / zoom}
                    y2={0}
                    stroke="#fff2d7"
                    strokeWidth={0.8 / zoom}
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                  <line
                    x1={0}
                    y1={-15 / zoom}
                    x2={0}
                    y2={15 / zoom}
                    stroke="#fff2d7"
                    strokeWidth={0.8 / zoom}
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                </motion.g>
                <circle r={3 / zoom} fill="#ffffff" />
                <circle r={1.4 / zoom} fill="#9a4a28" />
              </>
            ) : (
              <>
                <motion.circle
                  r={18 / zoom}
                  fill="url(#focus-pulse-flat)"
                  initial={{ opacity: 0.9, scale: 0.6 }}
                  animate={{ opacity: [0.9, 0.2, 0.9], scale: [0.6, 1.4, 0.6] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <circle r={2 / zoom} fill="#9a4a28" stroke="#fff" strokeWidth={0.6 / zoom} />
              </>
            )}
          </g>
        </Marker>
      )}

      {places.map((place) => {
        const isHub = place.slug === PARIS_SLUG;
        const r = (isHub ? 3.2 : 2) * markerScale;
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
            <circle
              r={r}
              fill={isHub ? "#fde8b8" : "#b6803a"}
              stroke="#3a2a14"
              strokeWidth={0.5 / zoom}
            />
          </Marker>
        );
      })}

      {showClocks && <ClockLayerFlat places={places} nowMs={nowMs} zoom={zoom} />}
      {showLandmarks && <LandmarkLayer places={places} visibleByPlace={visibleAll} />}
    </>
  );
});

function ClockLayerFlat({
  places,
  nowMs,
  zoom,
}: {
  places: Place[];
  nowMs: number;
  zoom: number;
}) {
  const date = new Date(nowMs);
  const seen = new Set<string>();
  const items: Array<{ slug: string; coord: [number, number]; label: string }> = [];
  for (const p of places) {
    if (seen.has(p.country)) continue;
    seen.add(p.country);
    const offsetH = p.coordinates[0] / 15;
    const local = new Date(date.getTime() + offsetH * 3600_000);
    const hh = local.getUTCHours().toString().padStart(2, "0");
    const mm = local.getUTCMinutes().toString().padStart(2, "0");
    items.push({ slug: p.slug, coord: p.coordinates, label: `${hh}:${mm}` });
  }
  const w = 18 / zoom;
  const h = 7 / zoom;
  return (
    <g pointerEvents="none">
      {items.map((it) => (
        <Marker key={`ck-${it.slug}`} coordinates={it.coord}>
          <g transform={`translate(0, -${10 / zoom})`}>
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              rx={1.5 / zoom}
              fill="rgba(243,239,231,0.92)"
              stroke="rgba(122,94,52,0.4)"
              strokeWidth={0.3 / zoom}
            />
            <text
              y={1.2 / zoom}
              textAnchor="middle"
              fontSize={4.6 / zoom}
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

export default function WorldMap({
  places,
  center,
  zoom,
  showRoute = true,
  showTerminator = false,
  showClocks = false,
  showLandmarks = false,
  showHeatmap = false,
  legsThrough = null,
  activeLegIndex = null,
  focusedSlug = null,
  sparkle = false,
  placeSlugs,
  onMoveEnd,
  onCountryHover,
  onCountryClick,
}: Props) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredMarkerCountry, setHoveredMarkerCountry] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    posRef.current.x = e.clientX - rect.left;
    posRef.current.y = e.clientY - rect.top;
    const t = tooltipRef.current;
    if (t) {
      t.style.transform = `translate(${posRef.current.x + 14}px, ${
        posRef.current.y + 14
      }px)`;
    }
  }, []);

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
  const onMarkerEnter = useCallback((country: string) => {
    setHoveredMarkerCountry(country);
  }, []);
  const onMarkerLeave = useCallback(() => setHoveredMarkerCountry(null), []);

  const tooltipName = hoveredMarkerCountry ?? hoveredCountry;

  // Wrap copies — render the world at -W, 0, +W so panning loops seamlessly.
  // Index 0 is the canonical render (mouse interactions live here).
  return (
    <div
      ref={wrapperRef}
      className="relative w-full select-none"
      onMouseMove={onMouseMove}
      onMouseLeave={() => {
        setHoveredCountry(null);
        setHoveredMarkerCountry(null);
        onCountryHover?.(null);
      }}
    >
      {/*
        viewBox is exactly one world wide so the world fills the viewport at
        default zoom. Trans-pacific great-circle arcs are no longer split at
        the antimeridian — the continuous polyline includes a single near-
        horizontal segment at the top latitudes (the great-circle apex)
        rather than dying at the canvas edge.
      */}
      <ComposableMap
        projection="geoEquirectangular"
        projectionConfig={{ scale: FLAT_SCALE }}
        width={WORLD_W}
        height={WORLD_W / 2}
        viewBox={`0 0 ${WORLD_W} ${WORLD_W / 2}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="flat-land" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f0e3ca" />
            <stop offset="100%" stopColor="#d6bb8a" />
          </linearGradient>
          <linearGradient id="flat-land-place" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f6d8a4" />
            <stop offset="100%" stopColor="#cb9b56" />
          </linearGradient>
          <linearGradient id="flat-land-hi" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fff2d7" />
            <stop offset="100%" stopColor="#e7c994" />
          </linearGradient>
          <linearGradient id="flat-ocean" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#e1ebef" />
            <stop offset="100%" stopColor="#c0d5dc" />
          </linearGradient>
          <radialGradient id="focus-pulse-flat">
            <stop offset="0%" stopColor="#9a4a28" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#9a4a28" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#9a4a28" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sparkle-burst-flat">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="22%" stopColor="#ffd87f" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#ff9a3a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff9a3a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="leg-traveler-halo">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#ffd87f" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffd87f" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ocean stripe across all wrap copies, wider so the rectangle
         *  reaches past the drag extent on either side. */}
        <rect
          x={-WORLD_W * 3}
          y={-WORLD_W / 4}
          width={WORLD_W * 7}
          height={WORLD_W}
          fill="url(#flat-ocean)"
        />
        {/* Sphere clip is replaced by the rect above so wrap copies share an ocean */}
        <Sphere id="flat-sphere" fill="transparent" stroke="none" strokeWidth={0} />

        <ZoomableGroup
          center={center}
          zoom={zoom}
          minZoom={0.5}
          maxZoom={14}
          translateExtent={[
            [-WORLD_W * 2.5, -WORLD_W / 4],
            [WORLD_W * 2.5, (WORLD_W * 3) / 4],
          ]}
          onMoveEnd={onMoveEnd}
        >
          {[-2, -1, 0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${i * WORLD_W} 0)`}>
              <MapBody
                places={places}
                hoveredCountry={hoveredCountry}
                hoveredMarkerCountry={hoveredMarkerCountry}
                placeSlugs={placeSlugs}
                showRoute={showRoute}
                showTerminator={showTerminator}
                showClocks={showClocks}
                showLandmarks={showLandmarks}
                showHeatmap={showHeatmap}
                legsThrough={legsThrough}
                activeLegIndex={activeLegIndex}
                focusedSlug={focusedSlug}
                sparkle={sparkle}
                zoom={zoom}
                nowMs={nowMs}
                onCountryEnter={onCountryEnter}
                onCountryClick={onCountryClickInner}
                onMarkerEnter={onMarkerEnter}
                onMarkerLeave={onMarkerLeave}
              />
            </g>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      <div
        ref={tooltipRef}
        className="pointer-events-none absolute left-0 top-0 z-20"
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

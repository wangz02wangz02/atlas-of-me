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
  // Pale cream → deep amber.  t ∈ [0, 1].
  const tt = Math.max(0, Math.min(1, t));
  // mix between #f0e3ca (240, 227, 202) and #9a4a28 (154, 74, 40)
  const r = Math.round(240 + (154 - 240) * tt);
  const g = Math.round(227 + (74 - 227) * tt);
  const b = Math.round(202 + (40 - 202) * tt);
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
        <radialGradient id="ocean" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#cfe0e6" />
          <stop offset="55%" stopColor="#a7c4cd" />
          <stop offset="100%" stopColor="#7ea3ad" />
        </radialGradient>
        <linearGradient id="land" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f0e3ca" />
          <stop offset="100%" stopColor="#d6bb8a" />
        </linearGradient>
        <linearGradient id="land-highlight" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff2d7" />
          <stop offset="100%" stopColor="#e7c994" />
        </linearGradient>
        <linearGradient id="land-place" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f6d8a4" />
          <stop offset="100%" stopColor="#cb9b56" />
        </linearGradient>
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
      </defs>

      <Sphere id="globe-sphere" fill="url(#ocean)" stroke="#7a5e34" strokeWidth={0.8} />

      <Graticule
        stroke="rgba(122, 94, 52, 0.10)"
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
                stroke={isHi ? "#9a4a28" : "#a3854a"}
                strokeWidth={isHi ? 0.7 : 0.35}
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
          <Trail points={trailPoints} color="rgba(182, 128, 58, 0.10)" width={3.6} />
          <Trail points={trailPoints} color="rgba(182, 128, 58, 0.55)" width={0.9} />
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
          const op = isCurrent ? 0.95 : isConnected ? 0.85 : 0.08;
          const w = isCurrent ? style.width + 0.6 : isConnected ? 1 : 0.4;
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

      {/* Focus pulse on current scrubbed stop */}
      {focusedPlace && visibleByPlace.get(focusedPlace.slug) && (
        <Marker coordinates={focusedPlace.coordinates}>
          <g pointerEvents="none">
            <motion.circle
              r={22}
              fill="url(#focus-pulse)"
              initial={{ opacity: 0.9, scale: 0.6 }}
              animate={{ opacity: [0.9, 0.2, 0.9], scale: [0.6, 1.4, 0.6] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <circle r={3} fill="#9a4a28" stroke="#fff" strokeWidth={1} />
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
  const segments = useMemo(() => {
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
  }, [points, projection]);
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
  placeSlugs,
  onCountryHover,
  onCountryClick,
}: Props) {
  const [rotate, setRotate] = useState<[number, number, number]>([-15, -25, 0]);
  const [zoom, setZoom] = useState<number>(1);
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

  // Tick clocks every 30s — clocks layer only renders if enabled
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

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
    interactingAt.current = performance.now();
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
    setRotate(([l, p, g]) => {
      const nl = (l + (dx * 0.4) / zoom) % 360;
      const np = Math.max(-89, Math.min(89, p - (dy * 0.4) / zoom));
      return [nl, np, g];
    });
    interactingAt.current = performance.now();
  };
  const onPointerUp = () => {
    dragging.current = false;
    lastPointer.current = null;
    interactingAt.current = performance.now();
  };

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      setZoom((z) => Math.max(0.7, Math.min(4, z * factor)));
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
      style={{ aspectRatio: "1 / 1", maxWidth: size }}
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
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(182,128,58,0.04) 50%, rgba(182,128,58,0.08) 51%, rgba(182,128,58,0) 56%)",
        }}
      />

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
        nowMs={nowMs}
        onCountryEnter={onCountryEnter}
        onCountryClick={onCountryClickInner}
        onMarkerEnter={onMarkerEnter}
        onMarkerLeave={onMarkerLeave}
      />

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
              "radial-gradient(circle at 38% 34%, #cfe0e6 0%, #a7c4cd 55%, #7ea3ad 100%)",
            opacity: 0.7,
          }}
        />
      </div>
    );
  }
  return <GlobeImpl {...props} />;
}

// Avoid unused warnings for CITIES import (kept for future extension)
void CITIES;

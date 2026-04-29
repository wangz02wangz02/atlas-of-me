"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { geoCircle } from "d3-geo";
import { motion, AnimatePresence } from "motion/react";
import type { Place } from "@/lib/places-types";
import { MODE_STYLE, getResolvedLegs } from "@/lib/places";

const GEO_URL = "/geo/countries-110m.json";

type Props = {
  places: Place[];
  focusedSlug?: string | null;
  autoRotate?: boolean;
  showRoute?: boolean;
  showStars?: boolean;
  showTerminator?: boolean;
  legsThrough?: number | null;
  size?: number;
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
  const decl =
    23.45 * Math.sin(((360 * (dayOfYear - 81)) / 365) * TO_RAD);
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const lon = -((utcHours - 12) * 15);
  return [lon, decl];
}

function NightTerminator({ now }: { now: number }) {
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
      <path d={d} fill="rgba(8, 11, 20, 0.55)" />
      <path
        d={d}
        fill="none"
        stroke="rgba(216, 166, 87, 0.18)"
        strokeWidth={0.8}
      />
    </g>
  );
}

function GlobeImpl({
  places,
  focusedSlug = null,
  autoRotate = false,
  showRoute = true,
  showStars = true,
  showTerminator = true,
  legsThrough = null,
  size = 520,
}: Props) {
  const router = useRouter();
  const [rotate, setRotate] = useState<[number, number, number]>([-15, -25, 0]);
  const [zoom, setZoom] = useState<number>(1);
  const [hovered, setHovered] = useState<Place | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [nowMs, setNowMs] = useState(() => Date.now());

  const dragging = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const interactingAt = useRef<number>(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 1.1 + 0.3,
        o: Math.random() * 0.7 + 0.15,
      })),
    [],
  );

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!autoRotate) return;
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const idle = now - interactingAt.current > 600;
      if (!dragging.current && idle && !hovered) {
        setRotate(([l, p, g]) => [(l + dt * 0.012) % 360, p, g]);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate, hovered]);

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
      setRotate([
        start[0] + dl * k,
        start[1] + (target[1] - start[1]) * k,
        0,
      ]);
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

  // Native wheel listener with passive:false so we can preventDefault and
  // stop the page from scrolling/zooming while the user zooms the globe.
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

  const visibleByPlace = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const p of places) m.set(p.slug, isVisible(p.coordinates, rotate));
    return m;
  }, [places, rotate]);

  const legs = useMemo(() => getResolvedLegs(), []);
  const visibleLegCount = legsThrough ?? legs.length;

  const trackPos = (e: React.PointerEvent) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const projectionScale = (size / 2 - 8) * zoom;

  return (
    <div
      ref={wrapperRef}
      className="relative w-full select-none touch-none"
      style={{ aspectRatio: "1 / 1", maxWidth: size }}
      onPointerDown={onPointerDown}
      onPointerMove={(e) => {
        onPointerMove(e);
        trackPos(e);
      }}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {showStars && (
        <div className="pointer-events-none absolute inset-0">
          {stars.map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-bone"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.s}px`,
                height: `${s.s}px`,
                opacity: s.o,
              }}
            />
          ))}
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(216,166,87,0.10) 47%, rgba(216,166,87,0.18) 49%, rgba(216,166,87,0) 56%)",
        }}
      />

      <ComposableMap
        projection="geoOrthographic"
        projectionConfig={{ scale: projectionScale, rotate }}
        width={size}
        height={size}
        style={{
          width: "100%",
          height: "100%",
          cursor: dragging.current ? "grabbing" : "grab",
        }}
      >
        <defs>
          <radialGradient id="ocean" cx="38%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#1e4566" />
            <stop offset="55%" stopColor="#0e2e4a" />
            <stop offset="100%" stopColor="#061525" />
          </radialGradient>
          <linearGradient id="land" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d6b483" />
            <stop offset="100%" stopColor="#9a7546" />
          </linearGradient>
          <linearGradient id="land-highlight" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f5d8a4" />
            <stop offset="100%" stopColor="#c8975a" />
          </linearGradient>
          <radialGradient id="globe-marker">
            <stop offset="0%" stopColor="#ff8a4a" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#ff8a4a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ff8a4a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="globe-marker-paris">
            <stop offset="0%" stopColor="#fff1c2" stopOpacity="1" />
            <stop offset="50%" stopColor="#ff8a4a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff8a4a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <Sphere
          id="globe-sphere"
          fill="url(#ocean)"
          stroke="#9a7546"
          strokeWidth={0.8}
        />

        <Graticule
          stroke="rgba(216, 166, 87, 0.10)"
          strokeWidth={0.4}
          step={[15, 15]}
        />

        <Geographies geography={GEO_URL}>
          {({
            geographies,
          }: {
            geographies: Array<{
              rsmKey: string;
              properties: { name: string };
            }>;
          }) =>
            geographies.map((geo) => {
              const name = geo.properties?.name ?? "";
              const isMarkerHi =
                hovered != null &&
                name.toLowerCase() === hovered.country.toLowerCase();
              const isCountryHi =
                hoveredCountry !== null && name === hoveredCountry && !hovered;
              const isHi = isMarkerHi || isCountryHi;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => setHoveredCountry(name)}
                  onMouseLeave={() =>
                    setHoveredCountry((c) => (c === name ? null : c))
                  }
                  fill={isHi ? "url(#land-highlight)" : "url(#land)"}
                  stroke={isHi ? "#ff8a4a" : "#6b4d2c"}
                  strokeWidth={isHi ? 0.7 : 0.4}
                  style={{
                    default: { outline: "none", transition: "fill 200ms" },
                    hover: {
                      fill: "url(#land-highlight)",
                      outline: "none",
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

        {showRoute &&
          legs.slice(0, visibleLegCount).map((leg) => {
            const style = MODE_STYLE[leg.mode];
            const isCurrent = legsThrough === leg.index;
            return (
              <Line
                key={leg.index}
                from={leg.fromCoord}
                to={leg.toCoord}
                stroke={style.color}
                strokeWidth={isCurrent ? style.width + 1 : style.width}
                strokeOpacity={isCurrent ? 0.95 : 0.65}
                strokeLinecap="round"
                strokeDasharray={style.dash === "0" ? undefined : style.dash}
                fill="none"
              />
            );
          })}

        {places.map((place) => {
          const visible = visibleByPlace.get(place.slug);
          if (!visible) return null;
          const isHub = place.slug === PARIS_SLUG;
          return (
            <Marker
              key={place.slug}
              coordinates={place.coordinates}
              onMouseEnter={() => setHovered(place)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => router.push(`/places/${place.slug}`)}
              style={{
                default: { cursor: "pointer", outline: "none" },
                hover: { cursor: "pointer", outline: "none" },
                pressed: { cursor: "pointer", outline: "none" },
              }}
            >
              <g>
                <circle
                  r={isHub ? 16 : 10}
                  fill={`url(#${isHub ? "globe-marker-paris" : "globe-marker"})`}
                />
                <circle
                  r={isHub ? 5 : 3.4}
                  fill={isHub ? "#fff1c2" : "#ff8a4a"}
                  stroke="#0b0d10"
                  strokeWidth={1}
                />
              </g>
            </Marker>
          );
        })}
      </ComposableMap>

      <AnimatePresence>
        {hovered && (
          <motion.div
            key={`m-${hovered.slug}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute z-20 hidden md:block"
            style={{
              left: Math.min(pos.x + 16, 9999),
              top: Math.max(pos.y - 10, 0),
            }}
          >
            <div className="rounded-md border border-ink-3 bg-ink-2/95 px-3 py-2 shadow-2xl backdrop-blur-md">
              <div className="font-display text-xl leading-none text-bone">
                {hovered.name}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-bone-dim">
                {hovered.country} · stop {hovered.firstStop}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hoveredCountry && !hovered && (
          <motion.div
            key={`c-${hoveredCountry}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute z-10 hidden md:block"
            style={{
              left: Math.min(pos.x + 14, 9999),
              top: Math.max(pos.y + 12, 0),
            }}
          >
            <div className="rounded-sm border border-ink-3 bg-ink-2/90 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-bone-dim shadow-md backdrop-blur-md">
              {hoveredCountry}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Globe zoom indicator */}
      <div className="pointer-events-none absolute right-2 top-2 rounded-sm border border-ink-3 bg-ink-2/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim/80 backdrop-blur">
        {zoom.toFixed(1)}× · scroll to zoom
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
              "radial-gradient(circle at 38% 34%, #1e4566 0%, #0e2e4a 55%, #061525 100%)",
            opacity: 0.7,
          }}
        />
      </div>
    );
  }
  return <GlobeImpl {...props} />;
}

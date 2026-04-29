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
} from "react-simple-maps";
import { motion, AnimatePresence } from "motion/react";
import type { Place } from "@/lib/places-types";

const GEO_URL = "/geo/countries-110m.json";

type Props = {
  places: Place[];
  /** When non-null, the globe orients toward that place. */
  focusedSlug?: string | null;
  /** Auto-rotate when nothing else is going on. */
  autoRotate?: boolean;
  /** Show the chronological visit-order arcs across the sphere. */
  showRoute?: boolean;
  size?: number;
};

const TO_RAD = Math.PI / 180;

function isVisible(
  coord: [number, number],
  rotate: [number, number, number],
): boolean {
  // d3-geo orthographic looks at [-lambda, -phi]. A point is on the visible
  // hemisphere when the cosine of the angular distance to that look-axis > 0.
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

export default function Globe({
  places,
  focusedSlug = null,
  autoRotate = true,
  showRoute = true,
  size = 520,
}: Props) {
  const router = useRouter();
  const [rotate, setRotate] = useState<[number, number, number]>([-15, -25, 0]);
  const [hovered, setHovered] = useState<Place | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const dragging = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const interactingAt = useRef<number>(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Auto-rotation loop
  useEffect(() => {
    if (!autoRotate) return;
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      // Pause briefly after user interaction
      const idle = now - interactingAt.current > 600;
      if (!dragging.current && idle && !hovered) {
        setRotate(([l, p, g]) => [(l + dt * 0.012) % 360, p, g]);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate, hovered]);

  // Animate to a focused place
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
      // Take the shortest path for lambda
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
      const nl = (l + dx * 0.4) % 360;
      const np = Math.max(-89, Math.min(89, p - dy * 0.4));
      return [nl, np, g];
    });
    interactingAt.current = performance.now();
  };
  const onPointerUp = () => {
    dragging.current = false;
    lastPointer.current = null;
    interactingAt.current = performance.now();
  };

  const visibleByPlace = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const p of places) m.set(p.slug, isVisible(p.coordinates, rotate));
    return m;
  }, [places, rotate]);

  const legs = useMemo(() => {
    const chrono = [...places].sort((a, b) =>
      a.visitedAt.localeCompare(b.visitedAt),
    );
    const out: { from: [number, number]; to: [number, number]; key: string }[] =
      [];
    for (let i = 1; i < chrono.length; i++) {
      out.push({
        from: chrono[i - 1].coordinates,
        to: chrono[i].coordinates,
        key: `${chrono[i - 1].slug}->${chrono[i].slug}`,
      });
    }
    return out;
  }, [places]);

  const trackPos = (e: React.PointerEvent) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

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
      <ComposableMap
        projection="geoOrthographic"
        projectionConfig={{ scale: size / 2 - 8, rotate }}
        width={size}
        height={size}
        style={{
          width: "100%",
          height: "100%",
          cursor: dragging.current ? "grabbing" : "grab",
        }}
      >
        <defs>
          <radialGradient id="ocean" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#1b2433" />
            <stop offset="80%" stopColor="#0e131c" />
            <stop offset="100%" stopColor="#0b0d10" />
          </radialGradient>
          <radialGradient id="rim" cx="50%" cy="50%" r="50%">
            <stop offset="92%" stopColor="#d8a657" stopOpacity="0" />
            <stop offset="98%" stopColor="#d8a657" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#d8a657" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="globe-country" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#384352" />
            <stop offset="100%" stopColor="#202935" />
          </linearGradient>
          <radialGradient id="globe-marker">
            <stop offset="0%" stopColor="#d8a657" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#d8a657" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#d8a657" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ocean */}
        <Sphere
          id="globe-sphere"
          fill="url(#ocean)"
          stroke="#3a4554"
          strokeWidth={0.6}
        />
        {/* Latitude/longitude grid */}
        <Graticule stroke="#2a3340" strokeWidth={0.4} step={[15, 15]} />
        {/* Rim glow */}
        <Sphere
          id="globe-rim"
          fill="url(#rim)"
          stroke="transparent"
          strokeWidth={0}
        />

        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="url(#globe-country)"
                stroke="#475263"
                strokeWidth={0.4}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "#4a5667", outline: "none" },
                  pressed: { fill: "#4a5667", outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {showRoute &&
          legs.map((leg) => (
            <Line
              key={leg.key}
              from={leg.from}
              to={leg.to}
              stroke="#d8a657"
              strokeWidth={0.8}
              strokeOpacity={0.55}
              strokeLinecap="round"
              strokeDasharray="2 4"
              fill="none"
            />
          ))}

        {places.map((place) => {
          const visible = visibleByPlace.get(place.slug);
          if (!visible) return null;
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
                <circle r={14} fill="url(#globe-marker)" />
                <circle
                  r={5}
                  className="marker-pulse"
                  fill="none"
                  stroke="#d8a657"
                  strokeWidth={1}
                  style={{ transformOrigin: "center" }}
                />
                <circle
                  r={3.5}
                  fill="#d8a657"
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
            key={hovered.slug}
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
                {hovered.country} · {hovered.year}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

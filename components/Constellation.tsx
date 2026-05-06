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
 *  through every visited stop in journey order. */
function ConstellationLines({
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

const ConstellationSVG = memo(function ConstellationSVG({
  places,
  rotate,
  zoom,
  size,
  hoveredCountry,
  legsThrough,
  focusedSlug,
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
          <stop offset="0%" stopColor="#0c1424" />
          <stop offset="60%" stopColor="#070c18" />
          <stop offset="100%" stopColor="#020409" />
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
          <ConstellationLines points={linePoints} color="rgba(253, 232, 184, 0.08)" width={2.4} />
          <ConstellationLines points={linePoints} color="rgba(253, 232, 184, 0.55)" width={0.6} />
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

      {/* Stars (visible places) */}
      {places.map((place) => {
        if (!visibleByPlace.get(place.slug)) return null;
        const score = density.get(place.slug) ?? 1;
        const t = score / maxScore;
        const r = 1.4 + t * 3.2;
        const isHi =
          hoveredCountry !== null &&
          place.country.toLowerCase() === hoveredCountry.toLowerCase();
        return (
          <Marker key={place.slug} coordinates={place.coordinates}>
            <g pointerEvents="none">
              <circle
                r={r * 4}
                fill={isHi ? "url(#star-hi-glow)" : "url(#star-glow)"}
              />
              <circle
                r={r}
                fill={isHi ? "#ffffff" : "#fde8b8"}
                filter="url(#star-blur)"
              />
              <circle r={r * 0.45} fill="#ffffff" />
            </g>
          </Marker>
        );
      })}

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

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
          "radial-gradient(circle at 50% 50%, rgba(253,232,184,0.10) 47%, rgba(253,232,184,0.18) 49%, rgba(253,232,184,0) 56%)",
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
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_38%_34%,#0c1424_0%,#070c18_55%,#020409_100%)] opacity-80" />
      </div>
    );
  }
  return <ConstellationImpl {...props} />;
}

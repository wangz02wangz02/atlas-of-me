"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from "react-simple-maps";
import { motion, AnimatePresence } from "motion/react";
import type { Place, Continent } from "@/lib/places-types";

const GEO_URL = "/geo/countries-110m.json";

type Props = {
  places: Place[];
  filterContinent?: Continent | "All";
  center: [number, number];
  zoom: number;
  /** Show the chronological visit-order arcs. */
  showRoute?: boolean;
  /** Optionally control panning programmatically. */
  onMoveEnd?: (pos: { coordinates: [number, number]; zoom: number }) => void;
};

export default function WorldMap({
  places,
  filterContinent = "All",
  center,
  zoom,
  showRoute = true,
  onMoveEnd,
}: Props) {
  const router = useRouter();
  const [hovered, setHovered] = useState<Place | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const dimmed = useMemo(
    () =>
      filterContinent === "All"
        ? new Set<string>()
        : new Set(
            places
              .filter((p) => p.continent !== filterContinent)
              .map((p) => p.slug),
          ),
    [places, filterContinent],
  );

  // Chronologically-ordered legs for the constellation route
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

  return (
    <div
      className="relative w-full select-none"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 165 }}
        width={980}
        height={520}
        style={{ width: "100%", height: "auto" }}
      >
        <defs>
          <linearGradient id="country-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2a3340" />
            <stop offset="100%" stopColor="#1a2230" />
          </linearGradient>
          <linearGradient id="country-fill-hover" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3a4554" />
            <stop offset="100%" stopColor="#2a3340" />
          </linearGradient>
          <radialGradient id="marker-glow">
            <stop offset="0%" stopColor="#d8a657" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#d8a657" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#d8a657" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ZoomableGroup
          center={center}
          zoom={zoom}
          minZoom={1}
          maxZoom={6}
          translateExtent={[
            [-200, -120],
            [1180, 640],
          ]}
          onMoveEnd={onMoveEnd}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="url(#country-fill)"
                  stroke="#3a4554"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "url(#country-fill-hover)", outline: "none" },
                    pressed: { fill: "url(#country-fill-hover)", outline: "none" },
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
                strokeWidth={0.7}
                strokeLinecap="round"
                strokeDasharray="2 4"
                strokeOpacity={0.45}
                fill="none"
              />
            ))}

          {places.map((place) => {
            const isDim = dimmed.has(place.slug);
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
                <g
                  style={{
                    opacity: isDim ? 0.18 : 1,
                    transition: "opacity 300ms ease",
                  }}
                >
                  <circle r={16} fill="url(#marker-glow)" />
                  <circle
                    r={6}
                    className="marker-pulse"
                    fill="none"
                    stroke="#d8a657"
                    strokeWidth={1.2}
                    style={{ transformOrigin: "center" }}
                  />
                  <circle
                    r={4}
                    fill="#d8a657"
                    stroke="#0b0d10"
                    strokeWidth={1.2}
                  />
                </g>
              </Marker>
            );
          })}
        </ZoomableGroup>
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
              <div className="mt-2 max-w-[240px] text-sm italic text-bone/80">
                &ldquo;{hovered.tagline}&rdquo;
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

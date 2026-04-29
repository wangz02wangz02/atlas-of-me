"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { motion, AnimatePresence } from "motion/react";
import type { Place, Continent } from "@/lib/places";

const GEO_URL = "/geo/countries-110m.json";

type Props = {
  places: Place[];
  /** When provided, only places matching this continent are highlighted; others are dimmed. */
  filterContinent?: Continent | "All";
};

export default function WorldMap({ places, filterContinent = "All" }: Props) {
  const router = useRouter();
  const [hovered, setHovered] = useState<Place | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const visible = useMemo(
    () =>
      filterContinent === "All"
        ? places
        : places.filter((p) => p.continent === filterContinent),
    [places, filterContinent],
  );

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
            <stop offset="0%" stopColor="#161b22" />
            <stop offset="100%" stopColor="#0f1318" />
          </linearGradient>
          <radialGradient id="marker-glow">
            <stop offset="0%" stopColor="#d8a657" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#d8a657" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#d8a657" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ZoomableGroup center={[10, 20]} zoom={1} minZoom={1} maxZoom={5}>
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="url(#country-fill)"
                  stroke="#1f2630"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#1f2630", outline: "none" },
                    pressed: { fill: "#1f2630", outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

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
                  <circle r={14} fill="url(#marker-glow)" />
                  <circle
                    r={5}
                    className="marker-pulse"
                    fill="none"
                    stroke="#d8a657"
                    strokeWidth={1.2}
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
        </ZoomableGroup>
      </ComposableMap>

      {/* Hover preview card */}
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
            <div className="rounded-md border border-ink-3 bg-ink-2/90 px-3 py-2 backdrop-blur-md shadow-2xl">
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

      <div className="pointer-events-none absolute bottom-3 right-4 font-mono text-[10px] uppercase tracking-[0.2em] text-bone-dim/60">
        {visible.length}/{places.length} places shown
      </div>
    </div>
  );
}

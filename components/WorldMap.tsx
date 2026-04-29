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
import { MODE_STYLE, getResolvedLegs } from "@/lib/places";

const GEO_URL = "/geo/countries-110m.json";

type Props = {
  places: Place[];
  filterContinent?: Continent | "All";
  center: [number, number];
  zoom: number;
  showRoute?: boolean;
  legsThrough?: number | null;
  onMoveEnd?: (pos: { coordinates: [number, number]; zoom: number }) => void;
};

const PARIS_SLUG = "paris";

export default function WorldMap({
  places,
  filterContinent = "All",
  center,
  zoom,
  showRoute = true,
  legsThrough = null,
  onMoveEnd,
}: Props) {
  const router = useRouter();
  const [hovered, setHovered] = useState<Place | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
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

  const legs = useMemo(() => getResolvedLegs(), []);
  const visibleLegCount = legsThrough ?? legs.length;

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
          <linearGradient id="country-fill-highlight" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#5a6a7d" />
            <stop offset="100%" stopColor="#3a4554" />
          </linearGradient>
          <radialGradient id="marker-glow">
            <stop offset="0%" stopColor="#d8a657" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#d8a657" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#d8a657" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="paris-glow">
            <stop offset="0%" stopColor="#fff1c2" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#ff8a4a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ff8a4a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ZoomableGroup
          center={center}
          zoom={zoom}
          minZoom={1}
          maxZoom={12}
          translateExtent={[
            [-200, -120],
            [1180, 640],
          ]}
          onMoveEnd={onMoveEnd}
        >
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
                const isMarkerHighlight =
                  hovered != null &&
                  name.toLowerCase() === hovered.country.toLowerCase();
                const isCountryHover =
                  hoveredCountry !== null &&
                  name === hoveredCountry &&
                  !hovered;
                const isHi = isMarkerHighlight || isCountryHover;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setHoveredCountry(name)}
                    onMouseLeave={() =>
                      setHoveredCountry((c) => (c === name ? null : c))
                    }
                    fill={
                      isHi
                        ? "url(#country-fill-highlight)"
                        : "url(#country-fill)"
                    }
                    stroke={isHi ? "#d8a657" : "#3a4554"}
                    strokeWidth={isHi ? 0.9 : 0.5}
                    style={{
                      default: { outline: "none", transition: "fill 200ms" },
                      hover: {
                        fill: "url(#country-fill-highlight)",
                        outline: "none",
                      },
                      pressed: {
                        fill: "url(#country-fill-highlight)",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>

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
                  strokeOpacity={isCurrent ? 0.95 : 0.55}
                  strokeLinecap="round"
                  strokeDasharray={style.dash === "0" ? undefined : style.dash}
                  fill="none"
                />
              );
            })}

          {places.map((place) => {
            const isDim = dimmed.has(place.slug);
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
                <g
                  style={{
                    opacity: isDim ? 0.18 : 1,
                    transition: "opacity 300ms ease",
                  }}
                >
                  <circle
                    r={isHub ? 18 : 10}
                    fill={`url(#${isHub ? "paris-glow" : "marker-glow"})`}
                  />
                  <circle
                    r={isHub ? 5 : 3.2}
                    fill={isHub ? "#fff1c2" : "#d8a657"}
                    stroke="#0b0d10"
                    strokeWidth={1}
                  />
                </g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Marker hover card (priority) */}
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
                {hovered.stops.length > 1 ? ` (×${hovered.stops.length})` : ""}
              </div>
              <div className="mt-2 max-w-[240px] text-sm italic text-bone/80">
                &ldquo;{hovered.tagline}&rdquo;
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Country name tooltip (only when no marker hover is active) */}
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
    </div>
  );
}

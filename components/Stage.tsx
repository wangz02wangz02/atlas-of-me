"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Globe from "./Globe";
import WorldMap from "./WorldMap";
import HoverDrawer from "./HoverDrawer";
import JourneyFilmstrip from "./JourneyFilmstrip";
import LayersPanel, { type Layers } from "./LayersPanel";
import HoveredPlaceCard from "./HoveredPlaceCard";
import PlaceDetailClient from "./PlaceDetailClient";
import { LEGS, CITIES, CONTINENT_VIEW } from "@/lib/places";
import type { Place } from "@/lib/places-types";

type View = "globe" | "flat";

const DEFAULT_LAYERS: Layers = {
  trail: true,
  dayNight: true,
  clocks: false,
  landmarks: false,
};

export default function Stage({ places }: { places: Place[] }) {
  const [view, setView] = useState<View>("globe");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null);
  const [stop, setStop] = useState<number>(0);
  const [layers, setLayers] = useState<Layers>(DEFAULT_LAYERS);
  const [center, setCenter] = useState<[number, number]>(CONTINENT_VIEW.All.center);
  const [zoom, setZoom] = useState<number>(CONTINENT_VIEW.All.zoom);

  const placesByCountry = useMemo(() => {
    const m = new Map<string, Place>();
    for (const p of places) m.set(p.country.toLowerCase(), p);
    return m;
  }, [places]);
  const placeSlugs = useMemo(() => new Set(places.map((p) => p.slug)), [places]);

  const openPlace = openSlug ? places.find((p) => p.slug === openSlug) ?? null : null;
  const hoveredPlace = hoveredCountry
    ? placesByCountry.get(hoveredCountry.toLowerCase()) ?? null
    : null;

  // Currently focused place from timeline (for the on-map pulse + caption)
  const focusedPlace = focusedSlug ? places.find((p) => p.slug === focusedSlug) : null;

  useEffect(() => {
    if (!openSlug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenSlug(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSlug]);

  // When the user scrubs the timeline, fly to that stop
  useEffect(() => {
    if (stop <= 0 || stop > LEGS.length + 1) return;
    const slug = stop === 1 ? LEGS[0].from : LEGS[stop - 2].to;
    const target = CITIES[slug];
    if (!target) return;
    setFocusedSlug(slug);
    setCenter(target.coordinates);
    setZoom((z) => (view === "flat" ? Math.max(z, 3) : 2.6));
  }, [stop, view]);

  // Stable callbacks — these are passed into memoized Globe/WorldMap children
  const onCountryHover = useCallback((c: string | null) => setHoveredCountry(c), []);
  const onCountryClick = useCallback(
    (countryName: string) => {
      const place = placesByCountry.get(countryName.toLowerCase());
      if (place) setOpenSlug(place.slug);
    },
    [placesByCountry],
  );
  const onMoveEnd = useCallback(
    ({ coordinates, zoom: z }: { coordinates: [number, number]; zoom: number }) => {
      setCenter(coordinates);
      setZoom(z);
    },
    [],
  );

  const legsThrough = stop > 0 && stop <= LEGS.length ? stop : null;

  const zoomIn = () => setZoom((z) => Math.min(14, z * 1.4));
  const zoomOut = () => setZoom((z) => Math.max(1, z / 1.4));
  const resetView = () => {
    setStop(0);
    setFocusedSlug(null);
    setCenter(CONTINENT_VIEW.All.center);
    setZoom(CONTINENT_VIEW.All.zoom);
  };

  return (
    <div className="relative h-svh w-screen overflow-hidden">
      {/* Wordmark — small, top-left */}
      <div className="pointer-events-none fixed left-6 top-6 z-10">
        <div className="text-[9px] uppercase tracking-[0.32em] text-ink-faint">
          A travel journal
        </div>
        <div className="font-display text-2xl text-ink">
          Atlas <span className="italic text-amber">of</span> Me
        </div>
      </div>

      {/* Hovered-country card (top-left under the wordmark) */}
      <HoveredPlaceCard place={hoveredPlace} />

      {/* Map / Globe stage */}
      <motion.div
        animate={{
          scale: openSlug ? 0.94 : 1,
          opacity: openSlug ? 0.35 : 1,
          filter: openSlug ? "blur(4px)" : "blur(0px)",
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 grid place-items-center"
      >
        {view === "globe" ? (
          <div className="w-[min(86vh,86vw)] max-w-[860px]">
            <Globe
              places={places}
              focusedSlug={focusedSlug}
              legsThrough={legsThrough}
              size={860}
              placeSlugs={placeSlugs}
              showRoute={layers.trail}
              showTerminator={layers.dayNight}
              showClocks={layers.clocks}
              showLandmarks={layers.landmarks}
              onCountryHover={onCountryHover}
              onCountryClick={onCountryClick}
            />
          </div>
        ) : (
          <div className="w-[min(96vw,1280px)]">
            <WorldMap
              places={places}
              center={center}
              zoom={zoom}
              legsThrough={legsThrough}
              focusedSlug={focusedSlug}
              placeSlugs={placeSlugs}
              showRoute={layers.trail}
              showTerminator={layers.dayNight}
              showClocks={layers.clocks}
              showLandmarks={layers.landmarks}
              onMoveEnd={onMoveEnd}
              onCountryHover={onCountryHover}
              onCountryClick={onCountryClick}
            />
          </div>
        )}
      </motion.div>

      {/* Flat-only zoom controls */}
      {view === "flat" && (
        <div className="pointer-events-auto fixed right-6 top-24 z-20 flex flex-col gap-1">
          <ZoomBtn label="+" onClick={zoomIn} />
          <ZoomBtn label="−" onClick={zoomOut} />
          <ZoomBtn label="◯" onClick={resetView} title="Reset view" />
        </div>
      )}

      {/* Timeline focus caption — floats above the filmstrip */}
      <AnimatePresence>
        {focusedPlace && (
          <motion.div
            key={focusedPlace.slug}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none fixed inset-x-0 bottom-[78px] z-20 flex justify-center"
          >
            <div className="rounded-md border border-paper-3 bg-paper/95 px-3 py-1.5 shadow-md backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.3em] text-amber">
                Stop {stop > 0 ? stop : focusedPlace.firstStop}
              </span>
              <span className="ml-2 font-display text-base text-ink">
                {focusedPlace.name}
              </span>
              <span className="ml-2 text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                {focusedPlace.country}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filmstrip timeline */}
      <JourneyFilmstrip
        value={stop > 0 ? stop : LEGS.length + 1}
        onHover={(s) => s !== null && setStop(s)}
        onSelect={(s) => setStop(s)}
      />

      {/* Bottom hover drawer — view selection */}
      <HoverDrawer side="bottom">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
            Map view
          </span>
          <div className="inline-flex rounded-full border border-paper-3 p-0.5">
            {(["globe", "flat"] as const).map((v) => {
              const active = view === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    active
                      ? "bg-amber/15 text-amber"
                      : "text-ink-faint hover:text-ink"
                  }`}
                >
                  {v === "globe" ? "Sphere" : "Flat"}
                </button>
              );
            })}
          </div>
          <div className="h-5 w-px bg-paper-3" />
          <button
            type="button"
            onClick={resetView}
            className="text-[11px] uppercase tracking-[0.22em] text-ink-faint transition hover:text-amber"
          >
            ◯ Reset
          </button>
          <button
            type="button"
            onClick={() => {
              const pick = places[Math.floor(Math.random() * places.length)];
              if (pick) setOpenSlug(pick.slug);
            }}
            className="text-[11px] uppercase tracking-[0.22em] text-ink-faint transition hover:text-amber"
          >
            ✦ Surprise me
          </button>
        </div>
      </HoverDrawer>

      {/* Right hover drawer — map-wide LAYERS */}
      <HoverDrawer side="right">
        <LayersPanel layers={layers} onChange={setLayers} />
      </HoverDrawer>

      {/* Detail overlay */}
      <AnimatePresence>
        {openPlace && (
          <motion.div
            key={openPlace.slug}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-paper/60 backdrop-blur-sm"
            onClick={() => setOpenSlug(null)}
          >
            <motion.div
              initial={{ y: 40, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 30, scale: 0.97, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 240,
                damping: 28,
                mass: 0.9,
              }}
              className="my-6 w-full max-w-5xl rounded-xl border border-paper-3 bg-paper shadow-[0_30px_80px_rgba(60,40,12,0.18)]"
              onClick={(e) => e.stopPropagation()}
            >
              <PlaceDetailClient
                place={openPlace}
                asOverlay
                onClose={() => setOpenSlug(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ZoomBtn({
  label,
  onClick,
  title,
}: {
  label: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="grid h-9 w-9 place-items-center rounded-md border border-paper-3 bg-paper/95 text-ink-faint shadow-sm backdrop-blur transition hover:border-amber hover:text-amber"
    >
      {label}
    </button>
  );
}

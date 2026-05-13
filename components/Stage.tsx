"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import Globe from "./Globe";
import WorldMap from "./WorldMap";
import Constellation from "./Constellation";
import HoverDrawer from "./HoverDrawer";
import JourneyFilmstrip from "./JourneyFilmstrip";
import LayersPanel, { type Layers } from "./LayersPanel";
import HoveredPlaceCard from "./HoveredPlaceCard";
import NextDestinations from "./NextDestinations";
import PlaceDetailClient from "./PlaceDetailClient";
import { LEGS, CITIES, CONTINENT_VIEW } from "@/lib/places";
import type { Place } from "@/lib/places-types";

type View = "globe" | "flat" | "memories";

const DEFAULT_LAYERS: Layers = {
  trail: true,
  dayNight: false,
  clocks: false,
  landmarks: false,
  heatmap: false,
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
  const [randomSpinning, setRandomSpinning] = useState<boolean>(false);
  const overlayScrollRef = useRef<HTMLDivElement>(null);

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
  const focusedPlace = focusedSlug ? places.find((p) => p.slug === focusedSlug) : null;

  // ESC + body scroll lock + scroll-to-top of modal whenever a new place opens
  useEffect(() => {
    if (!openSlug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenSlug(null);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openSlug]);

  useEffect(() => {
    if (!openSlug) return;
    requestAnimationFrame(() => {
      overlayScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [openSlug]);

  // Track the *latest* view inside a ref so the stop-scrub effect can read it
  // without forcing a re-run when only the view changes.  Previously this
  // useEffect listed `view` in its deps, which meant switching from Globe to
  // Flat would call setZoom(Math.max(z, 3)) and slam the flat map into a
  // zoomed-in state with no scrubbing involved.
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Timeline scrub → fly to that stop
  useEffect(() => {
    if (stop <= 0 || stop > LEGS.length + 1) return;
    const slug = stop === 1 ? LEGS[0].from : LEGS[stop - 2].to;
    const target = CITIES[slug];
    if (!target) return;
    setFocusedSlug(slug);
    setCenter(target.coordinates);
    setZoom((z) =>
      viewRef.current === "flat" ? Math.max(z, 3) : 2.6,
    );
  }, [stop]);

  // View change → reset to view-appropriate defaults.  Flat map should always
  // start "All" view (full world, zoom 0.85) when the user switches into it
  // unless they're actively scrubbing.
  useEffect(() => {
    if (view === "flat" && stop <= 0) {
      setCenter(CONTINENT_VIEW.All.center);
      setZoom(CONTINENT_VIEW.All.zoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

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
      // Wrap longitude into [-180, 180] so the flat map's three-copy wrap looks
      // seamless after a long drag. Vertical pan is clamped by translateExtent.
      const wrapLon = (lon: number) =>
        ((((lon + 180) % 360) + 360) % 360) - 180;
      setCenter([wrapLon(coordinates[0]), coordinates[1]]);
      setZoom(z);
    },
    [],
  );

  // Anchor for the "Where next?" prediction. If the user is focused on a stop,
  // predict from there; otherwise default to the last city in the journey.
  const predictFromSlug =
    focusedSlug ?? LEGS[LEGS.length - 1]?.to ?? null;
  const predictFromName = predictFromSlug
    ? CITIES[predictFromSlug]?.name ?? null
    : null;

  const legsThrough = stop > 0 && stop <= LEGS.length ? stop : null;
  // Active leg = the leg that just brought the traveler to the focused stop.
  // stop=0 → "view all" → show plane parked at journey's end.
  // stop=1 → origin city, no arrival yet → no plane.
  // stop=N (2..LEGS.length+1) → legs[N-2].
  const activeLegIndex =
    stop === 0
      ? LEGS.length - 1
      : stop >= 2 && stop <= LEGS.length + 1
        ? Math.min(stop - 2, LEGS.length - 1)
        : null;

  const zoomIn = () => setZoom((z) => Math.min(14, z * 1.4));
  const zoomOut = () => setZoom((z) => Math.max(0.6, z / 1.4));
  const resetView = () => {
    setStop(0);
    setFocusedSlug(null);
    setCenter(CONTINENT_VIEW.All.center);
    setZoom(CONTINENT_VIEW.All.zoom);
  };

  // Random Place: spin briefly through random stops, then open one
  const triggerRandom = () => {
    if (randomSpinning) return;
    setRandomSpinning(true);
    let count = 0;
    const total = 8;
    const tick = () => {
      const pick = places[Math.floor(Math.random() * places.length)];
      if (pick) {
        setFocusedSlug(pick.slug);
        setCenter(pick.coordinates);
      }
      count++;
      if (count < total) {
        window.setTimeout(tick, 110 + count * 25);
      } else {
        const final = places[Math.floor(Math.random() * places.length)];
        if (final) {
          setFocusedSlug(final.slug);
          setCenter(final.coordinates);
          window.setTimeout(() => {
            setOpenSlug(final.slug);
            setRandomSpinning(false);
          }, 380);
        } else {
          setRandomSpinning(false);
        }
      }
    };
    tick();
  };

  return (
    <div className="relative h-svh w-screen overflow-hidden">
      {/* Wordmark */}
      <div className="pointer-events-none fixed left-6 top-6 z-10">
        <div className="text-[9px] uppercase tracking-[0.32em] text-ink-faint">
          A travel journal
        </div>
        <div className="font-display text-2xl text-ink">
          Atlas <span className="italic text-amber">of</span> Me
        </div>
      </div>

      <HoveredPlaceCard place={hoveredPlace} />

      {/* Map / globe / constellation stage */}
      <motion.div
        animate={{
          scale: openSlug ? 0.94 : 1,
          opacity: openSlug ? 0.35 : 1,
          filter: openSlug ? "blur(4px)" : "blur(0px)",
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 grid place-items-center"
      >
        <AnimatePresence mode="wait">
          {view === "globe" && (
            <motion.div
              key="globe"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-[min(86vh,86vw)] max-w-[860px]"
            >
              <Globe
                places={places}
                focusedSlug={focusedSlug}
                legsThrough={legsThrough}
                size={860}
                sparkle={randomSpinning}
                placeSlugs={placeSlugs}
                showRoute={layers.trail}
                showTerminator={layers.dayNight}
                showClocks={layers.clocks}
                showLandmarks={layers.landmarks}
                showHeatmap={layers.heatmap}
                onCountryHover={onCountryHover}
                onCountryClick={onCountryClick}
              />
            </motion.div>
          )}
          {view === "flat" && (
            <motion.div
              key="flat"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.32 }}
              className="w-[min(96vw,1500px)]"
            >
              <WorldMap
                places={places}
                center={center}
                zoom={zoom}
                legsThrough={legsThrough}
                activeLegIndex={activeLegIndex}
                focusedSlug={focusedSlug}
                sparkle={randomSpinning}
                placeSlugs={placeSlugs}
                showRoute={layers.trail}
                showTerminator={layers.dayNight}
                showClocks={layers.clocks}
                showLandmarks={layers.landmarks}
                showHeatmap={layers.heatmap}
                onMoveEnd={onMoveEnd}
                onCountryHover={onCountryHover}
                onCountryClick={onCountryClick}
              />
            </motion.div>
          )}
          {view === "memories" && (
            <motion.div
              key="memories"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-[min(86vh,86vw)] max-w-[860px]"
            >
              <Constellation
                places={places}
                focusedSlug={focusedSlug}
                legsThrough={legsThrough}
                size={860}
                onCountryHover={onCountryHover}
                onCountryClick={onCountryClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Memories mode: night sky background */}
      <AnimatePresence>
        {view === "memories" && (
          <motion.div
            key="memories-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none fixed inset-0 -z-10"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, #3b4570 0%, #1d2340 55%, #0e1426 100%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Flat-only zoom controls */}
      {view === "flat" && (
        <div className="pointer-events-auto fixed right-6 top-24 z-20 flex flex-col gap-1">
          <ZoomBtn label="+" onClick={zoomIn} />
          <ZoomBtn label="−" onClick={zoomOut} />
          <ZoomBtn label="◯" onClick={resetView} title="Reset view" />
        </div>
      )}

      {/* Timeline focus caption */}
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
            <div
              className={`rounded-md border px-3 py-1.5 shadow-md backdrop-blur-md ${
                view === "memories"
                  ? "border-white/20 bg-black/55"
                  : "border-paper-3 bg-paper/95"
              }`}
            >
              <span className="text-[10px] uppercase tracking-[0.3em] text-amber">
                Stop {stop > 0 ? stop : focusedPlace.firstStop}
              </span>
              <span
                className={`ml-2 font-display text-base ${
                  view === "memories" ? "text-paper" : "text-ink"
                }`}
              >
                {focusedPlace.name}
              </span>
              <span
                className={`ml-2 text-[10px] uppercase tracking-[0.22em] ${
                  view === "memories" ? "text-paper/70" : "text-ink-faint"
                }`}
              >
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

      {/* Bottom hover touchbar */}
      <HoverDrawer side="bottom">
        <div className="flex items-center gap-1">
          <TouchbarButton
            active={view === "globe"}
            onClick={() => setView("globe")}
            label="Globe"
            icon="◯"
          />
          <TouchbarButton
            active={view === "flat"}
            onClick={() => setView("flat")}
            label="Flat Map"
            icon="▭"
          />
          <TouchbarButton
            active={view === "memories"}
            onClick={() => setView("memories")}
            label="Memories"
            icon="✦"
          />
          <div className="mx-1 h-7 w-px bg-paper-3" />
          <TouchbarButton
            active={false}
            onClick={triggerRandom}
            label={randomSpinning ? "Spinning…" : "Random Place"}
            icon="✺"
            disabled={randomSpinning}
          />
          <div className="mx-1 h-7 w-px bg-paper-3" />
          <Link
            href="/passport"
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-ink-faint transition hover:bg-paper-2 hover:text-ink"
            title="Open travel passport"
          >
            <span aria-hidden className="text-[13px] leading-none">⌬</span>
            <span>Passport</span>
          </Link>
          <div className="mx-1 h-7 w-px bg-paper-3" />
          <button
            type="button"
            onClick={resetView}
            className="rounded-md px-2 py-1.5 text-[11px] uppercase tracking-[0.22em] text-ink-faint transition hover:text-amber"
          >
            ◯ Reset
          </button>
        </div>
      </HoverDrawer>

      {/* Right hover drawer — layers + where-next predictions */}
      <HoverDrawer side="right">
        <div className="flex flex-col gap-3">
          <LayersPanel layers={layers} onChange={setLayers} />
          <NextDestinations
            fromSlug={predictFromSlug}
            fromName={predictFromName}
          />
        </div>
      </HoverDrawer>

      {/* Detail overlay */}
      <AnimatePresence>
        {openPlace && (
          <motion.div
            key={openPlace.slug}
            ref={overlayScrollRef}
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

function TouchbarButton({
  active,
  onClick,
  label,
  icon,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "bg-amber/15 text-amber"
          : "text-ink-faint hover:bg-paper-2 hover:text-ink"
      }`}
    >
      <span aria-hidden className="text-[13px] leading-none">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

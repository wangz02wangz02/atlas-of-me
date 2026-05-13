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
import UniverseBackdrop from "./UniverseBackdrop";
import ActivitiesPanel from "./ActivitiesPanel";
import AmbientPlayer from "./AmbientPlayer";
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
  // Camera offset shared by Globe + UniverseBackdrop. Dragging the Earth
  // moves the camera, which drifts the planets and starfield in parallax —
  // makes the whole scene feel like a 3rd-person flight around the orb.
  const [cameraOffset, setCameraOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  // Toggle for the Where-Next overlay (formerly in the right hover drawer).
  const [wheresNextOpen, setWheresNextOpen] = useState(false);
  const [activitiesOpen, setActivitiesOpen] = useState(false);
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
  // unless they're actively scrubbing.  Camera offset is also reset so
  // the universe view is recentered on entry.
  useEffect(() => {
    if (view === "flat" && stop <= 0) {
      setCenter(CONTINENT_VIEW.All.center);
      setZoom(CONTINENT_VIEW.All.zoom);
    }
    setCameraOffset({ x: 0, y: 0 });
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
      {/* Wordmark — theme-aware so it reads on both the paper flat map and
       *  the universe backdrop. */}
      <div className="pointer-events-none fixed left-6 top-6 z-30">
        <div
          className={`text-[9px] uppercase tracking-[0.32em] ${
            view === "flat" ? "text-ink-faint" : "text-paper/55"
          }`}
        >
          A travel journal
        </div>
        <div
          className={`font-display text-2xl ${
            view === "flat" ? "text-ink" : "text-paper"
          }`}
        >
          Atlas <span className="italic text-amber">of</span> Me
        </div>
      </div>

      <HoveredPlaceCard place={hoveredPlace} />

      {/* Ambient music toggle — top-right speaker pill. Default off. */}
      <AmbientPlayer />

      {/* Universe backdrop for Globe and Memories views — rendered BEFORE
       *  the stage in DOM order AND with a low z-index so it stays beneath
       *  the focal orb. (Previously this rendered after the stage and was
       *  painting over the globe — making the globe appear to disappear.) */}
      <AnimatePresence>
        {(view === "globe" || view === "memories") && (
          <motion.div
            key={`bg-${view}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <UniverseBackdrop
              palette={view === "memories" ? "memories" : "globe"}
              cameraOffset={cameraOffset}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map / globe / constellation stage */}
      <motion.div
        animate={{
          scale: openSlug ? 0.94 : 1,
          opacity: openSlug ? 0.35 : 1,
          filter: openSlug ? "blur(4px)" : "blur(0px)",
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 z-20 grid place-items-center"
      >
        <AnimatePresence mode="wait">
          {view === "globe" && (
            <motion.div
              key="globe"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-[min(72vmin,900px)]"
            >
              <Globe
                places={places}
                focusedSlug={focusedSlug}
                legsThrough={legsThrough}
                size={900}
                sparkle={randomSpinning}
                cameraOffset={cameraOffset}
                onCameraChange={(next) => {
                  // Clamp so the Earth never gets dragged fully off
                  // screen. Keep the orb's center within ~viewport/2 of
                  // the natural center on each axis.
                  if (typeof window === "undefined") {
                    setCameraOffset(next);
                    return;
                  }
                  const limX = window.innerWidth * 0.45;
                  const limY = window.innerHeight * 0.45;
                  setCameraOffset({
                    x: Math.max(-limX, Math.min(limX, next.x)),
                    y: Math.max(-limY, Math.min(limY, next.y)),
                  });
                }}
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
              className="absolute inset-0 flex items-center justify-center"
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
              className="w-[min(72vmin,900px)]"
            >
              <Constellation
                places={places}
                focusedSlug={focusedSlug}
                legsThrough={legsThrough}
                size={900}
                onCountryHover={onCountryHover}
                onCountryClick={onCountryClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tiny hint about the globe's drag behavior — fades out after 8s.
       *  Keeps it discoverable without permanent UI clutter. */}
      {view === "globe" && <GlobeHint />}

      {/* Flat-only zoom controls */}
      {view === "flat" && (
        <div className="pointer-events-auto fixed right-6 top-24 z-30 flex flex-col gap-1">
          <ZoomBtn label="+" onClick={zoomIn} />
          <ZoomBtn label="−" onClick={zoomOut} />
          <ZoomBtn label="◯" onClick={resetView} title="Reset view" />
        </div>
      )}

      {/* Filmstrip timeline — glass capsule pinned to bottom.
       *  Theme switches to dark on globe / memories views (universe backdrop)
       *  and stays light on the flat paper map. */}
      <JourneyFilmstrip
        value={stop > 0 ? stop : LEGS.length + 1}
        onHover={(s) => s !== null && setStop(s)}
        onSelect={(s) => setStop(s)}
        dark={view !== "flat"}
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
          <TouchbarButton
            active={wheresNextOpen}
            onClick={() => setWheresNextOpen(true)}
            label="Where next?"
            icon="➤"
          />
          <TouchbarButton
            active={activitiesOpen}
            onClick={() => setActivitiesOpen(true)}
            label="Activities"
            icon="⋀"
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

      {/* Right hover drawer — just the layers panel now. "Where next?"
       *  has moved to the bottom touchbar as a single button + modal. */}
      <HoverDrawer side="right">
        <LayersPanel layers={layers} onChange={setLayers} />
      </HoverDrawer>

      {/* Activities modal — log hikes, bikes, kayak trips. Rocket-to-Mars
       *  is the locked premium option. */}
      <AnimatePresence>
        {activitiesOpen && (
          <motion.div
            key="activities"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-ink/55 backdrop-blur-sm"
            onClick={() => setActivitiesOpen(false)}
          >
            <motion.div
              initial={{ y: 30, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 30, scale: 0.97, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ActivitiesPanel onClose={() => setActivitiesOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Where-next modal — opened from the bottom touchbar. */}
      <AnimatePresence>
        {wheresNextOpen && (
          <motion.div
            key="wheres-next"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-ink/55 backdrop-blur-sm"
            onClick={() => setWheresNextOpen(false)}
          >
            <motion.div
              initial={{ y: 30, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 30, scale: 0.97, opacity: 0 }}
              transition={{ type: "spring", stiffness: 250, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <NextDestinations
                fromSlug={predictFromSlug}
                fromName={predictFromName}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

function GlobeHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), 9000);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.5 }}
          className="pointer-events-none fixed left-1/2 top-[88px] z-30 -translate-x-1/2 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-paper/70 backdrop-blur"
        >
          drag&nbsp;to&nbsp;rotate&nbsp;Earth · shift+drag&nbsp;to&nbsp;fly&nbsp;the&nbsp;camera · scroll&nbsp;to&nbsp;zoom · dbl&minus;click&nbsp;to&nbsp;recenter
        </motion.div>
      )}
    </AnimatePresence>
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

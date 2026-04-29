"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import WorldMap from "./WorldMap";
import Globe from "./Globe";
import JourneyScrubber from "./JourneyScrubber";
import { LEGS, CITIES } from "@/lib/places";
import {
  CONTINENT_VIEW,
  type Place,
  type Continent,
} from "@/lib/places-types";

type FilterValue = Continent | "All";

type Props = {
  places: Place[];
  continents: Continent[];
};

export default function AtlasExplorer({ places, continents }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"flat" | "globe">("flat");
  const [continent, setContinent] = useState<FilterValue>("All");
  const [center, setCenter] = useState<[number, number]>(
    CONTINENT_VIEW.All.center,
  );
  const [zoom, setZoom] = useState<number>(CONTINENT_VIEW.All.zoom);
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null);
  const [scrubberValue, setScrubberValue] = useState<number>(LEGS.length);

  const filteredPlaces = useMemo(() => {
    if (continent === "All") return places;
    return places.filter((p) => p.continent === continent);
  }, [places, continent]);

  // When the scrubber moves to a partial value, follow the journey on the map.
  useEffect(() => {
    if (scrubberValue >= LEGS.length || scrubberValue < 0) return;
    const leg = scrubberValue > 0 ? LEGS[scrubberValue - 1] : null;
    const targetSlug = leg ? leg.to : LEGS[0].from;
    const target = CITIES[targetSlug];
    if (!target) return;
    setFocusedSlug(targetSlug);
    setCenter(target.coordinates);
    setZoom(2.4);
  }, [scrubberValue]);

  const setContinentAndZoom = (c: FilterValue) => {
    setContinent(c);
    const view = CONTINENT_VIEW[c];
    setCenter(view.center);
    setZoom(view.zoom);
    if (c !== "All") {
      const first = places.find((p) => p.continent === c);
      if (first) setFocusedSlug(first.slug);
    } else {
      setFocusedSlug(null);
    }
  };

  const goRandom = () => {
    const pool = filteredPlaces.length ? filteredPlaces : places;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) router.push(`/places/${pick.slug}`);
  };

  const zoomIn = () => setZoom((z) => Math.min(6, z * 1.4));
  const zoomOut = () => setZoom((z) => Math.max(1, z / 1.4));
  const resetView = () => {
    setContinent("All");
    setCenter(CONTINENT_VIEW.All.center);
    setZoom(CONTINENT_VIEW.All.zoom);
    setFocusedSlug(null);
    setScrubberValue(LEGS.length);
  };

  const legsThrough = scrubberValue < LEGS.length ? scrubberValue : null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <FilterGroup
          label="Continent"
          value={continent}
          options={["All", ...continents]}
          onChange={(v) => setContinentAndZoom(v as FilterValue)}
        />
        <div className="ml-auto flex items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
          <button
            type="button"
            onClick={goRandom}
            className="rounded-full border border-ink-3 px-3 py-1 text-xs text-bone-dim transition hover:border-amber-dim hover:text-bone"
            title="Take me to a random place"
          >
            ✦ Surprise me
          </button>
        </div>
      </div>

      <div className="relative rounded-2xl border border-ink-3 bg-ink-2/40 p-3 sm:p-5">
        <AnimatePresence mode="wait">
          {view === "flat" ? (
            <motion.div
              key="flat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <WorldMap
                places={places}
                filterContinent={continent}
                center={center}
                zoom={zoom}
                legsThrough={legsThrough}
                onMoveEnd={({ coordinates, zoom: z }) => {
                  setCenter(coordinates);
                  setZoom(z);
                }}
              />
              <div className="pointer-events-none absolute right-6 top-6 z-10 flex flex-col gap-1">
                <ZoomBtn label="+" onClick={zoomIn} />
                <ZoomBtn label="−" onClick={zoomOut} />
                <ZoomBtn label="◯" onClick={resetView} title="Reset view" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="globe"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="grid place-items-center py-4"
            >
              <Globe
                places={places}
                focusedSlug={focusedSlug}
                legsThrough={legsThrough}
                size={560}
              />
              <p className="mt-3 text-center text-[10px] uppercase tracking-[0.22em] text-bone-dim/70">
                Drag to rotate · click any marker to step in
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5">
        <JourneyScrubber value={scrubberValue} onChange={setScrubberValue} />
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-display text-2xl text-bone">All entries</h3>
          <span className="text-[10px] uppercase tracking-[0.22em] text-bone-dim">
            {filteredPlaces.length} match
            {filteredPlaces.length === 1 ? "" : "es"}
          </span>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlaces.map((p, i) => (
            <motion.li
              key={p.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.03 }}
            >
              <Link
                href={`/places/${p.slug}`}
                className="group block rounded-md border border-ink-3 bg-ink-2/40 p-4 transition hover:border-amber-dim hover:bg-ink-2"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-xl text-bone group-hover:text-amber">
                    {p.name}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim">
                    stop {p.firstStop}
                    {p.stops.length > 1 ? `+${p.stops.length - 1}` : ""}
                  </span>
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-bone-dim">
                  {p.country} · {p.continent}
                </div>
                <div className="mt-3 line-clamp-2 text-sm italic text-bone/70">
                  &ldquo;{p.tagline}&rdquo;
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.22em] text-bone-dim">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const active = String(value) === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                active
                  ? "border-amber bg-amber/10 text-amber"
                  : "border-ink-3 text-bone-dim hover:border-amber-dim hover:text-bone"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: "flat" | "globe";
  onChange: (v: "flat" | "globe") => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-ink-3 p-0.5">
      {(["flat", "globe"] as const).map((v) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              active
                ? "bg-amber/15 text-amber"
                : "text-bone-dim hover:text-bone"
            }`}
          >
            {v === "flat" ? "Map" : "Globe"}
          </button>
        );
      })}
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
      className="pointer-events-auto grid h-8 w-8 place-items-center rounded-md border border-ink-3 bg-ink-2/80 text-bone-dim backdrop-blur-sm transition hover:border-amber-dim hover:text-amber"
    >
      {label}
    </button>
  );
}

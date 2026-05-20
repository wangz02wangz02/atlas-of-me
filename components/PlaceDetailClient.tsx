"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import type { Place, TransportMode } from "@/lib/places-types";
import {
  CITIES,
  LEGS,
  MODE_STYLE,
  getConnectionsForCity,
  getNeighborsForCity,
} from "@/lib/places";
import AudioPlayer from "./AudioPlayer";
import PhotoGallery from "./PhotoGallery";
import PolaroidGallery from "./PolaroidGallery";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: i * 0.07,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

// Hard cap on the journal draft. Generous (about 5-6 pages of prose) but
// finite — protects the 5 MB localStorage quota from an accidental
// document paste and keeps the textarea responsive on slower devices.
const JOURNAL_MAX = 10_000;

const MODE_GLYPH: Record<TransportMode, string> = {
  flight: "✈",
  train: "▤",
  car: "▣",
  ship: "≋",
  bus: "▦",
  hike: "⋀",
  bike: "⊙",
  kayak: "≈",
  rocket: "▲",
};

type Props = {
  place: Place;
  /** When true, renders without the route's chrome (overlay mode). */
  asOverlay?: boolean;
  /** Optional close-handler used in overlay mode. */
  onClose?: () => void;
};

export default function PlaceDetailClient({
  place,
  asOverlay = false,
  onClose,
}: Props) {
  const [galleryMode, setGalleryMode] = useState<"grid" | "polaroid">("grid");
  const [journalDraft, setJournalDraft] = useState<string>("");
  const totalStops = LEGS.length + 1;
  const connections = getConnectionsForCity(place.slug);
  const { prev, next, prevMode, nextMode } = getNeighborsForCity(place.slug);
  const prevCity = prev ? CITIES[prev] : null;
  const nextCity = next ? CITIES[next] : null;
  const isHub = place.stops.length > 1;

  // Load any persisted draft for this place. Capped at JOURNAL_MAX on both
  // read and write so a tampered localStorage value (or an old over-long
  // entry from before the cap existed) can't blow out the textarea or
  // re-trigger the quota error path.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(`journal:${place.slug}`);
      setJournalDraft(saved ? saved.slice(0, JOURNAL_MAX) : "");
    } catch {
      /* noop */
    }
  }, [place.slug]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (journalDraft) {
        window.localStorage.setItem(`journal:${place.slug}`, journalDraft);
      } else {
        window.localStorage.removeItem(`journal:${place.slug}`);
      }
    } catch {
      /* noop */
    }
  }, [journalDraft, place.slug]);

  return (
    <article className="relative bg-paper text-ink">
      {/* Top bar — only for the standalone route */}
      {!asOverlay && (
        <div className="border-b border-paper-3 bg-paper/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3 text-[10px] uppercase tracking-[0.22em] text-ink-faint">
            <Link href="/" className="transition hover:text-amber">
              ← back to atlas
            </Link>
            <span className="font-mono">
              stop {place.firstStop} of {totalStops}
              {isHub && ` · ${place.stops.length}× visited`}
            </span>
          </div>
        </div>
      )}

      <div className={asOverlay ? "px-6 pb-16 pt-8" : "px-6 py-12"}>
        <div className="mx-auto max-w-5xl">
          {/* Title block — masthead */}
          <header className="border-b border-paper-3 pb-8">
            <motion.div
              initial="hidden"
              animate="show"
              custom={0}
              variants={fade}
              className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.3em] text-ink-faint"
            >
              <span>{place.continent} · {place.country}</span>
              <span className="font-mono">
                stop {place.firstStop} / {totalStops}
                {isHub && ` · ×${place.stops.length}`}
              </span>
            </motion.div>
            <motion.h1
              initial="hidden"
              animate="show"
              custom={1}
              variants={fade}
              className="mt-3 font-display text-6xl leading-[1.02] text-ink sm:text-8xl"
            >
              {place.name}
            </motion.h1>
            <motion.p
              initial="hidden"
              animate="show"
              custom={2}
              variants={fade}
              className="mt-3 font-display text-2xl italic text-ink-soft"
            >
              &ldquo;{place.tagline}&rdquo;
            </motion.p>
            {asOverlay && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close place"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-paper-3 bg-paper text-ink-faint shadow-sm transition hover:text-amber"
              >
                ✕
              </button>
            )}
          </header>

          {/* Audio reflection */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={3}
            variants={fade}
            className="mt-8"
          >
            <AudioPlayer
              src={place.audio?.src}
              durationLabel={place.audio?.durationLabel}
            />
          </motion.div>

          {/* Two-column: journal + sidebar */}
          <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
            <motion.div
              initial="hidden"
              animate="show"
              custom={4}
              variants={fade}
              className="prose-journal"
            >
              {place.journal.split(/\n\n+/).map((para, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? "font-display text-2xl leading-relaxed text-ink first-letter:mr-2 first-letter:float-left first-letter:font-display first-letter:text-7xl first-letter:leading-[0.85] first-letter:text-amber"
                      : "mt-6 text-lg leading-relaxed text-ink-soft"
                  }
                >
                  {para}
                </p>
              ))}

              {/* Journal entry */}
              <div className="mt-12 border-t border-paper-3 pt-6">
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
                    Add a journal entry
                  </h3>
                  <span className="text-[10px] text-ink-faint">
                    {journalDraft.length > 0
                      ? `saved locally · ${journalDraft.length.toLocaleString()} / ${JOURNAL_MAX.toLocaleString()}`
                      : "draft"}
                  </span>
                </div>
                <textarea
                  value={journalDraft}
                  onChange={(e) =>
                    setJournalDraft(e.target.value.slice(0, JOURNAL_MAX))
                  }
                  maxLength={JOURNAL_MAX}
                  placeholder={`Write about ${place.name}…`}
                  rows={6}
                  className="block w-full resize-y rounded-md border border-paper-3 bg-paper-2/40 p-3 font-display text-lg italic text-ink placeholder:text-ink-faint/70 focus:border-amber focus:outline-none focus:ring-0"
                />
              </div>
            </motion.div>

            <motion.aside
              initial="hidden"
              animate="show"
              custom={5}
              variants={fade}
              className="space-y-6 lg:sticky lg:top-6 lg:self-start"
            >
              <div className="rounded-md border border-paper-3 bg-paper-2/40 p-5">
                <div className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
                  Coordinates
                </div>
                <div className="mt-1 font-mono text-sm text-ink">
                  {place.coordinates[1].toFixed(4)}°,{" "}
                  {place.coordinates[0].toFixed(4)}°
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-paper-3 pt-4 text-[10px] uppercase tracking-[0.2em]">
                  <div>
                    <div className="text-ink-faint">Country</div>
                    <div className="mt-0.5 normal-case tracking-normal text-ink">
                      {place.country}
                    </div>
                  </div>
                  <div>
                    <div className="text-ink-faint">Continent</div>
                    <div className="mt-0.5 normal-case tracking-normal text-ink">
                      {place.continent}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-paper-3 bg-paper-2/40 p-5">
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
                    Connections
                  </h3>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                    {place.stops.length}{" "}
                    {place.stops.length === 1 ? "visit" : "visits"}
                  </span>
                </div>
                <ul className="space-y-3 text-sm">
                  {connections.map((c) => (
                    <li
                      key={c.stop}
                      className="grid grid-cols-[auto_1fr] items-center gap-x-3 border-l-2 border-amber/30 pl-3"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber">
                        #{c.stop}
                      </span>
                      <div className="space-y-0.5">
                        {c.arrival ? (
                          <ConnectionRow
                            arrow="←"
                            slug={c.arrival.fromSlug}
                            mode={c.arrival.mode}
                            label="from"
                          />
                        ) : (
                          <div className="text-[11px] uppercase tracking-[0.2em] text-ink-faint/70">
                            (journey begins)
                          </div>
                        )}
                        {c.departure ? (
                          <ConnectionRow
                            arrow="→"
                            slug={c.departure.toSlug}
                            mode={c.departure.mode}
                            label="to"
                          />
                        ) : (
                          <div className="text-[11px] uppercase tracking-[0.2em] text-ink-faint/70">
                            (journey ends)
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.aside>
          </div>

          {/* Photographs */}
          <motion.div
            initial="hidden"
            animate="show"
            custom={6}
            variants={fade}
            className="mt-16"
          >
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
                Photographs
              </h2>
              <div className="inline-flex rounded-full border border-paper-3 p-0.5">
                {(["grid", "polaroid"] as const).map((m) => {
                  const active = galleryMode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setGalleryMode(m)}
                      className={`rounded-full px-3 py-1 text-xs transition ${
                        active
                          ? "bg-amber/15 text-amber"
                          : "text-ink-faint hover:text-ink"
                      }`}
                    >
                      {m === "grid" ? "Grid" : "Polaroid"}
                    </button>
                  );
                })}
              </div>
            </div>
            {galleryMode === "grid" ? (
              <PhotoGallery
                photos={place.photos}
                hasReal={place.hasRealPhotos}
                placeName={place.name}
              />
            ) : (
              <PolaroidGallery
                photos={place.photos}
                hasReal={place.hasRealPhotos}
                placeName={place.name}
              />
            )}
          </motion.div>

          {/* Prev / next */}
          <nav className="mt-16 grid grid-cols-1 gap-4 border-t border-paper-3 pt-8 sm:grid-cols-2">
            {prevCity ? (
              <Link
                href={`/places/${prevCity.slug}`}
                className="group flex items-center gap-3 rounded-md border border-paper-3 bg-paper-2/40 p-4 transition hover:border-amber hover:bg-paper-2"
              >
                <span className="text-2xl text-ink-faint transition group-hover:text-amber">
                  ←
                </span>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                    {prevMode ? (
                      <>
                        arrived by{" "}
                        <span style={{ color: MODE_STYLE[prevMode].color }}>
                          {MODE_GLYPH[prevMode]} {prevMode}
                        </span>
                      </>
                    ) : (
                      "previous"
                    )}
                  </div>
                  <div className="mt-1 font-display text-2xl text-ink group-hover:text-amber">
                    {prevCity.name}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="rounded-md border border-dashed border-paper-3 p-4 text-[10px] uppercase tracking-[0.22em] text-ink-faint/60">
                the journey begins here
              </div>
            )}
            {nextCity ? (
              <Link
                href={`/places/${nextCity.slug}`}
                className="group flex items-center justify-end gap-3 rounded-md border border-paper-3 bg-paper-2/40 p-4 text-right transition hover:border-amber hover:bg-paper-2"
              >
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                    {nextMode ? (
                      <>
                        departed by{" "}
                        <span style={{ color: MODE_STYLE[nextMode].color }}>
                          {MODE_GLYPH[nextMode]} {nextMode}
                        </span>
                      </>
                    ) : (
                      "next"
                    )}
                  </div>
                  <div className="mt-1 font-display text-2xl text-ink group-hover:text-amber">
                    {nextCity.name}
                  </div>
                </div>
                <span className="text-2xl text-ink-faint transition group-hover:text-amber">
                  →
                </span>
              </Link>
            ) : (
              <div className="rounded-md border border-dashed border-paper-3 p-4 text-right text-[10px] uppercase tracking-[0.22em] text-ink-faint/60">
                the journey ends here
              </div>
            )}
          </nav>
        </div>
      </div>
    </article>
  );
}

function ConnectionRow({
  arrow,
  slug,
  mode,
  label,
}: {
  arrow: string;
  slug: string;
  mode: TransportMode;
  label: string;
}) {
  const city = CITIES[slug];
  if (!city) return null;
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-amber">{arrow}</span>
      <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">
        {label}
      </span>
      <Link
        href={`/places/${city.slug}`}
        className="text-ink transition hover:text-amber"
      >
        {city.name}
      </Link>
      <span
        className="ml-auto text-[10px] uppercase tracking-[0.18em]"
        style={{ color: MODE_STYLE[mode].color }}
        title={mode}
      >
        {MODE_GLYPH[mode]} {mode}
      </span>
    </div>
  );
}

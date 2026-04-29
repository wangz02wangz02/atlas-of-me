"use client";

import { useState } from "react";
import Image from "next/image";
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
      duration: 0.6,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const MODE_GLYPH: Record<TransportMode, string> = {
  flight: "✈",
  train: "▤",
  car: "▣",
  ship: "≋",
  bus: "▦",
};

export default function PlaceDetailClient({ place }: { place: Place }) {
  const [galleryMode, setGalleryMode] = useState<"grid" | "polaroid">("grid");
  const hero = place.photos[0];
  const totalStops = LEGS.length + 1;
  const connections = getConnectionsForCity(place.slug);
  const { prev, next, prevMode, nextMode } = getNeighborsForCity(place.slug);
  const prevCity = prev ? CITIES[prev] : null;
  const nextCity = next ? CITIES[next] : null;
  const isHub = place.stops.length > 1;

  return (
    <article className="relative">
      {/* Top bar */}
      <div className="border-b border-ink-3 bg-ink/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3 text-[10px] uppercase tracking-[0.22em] text-bone-dim">
          <Link href="/" className="transition hover:text-amber">
            ← back to atlas
          </Link>
          <span className="font-mono">
            stop {place.firstStop} of {totalStops}
            {isHub && ` · ${place.stops.length}× visited`}
          </span>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/40 to-ink" />
        {/* Stop badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-1/2 top-8 z-10 -translate-x-1/2"
        >
          <div className="flex items-baseline gap-3 rounded-full border border-amber/30 bg-ink-2/70 px-4 py-1.5 backdrop-blur-md">
            <span className="text-[9px] uppercase tracking-[0.32em] text-amber">
              stop
            </span>
            <span className="font-display text-2xl tabular-nums text-bone">
              {place.firstStop.toString().padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase tracking-[0.32em] text-bone-dim">
              of {totalStops}
            </span>
          </div>
        </motion.div>

        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-end px-6 pb-12">
          <motion.div
            initial="hidden"
            animate="show"
            custom={0}
            variants={fade}
            className="text-[10px] uppercase tracking-[0.3em] text-amber"
          >
            {place.continent} · {place.country}
          </motion.div>
          <motion.h1
            initial="hidden"
            animate="show"
            custom={1}
            variants={fade}
            className="mt-3 font-display text-6xl leading-[1.05] text-bone sm:text-8xl"
          >
            {place.name}
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="show"
            custom={2}
            variants={fade}
            className="mt-4 max-w-xl font-display text-2xl italic text-bone/85"
          >
            &ldquo;{place.tagline}&rdquo;
          </motion.p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-24">
        {/* Audio player floats up over the hero */}
        <motion.div
          initial="hidden"
          animate="show"
          custom={3}
          variants={fade}
          className="-mt-10 mb-16"
        >
          <AudioPlayer
            src={place.audio?.src}
            durationLabel={place.audio?.durationLabel}
          />
        </motion.div>

        {/* Two-column on wide screens: journal + side aside */}
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          {/* Journal */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            custom={0}
            variants={fade}
            className="prose-journal"
          >
            {place.journal.split(/\n\n+/).map((para, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "font-display text-2xl leading-relaxed text-bone first-letter:mr-2 first-letter:float-left first-letter:font-display first-letter:text-7xl first-letter:leading-[0.85] first-letter:text-amber"
                    : "mt-6 text-lg leading-relaxed text-bone/85"
                }
              >
                {para}
              </p>
            ))}
          </motion.div>

          {/* Aside: city ID card + connections */}
          <motion.aside
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            custom={1}
            variants={fade}
            className="space-y-6 lg:sticky lg:top-6 lg:self-start"
          >
            <div className="rounded-lg border border-ink-3 bg-ink-2/40 p-5">
              <div className="text-[10px] uppercase tracking-[0.3em] text-bone-dim">
                Coordinates
              </div>
              <div className="mt-1 font-mono text-sm text-bone/85">
                {place.coordinates[1].toFixed(4)}°,{" "}
                {place.coordinates[0].toFixed(4)}°
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-3 pt-4 text-[10px] uppercase tracking-[0.2em]">
                <div>
                  <div className="text-bone-dim">Country</div>
                  <div className="mt-0.5 normal-case tracking-normal text-bone">
                    {place.country}
                  </div>
                </div>
                <div>
                  <div className="text-bone-dim">Continent</div>
                  <div className="mt-0.5 normal-case tracking-normal text-bone">
                    {place.continent}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-ink-3 bg-ink-2/40 p-5">
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-bone-dim">
                  Connections
                </h3>
                <span className="text-[10px] uppercase tracking-[0.22em] text-bone-dim">
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
                        <div className="text-[11px] uppercase tracking-[0.2em] text-bone-dim/70">
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
                        <div className="text-[11px] uppercase tracking-[0.2em] text-bone-dim/70">
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

        {/* Photographs — full width below */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          custom={1}
          variants={fade}
          className="mt-20"
        >
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-bone-dim">
              Photographs
            </h2>
            <div className="inline-flex rounded-full border border-ink-3 p-0.5">
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
                        : "text-bone-dim hover:text-bone"
                    }`}
                  >
                    {m === "grid" ? "Grid" : "Polaroid"}
                  </button>
                );
              })}
            </div>
          </div>
          {galleryMode === "grid" ? (
            <PhotoGallery photos={place.photos} />
          ) : (
            <PolaroidGallery photos={place.photos} />
          )}
        </motion.div>

        {/* Prev / next footer */}
        <nav className="mt-20 grid grid-cols-1 gap-4 border-t border-ink-3 pt-10 sm:grid-cols-2">
          {prevCity ? (
            <Link
              href={`/places/${prevCity.slug}`}
              className="group flex items-center gap-3 rounded-md border border-ink-3 bg-ink-2/40 p-4 transition hover:border-amber-dim hover:bg-ink-2"
            >
              <span className="text-2xl text-bone-dim transition group-hover:text-amber">
                ←
              </span>
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-bone-dim">
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
                <div className="mt-1 font-display text-2xl text-bone group-hover:text-amber">
                  {prevCity.name}
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-md border border-dashed border-ink-3 p-4 text-[10px] uppercase tracking-[0.22em] text-bone-dim/60">
              the journey begins here
            </div>
          )}
          {nextCity ? (
            <Link
              href={`/places/${nextCity.slug}`}
              className="group flex items-center justify-end gap-3 rounded-md border border-ink-3 bg-ink-2/40 p-4 text-right transition hover:border-amber-dim hover:bg-ink-2"
            >
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-bone-dim">
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
                <div className="mt-1 font-display text-2xl text-bone group-hover:text-amber">
                  {nextCity.name}
                </div>
              </div>
              <span className="text-2xl text-bone-dim transition group-hover:text-amber">
                →
              </span>
            </Link>
          ) : (
            <div className="rounded-md border border-dashed border-ink-3 p-4 text-right text-[10px] uppercase tracking-[0.22em] text-bone-dim/60">
              the journey ends here
            </div>
          )}
        </nav>
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
      <span className="text-[10px] uppercase tracking-[0.18em] text-bone-dim">
        {label}
      </span>
      <Link
        href={`/places/${city.slug}`}
        className="text-bone transition hover:text-amber"
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

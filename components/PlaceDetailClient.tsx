"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import type { Place } from "@/lib/places-types";
import AudioPlayer from "./AudioPlayer";
import PhotoGallery from "./PhotoGallery";

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

export default function PlaceDetailClient({ place }: { place: Place }) {
  const hero = place.photos[0];

  return (
    <article className="relative">
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
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/30 to-ink" />

        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-end px-6 pb-12">
          <motion.div
            initial="hidden"
            animate="show"
            custom={0}
            variants={fade}
            className="text-[10px] uppercase tracking-[0.3em] text-amber"
          >
            {place.continent} · {place.country} · {place.visitedAt}
          </motion.div>
          <motion.h1
            initial="hidden"
            animate="show"
            custom={1}
            variants={fade}
            className="mt-3 font-display text-6xl leading-[1.05] text-bone sm:text-7xl"
          >
            {place.name}
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="show"
            custom={2}
            variants={fade}
            className="mt-4 max-w-xl font-display text-xl italic text-bone/80"
          >
            &ldquo;{place.tagline}&rdquo;
          </motion.p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-24">
        <motion.div
          initial="hidden"
          animate="show"
          custom={3}
          variants={fade}
          className="-mt-8 mb-12"
        >
          <AudioPlayer
            src={place.audio?.src}
            durationLabel={place.audio?.durationLabel}
          />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          custom={0}
          variants={fade}
          className="prose-journal mb-16"
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

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          custom={1}
          variants={fade}
        >
          <h2 className="mb-5 text-[10px] uppercase tracking-[0.3em] text-bone-dim">
            Photographs
          </h2>
          <PhotoGallery photos={place.photos} />
        </motion.div>

        <div className="mt-16 flex justify-between border-t border-ink-3 pt-8 text-sm">
          <Link
            href="/"
            className="text-bone-dim transition hover:text-amber"
          >
            ← Back to the atlas
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-bone-dim">
            {place.coordinates[1].toFixed(2)}°, {place.coordinates[0].toFixed(2)}°
          </span>
        </div>
      </div>
    </article>
  );
}

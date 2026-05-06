"use client";

import { useMemo, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { LEGS, CITIES } from "@/lib/places";

type Props = {
  /** Currently focused stop index, 1..N. Highlighted in the strip. */
  value: number;
  onHover: (stop: number | null) => void;
  onSelect: (stop: number) => void;
};

/**
 * A hair-thin filmstrip pinned to the bottom edge.
 * One micro-frame per stop in the journey. Hovering scrubs the globe.
 */
export default function JourneyFilmstrip({ value, onHover, onSelect }: Props) {
  const stops = useMemo(() => {
    const seq = [LEGS[0].from, ...LEGS.map((l) => l.to)];
    return seq.map((slug, i) => ({
      stop: i + 1,
      slug,
      city: CITIES[slug],
    }));
  }, []);

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLButtonElement>(
      `[data-stop="${value}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="pointer-events-auto fixed inset-x-0 bottom-9 z-20 flex justify-center"
      onMouseLeave={() => onHover(null)}
    >
      <div
        ref={ref}
        className="scrollbar-none flex max-w-[88vw] gap-[3px] overflow-x-auto rounded-md border border-paper-3 bg-paper/85 px-2 py-1.5 shadow-[0_8px_30px_rgba(60,40,12,0.07)] backdrop-blur-md"
      >
        {stops.map(({ stop, city, slug }) => {
          const active = stop === value;
          return (
            <button
              key={`${slug}-${stop}`}
              data-stop={stop}
              type="button"
              title={`#${stop} · ${city?.name ?? slug}`}
              onMouseEnter={() => onHover(stop)}
              onClick={() => onSelect(stop)}
              className="group relative h-7 w-[10px] shrink-0 rounded-[1.5px] transition-all"
              style={{
                background: active
                  ? "linear-gradient(180deg, #b6803a, #8c5d22)"
                  : "linear-gradient(180deg, #d6c9b0, #b8a98d)",
                outline: "none",
              }}
            >
              <span className="pointer-events-none absolute inset-x-0 -top-6 mx-auto whitespace-nowrap rounded-sm bg-paper px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-ink opacity-0 shadow group-hover:opacity-100">
                {city?.name ?? slug}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

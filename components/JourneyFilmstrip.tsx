"use client";

import { useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LEGS, CITIES } from "@/lib/places";

type Props = {
  /** Currently focused stop index, 1..N+1. Highlighted in the strip. */
  value: number;
  onHover: (stop: number | null) => void;
  onSelect: (stop: number) => void;
  /** Affects color choices so the capsule reads on dark backdrops too. */
  dark?: boolean;
};

/**
 * Glass capsule filmstrip pinned to the bottom edge.
 *
 * One micro-dot per stop in the chronological journey, with a thin progress
 * line behind it.  The current stop is amber and slightly larger; everything
 * else is a faint tick.  Hovering anywhere scrubs the globe; a caption
 * floats above showing the current city and stop number.
 *
 * Replaces the older 115-vertical-bar strip — that was too heavy a visual
 * for the new fullscreen layout.
 */
export default function JourneyFilmstrip({
  value,
  onHover,
  onSelect,
  dark = false,
}: Props) {
  const stops = useMemo(() => {
    const seq = [LEGS[0].from, ...LEGS.map((l) => l.to)];
    return seq.map((slug, i) => ({
      stop: i + 1,
      slug,
      city: CITIES[slug],
    }));
  }, []);

  const ref = useRef<HTMLDivElement>(null);
  // Remember the last stop value we reported via onHover so we don't fire a
  // setState on every mousemove pixel — only when the rounded stop actually
  // changes.  Otherwise scrubbing across 115 stops would call setStop 100s
  // of times per second and re-render the world for each, causing the
  // "stuck/chunky" feel.
  const lastReported = useRef<number | null>(null);

  const total = stops.length;
  // value is 1..total; if user hasn't scrubbed (value > total) we just clamp.
  const clamped = Math.min(Math.max(1, value), total);
  const progressPct = ((clamped - 1) / Math.max(1, total - 1)) * 100;
  const currentCity = stops[clamped - 1]?.city;

  const stopFromClientX = useCallback(
    (clientX: number): number | null => {
      const el = ref.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(1 + t * (total - 1));
    },
    [total],
  );

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const stop = stopFromClientX(e.clientX);
    if (stop == null || stop === lastReported.current) return;
    lastReported.current = stop;
    onHover(stop);
  };

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const stop = stopFromClientX(e.clientX);
    if (stop == null) return;
    onSelect(stop);
  };

  // Theme-aware colors. Dark mode (universe backdrop) uses cream tones;
  // light mode (flat map / paper) uses ink tones.
  const c = dark
    ? {
        wrap: "border-white/15 bg-black/40 text-paper",
        track: "rgba(253,232,184,0.18)",
        fill: "rgba(253,232,184,0.85)",
        tick: "rgba(253,232,184,0.32)",
        active: "#fde8b8",
        caption: "text-paper/80",
        sub: "text-paper/45",
        accent: "text-amber",
      }
    : {
        wrap: "border-paper-3 bg-paper/85 text-ink",
        track: "rgba(154, 117, 70, 0.22)",
        fill: "rgba(182, 128, 58, 0.85)",
        tick: "rgba(122, 94, 52, 0.32)",
        active: "#9a4a28",
        caption: "text-ink",
        sub: "text-ink-faint",
        accent: "text-amber-deep",
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="pointer-events-auto fixed inset-x-0 bottom-10 z-30 flex justify-center"
      onMouseLeave={() => {
        lastReported.current = null;
        onHover(null);
      }}
    >
      <div
        className={`pointer-events-auto flex w-[min(86vw,640px)] flex-col items-stretch gap-1 rounded-full border px-5 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md ${c.wrap}`}
      >
        {/* Caption row */}
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.28em]">
          <span className={`${c.sub} text-[9px]`}>journey</span>
          <span className="flex items-baseline gap-1.5">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentCity?.slug ?? "—"}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.18 }}
                className={`${c.caption} font-display text-[11px] normal-case tracking-normal`}
              >
                {currentCity?.name ?? "—"}
              </motion.span>
            </AnimatePresence>
            <span className={`${c.sub}`}>·</span>
            <span className={`${c.accent} font-mono text-[9px]`}>
              {String(clamped).padStart(3, "0")}
              <span className={`${c.sub} ml-0.5`}>/{total}</span>
            </span>
          </span>
        </div>

        {/* Track */}
        <div
          ref={ref}
          onMouseMove={onMove}
          onClick={onClick}
          className="relative h-5 cursor-pointer select-none"
          aria-label="Journey scrubber"
        >
          {/* Empty track */}
          <div
            className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full"
            style={{ background: c.track }}
          />
          {/* Filled track */}
          <div
            className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full transition-[width] duration-200"
            style={{ width: `${progressPct}%`, background: c.fill }}
          />

          {/* Dot per stop — purely decorative; the whole row is clickable. */}
          <div className="absolute inset-0 flex items-center justify-between">
            {stops.map(({ stop }) => {
              const isActive = stop === clamped;
              return (
                <span
                  key={stop}
                  className="block rounded-full transition-all"
                  style={{
                    width: isActive ? 8 : 2.6,
                    height: isActive ? 8 : 2.6,
                    background: isActive ? c.active : c.tick,
                    boxShadow: isActive
                      ? dark
                        ? "0 0 10px rgba(253,232,184,0.6)"
                        : "0 0 8px rgba(182,128,58,0.5)"
                      : undefined,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { TransportMode } from "@/lib/places-types";
import { LEGS, MODE_STYLE, CITIES } from "@/lib/places";

const MODE_GLYPH: Record<TransportMode, string> = {
  flight: "✈",
  train: "▤",
  car: "▣",
  ship: "≋",
  bus: "▦",
};

type Props = {
  /** 0 = before any leg has been taken; LEGS.length = full journey shown. */
  value: number;
  onChange: (v: number) => void;
};

export default function JourneyScrubber({ value, onChange }: Props) {
  const total = LEGS.length;
  const [playing, setPlaying] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const next = valueRef.current + 1;
      if (next > total) {
        setPlaying(false);
      } else {
        onChange(next);
      }
    }, 1100);
    return () => window.clearInterval(id);
  }, [playing, total, onChange]);

  const togglePlay = () => {
    if (value >= total) {
      onChange(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  };

  const showAll = () => {
    setPlaying(false);
    onChange(total);
  };

  const currentLeg = value > 0 ? LEGS[value - 1] : null;
  const fromCity = currentLeg ? CITIES[currentLeg.from] : null;
  const toCity = currentLeg
    ? CITIES[currentLeg.to]
    : CITIES[LEGS[0].from]; // starting city if value === 0
  const mode = currentLeg?.mode;

  return (
    <div className="rounded-lg border border-ink-3 bg-ink-2/50 p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause journey" : "Play journey"}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-amber/40 bg-amber/10 text-amber transition hover:bg-amber/20"
        >
          {playing ? (
            <svg width="11" height="11" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="1" width="3" height="12" rx="0.5" />
              <rect x="9" y="1" width="3" height="12" rx="0.5" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 1.5 L12 7 L3 12.5 Z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[10px] uppercase tracking-[0.22em] text-bone-dim">
              Leg{" "}
              <span className="font-mono text-amber">
                {value.toString().padStart(2, "0")}
              </span>{" "}
              of{" "}
              <span className="font-mono">{total}</span>
            </span>
            <button
              type="button"
              onClick={showAll}
              className="text-[10px] uppercase tracking-[0.18em] text-bone-dim hover:text-amber"
            >
              show all
            </button>
          </div>
          <div className="mt-1 flex items-center gap-2 truncate font-display text-lg text-bone">
            {currentLeg && fromCity ? (
              <>
                <span className="truncate">{fromCity.name}</span>
                <span
                  aria-hidden
                  className="text-amber"
                  title={mode}
                >
                  {mode ? MODE_GLYPH[mode] : "→"}
                </span>
                <span className="truncate">{toCity?.name}</span>
              </>
            ) : (
              <span className="italic text-bone/70">
                {toCity ? `Begin in ${toCity.name}` : "Begin"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Per-leg colored ticks — the whole journey at a glance */}
      <div className="mt-4">
        <div className="relative h-3 w-full overflow-hidden rounded-sm border border-ink-3 bg-ink">
          <div className="absolute inset-0 flex">
            {LEGS.map((leg, i) => {
              const passed = i < value;
              const isCurrent = i === value - 1;
              return (
                <div
                  key={leg.index}
                  className="flex-1"
                  style={{
                    background: MODE_STYLE[leg.mode].color,
                    opacity: passed ? (isCurrent ? 1 : 0.7) : 0.16,
                    boxShadow: isCurrent
                      ? `0 0 6px ${MODE_STYLE[leg.mode].color}`
                      : "none",
                  }}
                  title={`${leg.index}. ${leg.from} → ${leg.to} (${leg.mode})`}
                />
              );
            })}
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={total}
          value={value}
          onChange={(e) => {
            setPlaying(false);
            onChange(Number(e.target.value));
          }}
          className="audio-scrub mt-2 w-full"
          aria-label="Journey progress"
        />
      </div>

      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-bone-dim">
        {(Object.keys(MODE_STYLE) as TransportMode[]).map((m) => (
          <li key={m} className="flex items-center gap-1.5">
            <span
              className="inline-block h-[2px] w-5"
              style={{
                background: MODE_STYLE[m].color,
                outline:
                  MODE_STYLE[m].dash === "0"
                    ? "none"
                    : `1px dashed ${MODE_STYLE[m].color}`,
                outlineOffset: "0px",
              }}
            />
            <span>{MODE_STYLE[m].label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

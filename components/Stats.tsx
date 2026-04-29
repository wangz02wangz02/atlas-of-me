"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";
import type { Stats as StatsType, TransportMode } from "@/lib/places-types";

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref} className="font-display tabular-nums">
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

const MODE_ICON: Record<TransportMode, string> = {
  flight: "✈",
  train: "▤",
  car: "▣",
  ship: "≋",
  bus: "▦",
};

export default function Stats({ stats }: { stats: StatsType }) {
  const items: { label: string; value: number }[] = [
    { label: "Cities", value: stats.totalPlaces },
    { label: "Countries", value: stats.totalCountries },
    { label: "Continents", value: stats.totalContinents },
    { label: "Kilometers", value: stats.totalDistanceKm },
  ];
  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink-3 bg-ink-3 sm:grid-cols-4">
        {items.map((it) => (
          <li key={it.label} className="bg-ink-2/60 px-5 py-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-bone-dim">
              {it.label}
            </div>
            <div className="mt-1 text-4xl text-amber">
              <Counter to={it.value} />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 rounded-lg border border-ink-3 bg-ink-2/40 px-5 py-3">
        <span className="text-[10px] uppercase tracking-[0.22em] text-bone-dim">
          {stats.totalLegs} legs of the journey
        </span>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-bone/85">
          {(Object.keys(stats.legsByMode) as TransportMode[]).map((m) => (
            <li key={m} className="flex items-center gap-1.5">
              <span className="text-amber">{MODE_ICON[m]}</span>
              <span className="tabular-nums">{stats.legsByMode[m]}</span>
              <span className="text-bone-dim">{m}s</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

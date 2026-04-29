"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";
import type { Stats as StatsType } from "@/lib/places-types";

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

export default function Stats({ stats }: { stats: StatsType }) {
  const items: { label: string; value: number; suffix?: string }[] = [
    { label: "Places", value: stats.totalPlaces },
    { label: "Countries", value: stats.totalCountries },
    { label: "Continents", value: stats.totalContinents },
    { label: "Kilometers traveled", value: stats.totalDistanceKm },
  ];
  return (
    <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink-3 bg-ink-3 sm:grid-cols-4">
      {items.map((it) => (
        <li key={it.label} className="bg-ink-2/60 px-5 py-6">
          <div className="text-[10px] uppercase tracking-[0.22em] text-bone-dim">
            {it.label}
          </div>
          <div className="mt-1 text-4xl text-amber">
            <Counter to={it.value} suffix={it.suffix} />
          </div>
        </li>
      ))}
    </ul>
  );
}

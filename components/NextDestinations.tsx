"use client";

import { useMemo } from "react";
import type { Prediction } from "@/lib/predict";
import { predictNext, MARS_PIN } from "@/lib/predict";

export default function NextDestinations({
  fromSlug,
  fromName,
}: {
  fromSlug: string | null;
  fromName: string | null;
}) {
  const picks: Prediction[] = useMemo(() => {
    if (!fromSlug) return [];
    return predictNext(fromSlug, 3);
  }, [fromSlug]);

  return (
    <div className="w-[260px] rounded-md border border-paper-3 bg-paper/95 p-3 backdrop-blur">
      <div className="flex items-baseline justify-between">
        <div className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
          Where next?
        </div>
        <div className="text-[9px] uppercase tracking-[0.22em] text-amber-deep/80">
          heuristic
        </div>
      </div>

      {!fromSlug ? (
        <div className="mt-2 text-xs italic text-ink-faint">
          Hover a place on the map to see suggestions from there.
        </div>
      ) : picks.length === 0 ? (
        <div className="mt-2 text-xs italic text-ink-faint">
          No candidates left — you&apos;ve been everywhere we thought of.
        </div>
      ) : (
        <>
          <div className="mt-1 text-[11px] text-ink-soft">
            From <span className="font-medium text-ink">{fromName}</span>:
          </div>
          <ol className="mt-2 space-y-2">
            {picks.map((p, i) => (
              <li
                key={p.slug}
                className="rounded-sm border border-paper-3/60 bg-paper-2/70 p-2"
              >
                <div className="flex items-baseline justify-between">
                  <div className="font-display text-sm text-ink">
                    <span className="mr-1 text-amber">{i + 1}.</span>
                    {p.name}
                  </div>
                  <div className="font-mono text-[9px] tracking-tight text-ink-faint">
                    {p.distanceKm.toLocaleString()} km
                  </div>
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                  {p.country}
                </div>
                <div className="mt-1 text-[11px] leading-snug text-ink-soft">
                  {p.pitch}
                </div>
                <div
                  className="mt-1 text-[10px] italic text-ink-faint"
                  title={`Score ${p.score.toFixed(0)}`}
                >
                  {p.why}
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-3 border-t border-paper-3/60 pt-2 text-[9px] italic text-ink-faint">
            Scored by distance + same-continent bonus. AI-backed predictions
            coming later.
          </div>
          <div className="mt-3 rounded-sm border border-amber-deep/30 bg-amber/5 p-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base">♂</span>
                <span className="font-display text-sm text-ink">
                  {MARS_PIN.name}
                </span>
              </div>
              <div className="font-mono text-[9px] tracking-tight text-ink-faint">
                {(MARS_PIN.distanceKm / 1_000_000).toFixed(0)}M km
              </div>
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-amber-deep/80">
              and one day…
            </div>
            <div className="mt-1 text-[11px] leading-snug text-ink-soft">
              {MARS_PIN.pitch}
            </div>
            <div className="mt-1 text-[10px] italic text-ink-faint">
              {MARS_PIN.why}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import WorldMap from "./WorldMap";
import type { Place, Continent } from "@/lib/places";

type FilterValue = Continent | "All";

type Props = {
  places: Place[];
  continents: Continent[];
};

export default function AtlasExplorer({ places, continents }: Props) {
  const [continent, setContinent] = useState<FilterValue>("All");
  const [year, setYear] = useState<number | "All">("All");

  const years = useMemo(() => {
    const set = new Set(places.map((p) => p.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [places]);

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      if (continent !== "All" && p.continent !== continent) return false;
      if (year !== "All" && p.year !== year) return false;
      return true;
    });
  }, [places, continent, year]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <FilterGroup
          label="Continent"
          value={continent}
          options={["All", ...continents]}
          onChange={(v) => setContinent(v as FilterValue)}
        />
        <FilterGroup
          label="Year"
          value={String(year)}
          options={["All", ...years.map(String)]}
          onChange={(v) => setYear(v === "All" ? "All" : Number(v))}
        />
      </div>

      <div className="rounded-2xl border border-ink-3 bg-ink-2/40 p-3 sm:p-5">
        <WorldMap
          places={places}
          filterContinent={continent}
        />
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-display text-2xl text-bone">All entries</h3>
          <span className="text-[10px] uppercase tracking-[0.22em] text-bone-dim">
            {filteredPlaces.length} match{filteredPlaces.length === 1 ? "" : "es"}
          </span>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlaces.map((p, i) => (
            <motion.li
              key={p.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
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
                    {p.visitedAt}
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

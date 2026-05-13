/**
 * Synthetic dates and per-country stamp data for the travel passport view.
 *
 * The journey has no real timestamps — we anchor it to a plausible window and
 * spread the stops evenly across it.  If real dates are ever added to legs,
 * this module is the single place that needs to change.
 */

import { LEGS, CITIES } from "./journey";
import type { City } from "./journey";

// Backdate so the journey "ended" a couple weeks before today.  Anchored to a
// stable start to keep print output stable across page loads.
const JOURNEY_START = new Date("2025-07-15T12:00:00Z");
const DAYS_PER_STOP = 2.4;

export function dateForStop(stop: number): Date {
  const ms = JOURNEY_START.getTime() + (stop - 1) * DAYS_PER_STOP * 86400000;
  return new Date(ms);
}

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export function formatStampDate(d: Date): string {
  const day = d.getUTCDate().toString().padStart(2, "0");
  const month = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export function formatPageDate(d: Date): string {
  const day = d.getUTCDate().toString().padStart(2, "0");
  const month = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

export type CountryStamp = {
  country: string;
  countryCode: string;
  firstStop: number;
  firstDate: Date;
  cities: string[];
};

/** One stamp per country, dated to the first visit. */
export function getCountryStamps(): CountryStamp[] {
  // Build chronological stop sequence: [LEGS[0].from, LEGS[0].to, LEGS[1].to, ...]
  const seq: string[] = [LEGS[0].from, ...LEGS.map((l) => l.to)];
  const out: CountryStamp[] = [];
  const firstByCountry = new Map<string, number>();
  const citiesByCountry = new Map<string, Set<string>>();
  seq.forEach((slug, i) => {
    const city = CITIES[slug];
    if (!city) return;
    const stop = i + 1;
    if (!firstByCountry.has(city.country)) {
      firstByCountry.set(city.country, stop);
    }
    const set = citiesByCountry.get(city.country) ?? new Set<string>();
    set.add(city.name);
    citiesByCountry.set(city.country, set);
  });
  for (const [country, firstStop] of firstByCountry) {
    const city = Object.values(CITIES).find((c) => c.country === country);
    if (!city) continue;
    out.push({
      country,
      countryCode: city.countryCode,
      firstStop,
      firstDate: dateForStop(firstStop),
      cities: Array.from(citiesByCountry.get(country) ?? []).sort(),
    });
  }
  out.sort((a, b) => a.firstStop - b.firstStop);
  return out;
}

export type PassportPage = {
  stop: number;
  date: Date;
  city: City;
  /** Elevation in meters above sea level. Loaded server-side from
   *  data/altitudes.json (Open-Elevation). May be undefined for cities
   *  that weren't found. */
  altitude?: number;
};

/** One page per stop, chronologically. */
export function getPassportPages(
  altitudes?: Record<string, number>,
): PassportPage[] {
  const seq: string[] = [LEGS[0].from, ...LEGS.map((l) => l.to)];
  return seq
    .map((slug, i): PassportPage | null => {
      const city = CITIES[slug];
      if (!city) return null;
      const alt = altitudes?.[slug];
      const page: PassportPage = {
        stop: i + 1,
        date: dateForStop(i + 1),
        city,
      };
      if (typeof alt === "number") page.altitude = alt;
      return page;
    })
    .filter((x): x is PassportPage => x !== null);
}

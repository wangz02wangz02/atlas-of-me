import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Continent, Place, Stats } from "./places-types";

export type { Continent, Place, Stats } from "./places-types";
export { CONTINENT_VIEW } from "./places-types";

const CONTENT_DIR = path.join(process.cwd(), "content", "places");

let cache: Place[] | null = null;

export function getAllPlaces(): Place[] {
  if (cache) return cache;
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const places = files.map((file) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
    return JSON.parse(raw) as Place;
  });
  places.sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
  cache = places;
  return places;
}

export function getPlace(slug: string): Place | undefined {
  return getAllPlaces().find((p) => p.slug === slug);
}

export function getContinents(): Continent[] {
  const set = new Set<Continent>();
  for (const p of getAllPlaces()) set.add(p.continent);
  return Array.from(set).sort() as Continent[];
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function getStats(): Stats {
  const places = getAllPlaces();
  const countries = new Set(places.map((p) => p.country));
  const continents = new Set(places.map((p) => p.continent));
  let totalDistanceKm = 0;
  const chrono = [...places].sort((a, b) =>
    a.visitedAt.localeCompare(b.visitedAt),
  );
  for (let i = 1; i < chrono.length; i++) {
    totalDistanceKm += haversineKm(
      chrono[i - 1].coordinates,
      chrono[i].coordinates,
    );
  }
  return {
    totalPlaces: places.length,
    totalCountries: countries.size,
    totalContinents: continents.size,
    totalDistanceKm: Math.round(totalDistanceKm),
  };
}

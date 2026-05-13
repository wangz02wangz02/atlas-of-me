import type {
  Continent,
  Place,
  Stats,
  TransportMode,
  Leg,
} from "./places-types";
import { CITIES, LEGS, getStopSequence } from "./journey";

export type {
  Continent,
  Place,
  Stats,
  TransportMode,
  Leg,
} from "./places-types";
export { CONTINENT_VIEW } from "./places-types";
export { LEGS, MODE_STYLE, CITIES } from "./journey";

let cache: Place[] | null = null;

function buildPlaces(): Place[] {
  const stopsByCity = new Map<string, number[]>();
  const seq = getStopSequence();
  seq.forEach((slug, i) => {
    const stop = i + 1; // 1-based stop number
    const arr = stopsByCity.get(slug) ?? [];
    arr.push(stop);
    stopsByCity.set(slug, arr);
  });

  const places: Place[] = Object.values(CITIES).map((city) => {
    const stops = stopsByCity.get(city.slug) ?? [];
    return {
      slug: city.slug,
      name: city.name,
      country: city.country,
      countryCode: city.countryCode,
      continent: city.continent,
      coordinates: city.coordinates,
      firstStop: stops[0] ?? 0,
      stops,
      tagline: city.tagline,
      journal: city.journal,
      photos: [],
      hasRealPhotos: false,
      audio: { durationLabel: "—:—" },
    };
  });

  // Newest visit first, so the home page lists work
  places.sort((a, b) => {
    const aLast = a.stops[a.stops.length - 1] ?? 0;
    const bLast = b.stops[b.stops.length - 1] ?? 0;
    return bLast - aLast;
  });
  return places;
}

export function getAllPlaces(): Place[] {
  if (!cache) cache = buildPlaces();
  return cache;
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

  const legsByMode: Record<TransportMode, number> = {
    flight: 0,
    train: 0,
    car: 0,
    ship: 0,
    bus: 0,
    hike: 0,
    bike: 0,
    kayak: 0,
    rocket: 0,
  };
  let totalDistanceKm = 0;
  for (const leg of LEGS) {
    legsByMode[leg.mode] += 1;
    const from = CITIES[leg.from];
    const to = CITIES[leg.to];
    if (from && to) {
      totalDistanceKm += haversineKm(from.coordinates, to.coordinates);
    }
  }

  return {
    totalPlaces: places.length,
    totalCountries: countries.size,
    totalContinents: continents.size,
    totalDistanceKm: Math.round(totalDistanceKm),
    totalLegs: LEGS.length,
    legsByMode,
  };
}

/** Resolved leg objects (with full city data on either side). */
export function getResolvedLegs(): Array<
  Leg & {
    fromCoord: [number, number];
    toCoord: [number, number];
  }
> {
  return LEGS.map((leg) => ({
    ...leg,
    fromCoord: CITIES[leg.from].coordinates,
    toCoord: CITIES[leg.to].coordinates,
  }));
}

/**
 * Per-country memory-density score in [0, 1].  Combines visits, photo count,
 * journal length, and whether real photos are attached.  Used by the heatmap.
 */
export function getCountryMemoryDensity(places: Place[]): Map<string, number> {
  const raw = new Map<string, number>();
  for (const p of places) {
    const stops = p.stops?.length ?? 1;
    const photos = p.photos?.length ?? 0;
    const journal = (p.journal?.length ?? 0) / 600;
    const score =
      stops * 3 + photos * 1.5 + journal + (p.hasRealPhotos ? 4 : 0);
    raw.set(p.country, (raw.get(p.country) ?? 0) + score);
  }
  let max = 1;
  for (const v of raw.values()) if (v > max) max = v;
  const out = new Map<string, number>();
  for (const [k, v] of raw) out.set(k, v / max);
  return out;
}

export type Connection = {
  stop: number;
  arrival: { fromSlug: string; mode: TransportMode } | null;
  departure: { toSlug: string; mode: TransportMode } | null;
};

/**
 * For each visit to a city, returns the leg in (how I got there) and
 * leg out (how I left). Useful for detail-page "connections" panels.
 */
export function getConnectionsForCity(slug: string): Connection[] {
  const place = getPlace(slug);
  if (!place) return [];
  return place.stops.map((stop) => {
    const arrLeg = stop > 1 ? LEGS[stop - 2] : null;
    const depLeg = stop <= LEGS.length ? LEGS[stop - 1] : null;
    return {
      stop,
      arrival: arrLeg
        ? { fromSlug: arrLeg.from, mode: arrLeg.mode }
        : null,
      departure: depLeg
        ? { toSlug: depLeg.to, mode: depLeg.mode }
        : null,
    };
  });
}

/** Previous/next neighbor cities for the city's first visit. */
export function getNeighborsForCity(
  slug: string,
): { prev: string | null; next: string | null; prevMode: TransportMode | null; nextMode: TransportMode | null } {
  const place = getPlace(slug);
  if (!place || place.stops.length === 0)
    return { prev: null, next: null, prevMode: null, nextMode: null };
  const firstStop = place.stops[0];
  const prevLeg = firstStop > 1 ? LEGS[firstStop - 2] : null;
  const nextLeg = firstStop <= LEGS.length ? LEGS[firstStop - 1] : null;
  return {
    prev: prevLeg?.from ?? null,
    next: nextLeg?.to ?? null,
    prevMode: prevLeg?.mode ?? null,
    nextMode: nextLeg?.mode ?? null,
  };
}

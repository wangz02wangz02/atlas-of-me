/**
 * Where-to-next prediction (heuristic v1).
 *
 * We score a small pool of well-known destinations the traveler hasn't visited
 * yet, using a combination of inverse great-circle distance and a same-region
 * bonus.  The result is the top N candidates with a short, human-legible
 * reasoning string per pick.
 *
 * This deliberately keeps a single entry point so it can be swapped for an
 * LLM-backed predictor later without changing any callers.
 */

import { CITIES } from "./journey";
import type { Continent } from "./places-types";

export type Candidate = {
  slug: string;
  name: string;
  country: string;
  continent: Continent;
  coordinates: [number, number]; // [lon, lat]
  pitch: string; // short reason to go
};

export type Prediction = Candidate & {
  fromSlug: string;
  fromName: string;
  distanceKm: number;
  sameContinent: boolean;
  score: number;
  /** Human-legible reasoning shown alongside the pick. */
  why: string;
};

/** Pinned "and one day…" destination shown separately from the city ranking.
 *  Mars is roughly 225 million km from Earth at average opposition. */
export const MARS_PIN = {
  slug: "mars",
  name: "Mars",
  country: "Solar System",
  pitch:
    "Rust-red deserts, a sky the color of dried blood, sunsets the color of Earth's sky.",
  distanceKm: 225_000_000,
  why: "On a good launch window, a one-way trip takes about seven months.",
} as const;

const CANDIDATES: Candidate[] = [
  // Asia
  {
    slug: "tokyo",
    name: "Tokyo",
    country: "Japan",
    continent: "Asia",
    coordinates: [139.6917, 35.6895],
    pitch: "Neon valleys, vending machines that know your order.",
  },
  {
    slug: "kyoto",
    name: "Kyoto",
    country: "Japan",
    continent: "Asia",
    coordinates: [135.7681, 35.0116],
    pitch: "Tea ceremonies and lacquered silence.",
  },
  {
    slug: "seoul",
    name: "Seoul",
    country: "South Korea",
    continent: "Asia",
    coordinates: [126.978, 37.5665],
    pitch: "Late-night kalbi, palaces lit at the edges.",
  },
  {
    slug: "bangkok",
    name: "Bangkok",
    country: "Thailand",
    continent: "Asia",
    coordinates: [100.5018, 13.7563],
    pitch: "A floating market at 6 a.m., a rooftop bar at 11.",
  },
  {
    slug: "singapore",
    name: "Singapore",
    country: "Singapore",
    continent: "Asia",
    coordinates: [103.8198, 1.3521],
    pitch: "Hawker stalls served like Michelin.",
  },
  {
    slug: "hong-kong",
    name: "Hong Kong",
    country: "China",
    continent: "Asia",
    coordinates: [114.1694, 22.3193],
    pitch: "Tram lines, dim sum at midnight, harbor like a movie.",
  },
  {
    slug: "bali",
    name: "Bali",
    country: "Indonesia",
    continent: "Asia",
    coordinates: [115.1889, -8.4095],
    pitch: "Rice terraces, scooters, sunsets that cost nothing.",
  },
  {
    slug: "dubai",
    name: "Dubai",
    country: "United Arab Emirates",
    continent: "Asia",
    coordinates: [55.2708, 25.2048],
    pitch: "Desert horizons under a glass-and-steel skyline.",
  },
  {
    slug: "delhi",
    name: "Delhi",
    country: "India",
    continent: "Asia",
    coordinates: [77.1025, 28.7041],
    pitch: "Old Delhi smells like cardamom and history.",
  },
  // Oceania
  {
    slug: "sydney",
    name: "Sydney",
    country: "Australia",
    continent: "Oceania",
    coordinates: [151.2093, -33.8688],
    pitch: "Harbor walks ending in flat whites.",
  },
  {
    slug: "auckland",
    name: "Auckland",
    country: "New Zealand",
    continent: "Oceania",
    coordinates: [174.7633, -36.8485],
    pitch: "Volcanic suburbs, hobbits within driving distance.",
  },
  // Africa
  {
    slug: "cape-town",
    name: "Cape Town",
    country: "South Africa",
    continent: "Africa",
    coordinates: [18.4241, -33.9249],
    pitch: "A mountain, an ocean, and wine at the foot of both.",
  },
  {
    slug: "nairobi",
    name: "Nairobi",
    country: "Kenya",
    continent: "Africa",
    coordinates: [36.8219, -1.2921],
    pitch: "Coffee farms inside the city limits.",
  },
  // South America
  {
    slug: "buenos-aires",
    name: "Buenos Aires",
    country: "Argentina",
    continent: "South America",
    coordinates: [-58.3816, -34.6037],
    pitch: "Tango at midnight, steak at one.",
  },
  {
    slug: "rio-de-janeiro",
    name: "Rio de Janeiro",
    country: "Brazil",
    continent: "South America",
    coordinates: [-43.1729, -22.9068],
    pitch: "Beaches with their own moods.",
  },
  {
    slug: "patagonia",
    name: "Patagonia",
    country: "Argentina",
    continent: "South America",
    coordinates: [-72.6, -49.3],
    pitch: "Glaciers calving, sheep outnumbering people.",
  },
  // North America
  {
    slug: "vancouver",
    name: "Vancouver",
    country: "Canada",
    continent: "North America",
    coordinates: [-123.1207, 49.2827],
    pitch: "Rainforest at the city's back door.",
  },
  {
    slug: "havana",
    name: "Havana",
    country: "Cuba",
    continent: "North America",
    coordinates: [-82.3666, 23.1136],
    pitch: "1950s cars on streets that never repaved.",
  },
  // Europe (extras)
  {
    slug: "venice",
    name: "Venice",
    country: "Italy",
    continent: "Europe",
    coordinates: [12.3155, 45.4408],
    pitch: "A city that's been sinking gracefully for centuries.",
  },
  {
    slug: "santorini",
    name: "Santorini",
    country: "Greece",
    continent: "Europe",
    coordinates: [25.4615, 36.3932],
    pitch: "Volcanic crescent, every building painted blue and white.",
  },
];

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

function describeDistance(km: number): string {
  if (km < 800) return "a hop from there";
  if (km < 2500) return "a short flight away";
  if (km < 6500) return "across the same hemisphere";
  return "on the other side of the world";
}

/**
 * Pick the top N candidates closest in spirit (distance + same continent)
 * to a given starting slug. Skips anywhere already in CITIES so we never
 * recommend somewhere the traveler has been.
 */
export function predictNext(fromSlug: string, n = 3): Prediction[] {
  const from = CITIES[fromSlug];
  if (!from) return [];

  const pool = CANDIDATES.filter((c) => !CITIES[c.slug]);

  const scored = pool.map<Prediction>((c) => {
    const distanceKm = haversineKm(from.coordinates, c.coordinates);
    const sameContinent = from.continent === c.continent;
    // Score: stronger weight on closeness, plus a flat bonus for same continent
    // so neighbors don't always lose to faraway novelty.
    const score =
      (1 / Math.max(distanceKm, 80)) * 1_000_000 + (sameContinent ? 1500 : 0);
    const why = sameContinent
      ? `${describeDistance(distanceKm)} from ${from.name} — same continent.`
      : `${describeDistance(distanceKm)} from ${from.name} — worth the jump.`;
    return {
      ...c,
      fromSlug: from.slug,
      fromName: from.name,
      distanceKm: Math.round(distanceKm),
      sameContinent,
      score,
      why,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n);
}

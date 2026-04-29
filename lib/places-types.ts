export type Continent =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Oceania"
  | "Antarctica";

export type Place = {
  slug: string;
  name: string;
  country: string;
  continent: Continent;
  /** [longitude, latitude] — GeoJSON order, what react-simple-maps expects. */
  coordinates: [number, number];
  visitedAt: string; // ISO date or year-month
  year: number;
  tagline: string;
  journal: string;
  photos: { src: string; alt: string; credit?: string }[];
  audio?: { src: string; durationLabel?: string };
};

export type Stats = {
  totalPlaces: number;
  totalCountries: number;
  totalContinents: number;
  totalDistanceKm: number;
};

/** Where the camera should look when a continent is selected. */
export const CONTINENT_VIEW: Record<
  Continent | "All",
  { center: [number, number]; zoom: number }
> = {
  All: { center: [10, 20], zoom: 1 },
  Africa: { center: [20, 0], zoom: 2.2 },
  Asia: { center: [95, 30], zoom: 1.9 },
  Europe: { center: [15, 52], zoom: 2.6 },
  "North America": { center: [-100, 45], zoom: 2 },
  "South America": { center: [-60, -15], zoom: 2.2 },
  Oceania: { center: [145, -25], zoom: 2.4 },
  Antarctica: { center: [0, -75], zoom: 2 },
};

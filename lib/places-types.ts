export type Continent =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Oceania"
  | "Antarctica";

export type TransportMode =
  | "flight"
  | "train"
  | "car"
  | "ship"
  | "bus"
  | "hike"
  | "bike"
  | "kayak"
  | "rocket";

export type Place = {
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  continent: Continent;
  /** [longitude, latitude] — GeoJSON order, what react-simple-maps expects. */
  coordinates: [number, number];
  /** Order of the city's first appearance in the journey (1-based stop number). */
  firstStop: number;
  /** All stop numbers when this city was visited (1-based). */
  stops: number[];
  tagline: string;
  journal: string;
  photos: { src: string; alt: string }[];
  /** True when /public/places/{slug}/ has actual photos; false → use placeholder UI. */
  hasRealPhotos: boolean;
  audio?: { src?: string; durationLabel?: string };
};

export type Leg = {
  index: number;
  from: string;
  to: string;
  mode: TransportMode;
};

export type Stats = {
  totalPlaces: number;
  totalCountries: number;
  totalContinents: number;
  totalDistanceKm: number;
  totalLegs: number;
  legsByMode: Record<TransportMode, number>;
};

export const CONTINENT_VIEW: Record<
  Continent | "All",
  { center: [number, number]; zoom: number }
> = {
  // "All" view — zoomed back enough that the whole world fits with comfortable
  // breathing room around it. The user kept reporting "still zoomed in," so
  // this is generous on purpose.
  All: { center: [0, 15], zoom: 0.65 },
  Africa: { center: [10, 15], zoom: 2 },
  Asia: { center: [60, 35], zoom: 1.6 },
  Europe: { center: [15, 52], zoom: 2.6 },
  "North America": { center: [-95, 45], zoom: 2 },
  "South America": { center: [-60, -15], zoom: 2.2 },
  Oceania: { center: [145, -25], zoom: 2.4 },
  Antarctica: { center: [0, -75], zoom: 2 },
};

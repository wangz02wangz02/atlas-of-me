"use client";

/**
 * Find which country contains a [lon, lat] click using d3-geo's geoContains
 * on the cached countries-110m topojson. The topojson is fetched once on
 * first use and converted to a FeatureCollection of country geometries.
 */

import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
} from "geojson";

// topojson-specification types aren't installed; we use a structural cast.
type AnyTopology = {
  objects: Record<string, unknown>;
};

let cachedFeatures:
  | FeatureCollection<Geometry, GeoJsonProperties>
  | null = null;
let inFlight: Promise<FeatureCollection<
  Geometry,
  GeoJsonProperties
>> | null = null;

async function loadFeatures(): Promise<
  FeatureCollection<Geometry, GeoJsonProperties>
> {
  if (cachedFeatures) return cachedFeatures;
  if (inFlight) return inFlight;
  inFlight = fetch("/geo/countries-110m.json")
    .then((r) => r.json())
    .then((topology: AnyTopology) => {
      const key = Object.keys(topology.objects)[0];
      const obj = topology.objects[key] as Parameters<typeof feature>[1];
      const fc = feature(
        topology as Parameters<typeof feature>[0],
        obj,
      ) as unknown as FeatureCollection<Geometry, GeoJsonProperties>;
      cachedFeatures = fc;
      inFlight = null;
      return fc;
    });
  return inFlight;
}

/** Returns the country name that contains [lon, lat], or null. */
export async function countryAt(
  lon: number,
  lat: number,
): Promise<string | null> {
  try {
    const fc = await loadFeatures();
    for (const f of fc.features) {
      if (geoContains(f as Feature<Geometry>, [lon, lat])) {
        const props = f.properties as { name?: string } | null;
        return props?.name ?? null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Synchronous variant — call only after at least one `countryAt` has
 *  resolved (so the topojson is cached). Returns null if the cache is
 *  cold or the click misses every country (i.e., ocean). */
export function countryAtSync(lon: number, lat: number): string | null {
  if (!cachedFeatures) return null;
  for (const f of cachedFeatures.features) {
    if (geoContains(f as Feature<Geometry>, [lon, lat])) {
      const props = f.properties as { name?: string } | null;
      return props?.name ?? null;
    }
  }
  return null;
}

/** Trigger a fetch of the topojson without awaiting — handy on app
 *  startup so it's warm by the time the user clicks. */
export function warmCountryLookup(): void {
  void loadFeatures();
}

import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Place } from "./places-types";
import { getAllPlaces, getPlace } from "./places";

const PHOTO_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
let photoCache: Map<string, string[]> | null = null;

function loadRealPhotos(): Map<string, string[]> {
  if (photoCache) return photoCache;
  const out = new Map<string, string[]>();
  try {
    const root = path.join(process.cwd(), "public", "places");
    if (!fs.existsSync(root)) return (photoCache = out);
    for (const slug of fs.readdirSync(root)) {
      const dir = path.join(root, slug);
      if (!fs.statSync(dir).isDirectory()) continue;
      const files = fs
        .readdirSync(dir)
        .filter((f) => PHOTO_EXTS.has(path.extname(f).toLowerCase()))
        .sort();
      if (files.length) out.set(slug, files.map((f) => `/places/${slug}/${f}`));
    }
  } catch {
    /* ignore */
  }
  photoCache = out;
  return out;
}

function attach(place: Place, real: Map<string, string[]>): Place {
  const files = real.get(place.slug);
  if (!files?.length) return place;
  return {
    ...place,
    photos: files.map((src, i) => ({
      src,
      alt: `${place.name} — photo ${i + 1}`,
    })),
    hasRealPhotos: true,
  };
}

export function getAllPlacesWithPhotos(): Place[] {
  const real = loadRealPhotos();
  return getAllPlaces().map((p) => attach(p, real));
}

export function getPlaceWithPhotos(slug: string): Place | undefined {
  const p = getPlace(slug);
  if (!p) return undefined;
  return attach(p, loadRealPhotos());
}

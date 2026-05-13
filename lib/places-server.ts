import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Place } from "./places-types";
import { getAllPlaces, getPlace } from "./places";

const PHOTO_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

type WikiPhoto = {
  src: string;
  alt: string;
  page?: string;
  width?: number;
  height?: number;
};

let photoCache: Map<string, string[]> | null = null;
let wikiCache: Record<string, WikiPhoto> | null = null;

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

function loadWikiPhotos(): Record<string, WikiPhoto> {
  if (wikiCache) return wikiCache;
  try {
    const p = path.join(process.cwd(), "data", "wiki-photos.json");
    if (!fs.existsSync(p)) return (wikiCache = {});
    wikiCache = JSON.parse(fs.readFileSync(p, "utf8")) as Record<
      string,
      WikiPhoto
    >;
    return wikiCache;
  } catch {
    return (wikiCache = {});
  }
}

function attach(
  place: Place,
  real: Map<string, string[]>,
  wiki: Record<string, WikiPhoto>,
): Place {
  // Local user photos win when present.
  const files = real.get(place.slug);
  if (files?.length) {
    return {
      ...place,
      photos: files.map((src, i) => ({
        src,
        alt: `${place.name} — photo ${i + 1}`,
      })),
      hasRealPhotos: true,
    };
  }
  // Otherwise fall back to a curated Wikipedia/Commons landmark photo.
  const w = wiki[place.slug];
  if (w?.src) {
    return {
      ...place,
      photos: [{ src: w.src, alt: w.alt ?? `${place.name} — Wikipedia` }],
      hasRealPhotos: true,
    };
  }
  return place;
}

export function getAllPlacesWithPhotos(): Place[] {
  const real = loadRealPhotos();
  const wiki = loadWikiPhotos();
  return getAllPlaces().map((p) => attach(p, real, wiki));
}

export function getPlaceWithPhotos(slug: string): Place | undefined {
  const p = getPlace(slug);
  if (!p) return undefined;
  return attach(p, loadRealPhotos(), loadWikiPhotos());
}

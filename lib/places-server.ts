import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Place } from "./places-types";
import { getAllPlaces, getPlace } from "./places";

const PHOTO_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

// The only host the public CSP + next.config remotePatterns allow. Validating
// at load-time means a typo in wiki-photos.json (commons.wikimedia.org, http://,
// any other CDN) fails closed at build instead of producing an <img> the
// browser will refuse to render.
const WIKI_PREFIX = "https://upload.wikimedia.org/wikipedia/commons/";

// Slugs become URL path segments under /places/<slug>/. Anything outside this
// safelist is treated as a stray directory and skipped — guarantees the
// resolved path stays inside public/places/ even if a weird folder name slips
// onto disk.
const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

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
      // Pin the slug to a safe character set and confirm the resolved
      // directory is still inside `root` — belt-and-braces against any odd
      // entry (symlink, dotfile, traversal segment) on disk.
      if (!SAFE_SLUG_RE.test(slug)) continue;
      const dir = path.join(root, slug);
      const rel = path.relative(root, dir);
      if (rel.startsWith("..") || path.isAbsolute(rel)) continue;
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
    const raw = JSON.parse(fs.readFileSync(p, "utf8")) as Record<
      string,
      Partial<WikiPhoto>
    >;
    // Filter every entry through the WIKI_PREFIX gate so anything that would
    // be blocked by the CSP at runtime is dropped here instead — keeps the
    // photo fallback aligned with `next.config.ts` remotePatterns.
    const safe: Record<string, WikiPhoto> = {};
    for (const [slug, entry] of Object.entries(raw)) {
      if (!entry || typeof entry.src !== "string") continue;
      if (!entry.src.startsWith(WIKI_PREFIX)) continue;
      if (!SAFE_SLUG_RE.test(slug)) continue;
      safe[slug] = {
        src: entry.src,
        alt: typeof entry.alt === "string" ? entry.alt.slice(0, 200) : "",
        page: typeof entry.page === "string" ? entry.page : undefined,
        width: typeof entry.width === "number" ? entry.width : undefined,
        height: typeof entry.height === "number" ? entry.height : undefined,
      };
    }
    return (wikiCache = safe);
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

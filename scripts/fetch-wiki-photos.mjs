#!/usr/bin/env node
/**
 * Fetches one curated landmark photo per city from Wikipedia's pageimages API,
 * then writes the result to data/wiki-photos.json.
 *
 * Run with:  node scripts/fetch-wiki-photos.mjs
 *
 * We use a few title overrides where a city's display name doesn't match its
 * Wikipedia article title. New ones can be added below as we discover misses.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Title overrides for ambiguous / non-matching city names.
// Wikipedia title is what wins when the city name alone returns a disambig
// page or the wrong article. Add entries as we discover misses.
const TITLE_OVERRIDES = {
  "washington-dc": "Washington, D.C.",
  "new-york": "New York City",
  "san-francisco": "San Francisco",
  "los-angeles": "Los Angeles",
  "las-vegas": "Las Vegas",
  "mexico-city": "Mexico City",
  "sao-paulo": "São Paulo",
  "rio-de-janeiro": "Rio de Janeiro",
  "buenos-aires": "Buenos Aires",
  "cape-town": "Cape Town",
  "hong-kong": "Hong Kong",
  "kuala-lumpur": "Kuala Lumpur",
  "phnom-penh": "Phnom Penh",
  "siem-reap": "Siem Reap",
  "ho-chi-minh-city": "Ho Chi Minh City",
  "tel-aviv": "Tel Aviv",
  "saint-petersburg": "Saint Petersburg",
  "addis-ababa": "Addis Ababa",
  "cusco": "Cusco",
  "marrakesh": "Marrakesh",
  "reykjavik": "Reykjavík",
  "zurich": "Zürich",
  "munich": "Munich",
  "vienna": "Vienna",
  "prague": "Prague",
  "budapest": "Budapest",
  "warsaw": "Warsaw",
  "athens": "Athens",
  "istanbul": "Istanbul",
  "casablanca": "Casablanca",
  "nairobi": "Nairobi",
  "dubai": "Dubai",
  "doha": "Doha",
  "delhi": "Delhi",
  "mumbai": "Mumbai",
  "bangkok": "Bangkok",
  "singapore": "Singapore",
  "tokyo": "Tokyo",
  "kyoto": "Kyoto",
  "osaka": "Osaka",
  "seoul": "Seoul",
  "beijing": "Beijing",
  "shanghai": "Shanghai",
  "taipei": "Taipei",
  "sydney": "Sydney",
  "melbourne": "Melbourne",
  "auckland": "Auckland",
};

function parseCities(text) {
  // Each city block in journey.ts starts with `"slug-name": {` followed by
  // `slug: "...", name: "...", country: "..."`. We pluck those out.
  const out = [];
  const re =
    /slug:\s*"([^"]+)",\s*\n\s*name:\s*"([^"]+)",\s*\n\s*country:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push({ slug: m[1], name: m[2], country: m[3] });
  }
  return out;
}

function titleFor(city) {
  return TITLE_OVERRIDES[city.slug] ?? city.name;
}

async function fetchBatch(titles) {
  const params = new URLSearchParams({
    action: "query",
    titles: titles.join("|"),
    prop: "pageimages|info",
    pithumbsize: "1600",
    piprop: "original|thumbnail|name",
    inprop: "url",
    redirects: "1",
    format: "json",
    formatversion: "2",
    origin: "*",
  });
  const url = `https://en.wikipedia.org/w/api.php?${params}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "AtlasOfMe/0.8 (https://github.com/wangz02wangz02/atlas-of-me; personal travel journal)",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

const journeyText = await fs.readFile(
  path.join(ROOT, "lib", "journey.ts"),
  "utf8",
);
const cities = parseCities(journeyText);
console.log(`Parsed ${cities.length} cities from lib/journey.ts`);

if (!cities.length) {
  console.error("No cities parsed — aborting.");
  process.exit(1);
}

const results = {};
const missed = [];
const BATCH = 25;

for (let i = 0; i < cities.length; i += BATCH) {
  const batch = cities.slice(i, i + BATCH);
  const titles = batch.map(titleFor);
  process.stdout.write(`Batch ${i / BATCH + 1}: ${titles.length} cities… `);
  let json;
  try {
    json = await fetchBatch(titles);
  } catch (e) {
    console.error("\n  fetch failed:", e.message);
    continue;
  }

  // Map both the query title and any redirect targets back to our slug.
  const titleToSlug = {};
  for (const c of batch) {
    titleToSlug[titleFor(c).toLowerCase()] = c.slug;
  }
  const redirectFrom = {};
  for (const r of json.query?.redirects ?? []) {
    redirectFrom[r.to.toLowerCase()] = r.from.toLowerCase();
  }
  const normalizedFrom = {};
  for (const r of json.query?.normalized ?? []) {
    normalizedFrom[r.to.toLowerCase()] = r.from.toLowerCase();
  }

  const pages = json.query?.pages ?? [];
  let found = 0;
  for (const p of pages) {
    const pageTitleLc = p.title.toLowerCase();
    let originalQueryTitle = pageTitleLc;
    if (redirectFrom[originalQueryTitle]) {
      originalQueryTitle = redirectFrom[originalQueryTitle];
    }
    if (normalizedFrom[originalQueryTitle]) {
      originalQueryTitle = normalizedFrom[originalQueryTitle];
    }
    const slug = titleToSlug[originalQueryTitle];
    if (!slug) {
      console.warn(`\n  Unmatched page: ${p.title}`);
      continue;
    }
    const city = batch.find((c) => c.slug === slug);
    const img = p.original ?? p.thumbnail;
    if (!img || !img.source) {
      missed.push(slug);
      continue;
    }
    results[slug] = {
      src: img.source,
      alt: `${city.name} — Wikipedia`,
      page: p.fullurl,
      width: img.width,
      height: img.height,
    };
    found++;
  }
  console.log(`got ${found}/${batch.length}`);
  // Be polite to Wikipedia
  await new Promise((r) => setTimeout(r, 400));
}

const stillMissing = cities
  .map((c) => c.slug)
  .filter((s) => !results[s]);
console.log(
  `\nDone. ${Object.keys(results).length}/${cities.length} cities have a photo.`,
);
if (stillMissing.length) {
  console.log(`Missing (${stillMissing.length}):`, stillMissing.join(", "));
}

await fs.mkdir(path.join(ROOT, "data"), { recursive: true });
await fs.writeFile(
  path.join(ROOT, "data", "wiki-photos.json"),
  JSON.stringify(results, null, 2) + "\n",
);
console.log("Wrote data/wiki-photos.json");

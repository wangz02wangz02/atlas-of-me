#!/usr/bin/env node
/**
 * Fetches an elevation reading per city from the Open-Elevation public API,
 * then writes data/altitudes.json.
 *
 * Run with:  node scripts/fetch-altitudes.mjs
 *
 * Open-Elevation accepts batched POST. We send all cities in one request
 * (it handles ~100+ comfortably), wait, and write the result.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function parseCities(text) {
  // Match each city's slug + coordinates [lon, lat].  The coordinates field
  // appears as `coordinates: [number, number]` in the TS source.
  const out = [];
  const re =
    /slug:\s*"([^"]+)",\s*\n\s*name:\s*"([^"]+)",[\s\S]*?coordinates:\s*\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push({
      slug: m[1],
      name: m[2],
      lon: parseFloat(m[3]),
      lat: parseFloat(m[4]),
    });
  }
  return out;
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

// Open-Elevation seems to time out occasionally with very large batches.
// Send 40 at a time to be safe.
const BATCH = 40;
const altitudes = {};

for (let i = 0; i < cities.length; i += BATCH) {
  const batch = cities.slice(i, i + BATCH);
  process.stdout.write(
    `Batch ${Math.floor(i / BATCH) + 1}: ${batch.length} cities… `,
  );
  const body = {
    locations: batch.map((c) => ({ latitude: c.lat, longitude: c.lon })),
  };
  let json;
  try {
    const res = await fetch("https://api.open-elevation.com/api/v1/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`HTTP ${res.status} ${res.statusText}`);
      continue;
    }
    json = await res.json();
  } catch (e) {
    console.error(`Network error: ${e.message}`);
    continue;
  }
  const results = json.results ?? [];
  let got = 0;
  for (let j = 0; j < batch.length; j++) {
    const elev = results[j]?.elevation;
    if (typeof elev === "number") {
      altitudes[batch[j].slug] = elev;
      got++;
    }
  }
  console.log(`got ${got}/${batch.length}`);
  await new Promise((r) => setTimeout(r, 600));
}

const missing = cities.map((c) => c.slug).filter((s) => !(s in altitudes));
console.log(
  `\nDone. ${Object.keys(altitudes).length}/${cities.length} cities have an altitude.`,
);
if (missing.length) {
  console.log(`Missing (${missing.length}):`, missing.join(", "));
}

await fs.mkdir(path.join(ROOT, "data"), { recursive: true });
await fs.writeFile(
  path.join(ROOT, "data", "altitudes.json"),
  JSON.stringify(altitudes, null, 2) + "\n",
);
console.log("Wrote data/altitudes.json");

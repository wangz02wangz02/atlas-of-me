# Atlas of Me

A cinematic, interactive travel journal — a personal world map, photographs, written reflections, and short audio logs from every place I've been.

> v0.1 — initial scaffold. Sample places use placeholder photos and silent audio slots so the full UI flow works end-to-end.

## What's in v1

- **Interactive world map** built with `react-simple-maps` + a local TopoJSON, projected with `geoEqualEarth`, drag-to-pan and scroll-to-zoom.
- **Animated markers** with a pulsing ring and warm amber glow, hover preview card, click to enter the detail page.
- **Place detail pages** with a cinematic hero image, drop-cap journal layout, photo gallery with lightbox, and a custom audio player.
- **Content system**: each place is a single JSON file in `content/places/`. Add a file, restart, done — no component code changes.
- **Stretch goals included**:
  - Animated travel statistics (places, countries, continents, kilometers traveled — distance computed from the visit chronology via Haversine).
  - Filter the map by continent and year.
  - Mobile-responsive layout.

## Stack

- Next.js 16 (App Router, React 19, Turbopack)
- Tailwind CSS v4
- `react-simple-maps` + `d3-geo` for the SVG map
- `motion` (formerly Framer Motion) for transitions
- All content as flat JSON; no database in v1

## Getting started

```bash
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The `--legacy-peer-deps` flag is needed because `react-simple-maps@3` declares React 18 in its peer deps; it works fine on React 19 in practice.

## Adding a place

Create `content/places/<slug>.json`:

```json
{
  "slug": "lisbon",
  "name": "Lisbon",
  "country": "Portugal",
  "continent": "Europe",
  "coordinates": [-9.1393, 38.7223],
  "visitedAt": "2024-07",
  "year": 2024,
  "tagline": "Tile, hills, and the Atlantic at the end of every street.",
  "journal": "First paragraph...\n\nSecond paragraph...",
  "photos": [
    { "src": "https://your-host/photo.jpg", "alt": "Tram going up Alfama" }
  ],
  "audio": { "src": "/audio/lisbon.mp3", "durationLabel": "1:36" }
}
```

`coordinates` are `[longitude, latitude]` (GeoJSON order). Photos can be remote (add the hostname to `next.config.ts` → `images.remotePatterns`) or local (drop them in `public/`). Audio files should live in `public/audio/`. Omit the `audio` field entirely if you don't have one yet — the player will show "Audio coming soon".

## Project structure

```
app/
  layout.tsx              # Fonts, metadata, dark theme wrapper
  page.tsx                # Landing: hero + stats + map + entry list
  places/[slug]/page.tsx  # Per-place SSG page
components/
  WorldMap.tsx            # The map (SVG, markers, hover preview)
  AtlasExplorer.tsx       # Filters + map + entry list (client)
  PlaceDetailClient.tsx   # Hero + journal + gallery + audio
  Stats.tsx               # Animated counters
  PhotoGallery.tsx        # Grid + lightbox
  AudioPlayer.tsx         # Custom audio controls
content/places/*.json     # One file per place
lib/places.ts             # Loader, types, Haversine stats
public/geo/countries-110m.json  # World map TopoJSON (110m, ~105KB)
```

## Things still to do

- Real photographs and recorded audio for each entry
- Custom illustrated landmark icons per place
- Optional 3D-globe landing intro (stretch goal — `three` / `globe.gl`)
- Ambient regional soundscapes
- Timeline-mode alternate view

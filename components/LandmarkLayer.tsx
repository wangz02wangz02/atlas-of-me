"use client";

import type { ReactElement } from "react";
import { Marker } from "react-simple-maps";
import type { Place } from "@/lib/places-types";

/** Hand-drawn SVG silhouettes for famous landmarks. Each is roughly 24px tall,
 *  drawn from (-12, -24) to (12, 0) so the base sits on the marker coordinate. */
const LANDMARK: Record<string, ReactElement> = {
  // Eiffel Tower (France)
  France: (
    <g>
      <path
        d="M 0 -24 L -1 -22 L -1 -16 L -3 -10 L -5 -2 L -7 0 L 7 0 L 5 -2 L 3 -10 L 1 -16 L 1 -22 Z"
        fill="#9a7546"
        stroke="#3a2a14"
        strokeWidth="0.4"
        strokeLinejoin="round"
      />
      <line x1="-3" y1="-10" x2="3" y2="-10" stroke="#3a2a14" strokeWidth="0.4" />
      <line x1="-1.5" y1="-16" x2="1.5" y2="-16" stroke="#3a2a14" strokeWidth="0.4" />
    </g>
  ),
  // Big Ben (United Kingdom)
  "United Kingdom": (
    <g>
      <rect x="-3" y="-22" width="6" height="22" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.4" />
      <rect x="-3.6" y="-15" width="7.2" height="3.5" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <circle cx="0" cy="-13.2" r="1.2" fill="#fde8b8" stroke="#3a2a14" strokeWidth="0.3" />
      <path d="M -2 -22 L 0 -25 L 2 -22 Z" fill="#9a4a28" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
  // Statue of Liberty (US)
  "United States of America": (
    <g>
      <rect x="-3" y="-6" width="6" height="6" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.4" />
      <path
        d="M -1.6 -6 L -1.6 -16 L -2.4 -16 L 0 -22 L 2.4 -16 L 1.6 -16 L 1.6 -6 Z"
        fill="#7aa089"
        stroke="#3a2a14"
        strokeWidth="0.4"
      />
      <circle cx="0" cy="-23" r="1.5" fill="#7aa089" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
  // Pyramid (Egypt)
  Egypt: (
    <g>
      <path d="M -10 0 L 0 -20 L 10 0 Z" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.4" strokeLinejoin="round" />
      <path d="M 0 -20 L -1.5 0 Z" stroke="#3a2a14" strokeWidth="0.3" fill="none" />
    </g>
  ),
  // Brandenburg-style gate (Germany)
  Germany: (
    <g>
      <rect x="-9" y="-14" width="18" height="2" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-9" y="-14" width="2" height="14" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-1" y="-14" width="2" height="14" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="7" y="-14" width="2" height="14" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-9" y="-18" width="18" height="2" fill="#9a4a28" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
  // Colosseum (Italy)
  Italy: (
    <g>
      <ellipse cx="0" cy="-6" rx="11" ry="4" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-11" y="-12" width="22" height="6" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <ellipse cx="0" cy="-12" rx="11" ry="3" fill="#d6bb8a" stroke="#3a2a14" strokeWidth="0.3" />
      <line x1="-7" y1="-12" x2="-7" y2="-6" stroke="#3a2a14" strokeWidth="0.3" />
      <line x1="-3.5" y1="-12" x2="-3.5" y2="-6" stroke="#3a2a14" strokeWidth="0.3" />
      <line x1="0" y1="-12" x2="0" y2="-6" stroke="#3a2a14" strokeWidth="0.3" />
      <line x1="3.5" y1="-12" x2="3.5" y2="-6" stroke="#3a2a14" strokeWidth="0.3" />
      <line x1="7" y1="-12" x2="7" y2="-6" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
  // Sagrada Familia (Spain)
  Spain: (
    <g>
      <path d="M -7 0 L -7 -16 L -5 -22 L -3 -16 L -3 0 Z" fill="#d6bb8a" stroke="#3a2a14" strokeWidth="0.3" />
      <path d="M -2 0 L -2 -18 L 0 -25 L 2 -18 L 2 0 Z" fill="#d6bb8a" stroke="#3a2a14" strokeWidth="0.3" />
      <path d="M 3 0 L 3 -16 L 5 -22 L 7 -16 L 7 0 Z" fill="#d6bb8a" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
  // Acropolis / Parthenon (Greece)
  Greece: (
    <g>
      <path d="M -10 -12 L -10 -14 L 10 -14 L 10 -12 Z" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <path d="M -10 -14 L 0 -20 L 10 -14 Z" fill="#9a4a28" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-9" y="-12" width="2" height="12" fill="#d6bb8a" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-5" y="-12" width="2" height="12" fill="#d6bb8a" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-1" y="-12" width="2" height="12" fill="#d6bb8a" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="3" y="-12" width="2" height="12" fill="#d6bb8a" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="7" y="-12" width="2" height="12" fill="#d6bb8a" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
  // Hagia Sophia / domed mosque (Turkey)
  Turkey: (
    <g>
      <rect x="-9" y="-10" width="18" height="10" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <path d="M -9 -10 A 9 9 0 0 1 9 -10 Z" fill="#9a4a28" stroke="#3a2a14" strokeWidth="0.3" />
      <line x1="-13" y1="0" x2="-13" y2="-22" stroke="#9a7546" strokeWidth="1" />
      <line x1="13" y1="0" x2="13" y2="-22" stroke="#9a7546" strokeWidth="1" />
      <circle cx="0" cy="-19" r="1.2" fill="#fde8b8" />
    </g>
  ),
  // Great Wall / pagoda (China)
  China: (
    <g>
      <path d="M -12 -2 L -8 -4 L -8 -8 L -4 -10 L -4 -14 L 0 -16 L 4 -14 L 4 -10 L 8 -8 L 8 -4 L 12 -2 L 12 0 L -12 0 Z" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
  // Taipei 101 (Taiwan)
  Taiwan: (
    <g>
      <rect x="-3" y="-22" width="6" height="22" fill="#7aa089" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-3.6" y="-18" width="7.2" height="2" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-3.6" y="-13" width="7.2" height="2" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-3.6" y="-8" width="7.2" height="2" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <line x1="0" y1="-22" x2="0" y2="-26" stroke="#3a2a14" strokeWidth="0.5" />
    </g>
  ),
  // Forbidden City roof (China alt key)
  // Christ the Redeemer-like silhouette repurposed for South America fallback
  // Atomium (Belgium)
  Belgium: (
    <g>
      <circle cx="0" cy="-16" r="2" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
      <circle cx="-7" cy="-10" r="2" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
      <circle cx="7" cy="-10" r="2" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
      <circle cx="-4" cy="-4" r="2" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
      <circle cx="4" cy="-4" r="2" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
      <line x1="0" y1="-16" x2="-7" y2="-10" stroke="#3a2a14" strokeWidth="0.3" />
      <line x1="0" y1="-16" x2="7" y2="-10" stroke="#3a2a14" strokeWidth="0.3" />
      <line x1="-7" y1="-10" x2="-4" y2="-4" stroke="#3a2a14" strokeWidth="0.3" />
      <line x1="7" y1="-10" x2="4" y2="-4" stroke="#3a2a14" strokeWidth="0.3" />
      <line x1="-4" y1="-4" x2="4" y2="-4" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
  // Windmill (Netherlands)
  Netherlands: (
    <g>
      <rect x="-3" y="-12" width="6" height="12" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
      <path d="M -3 -12 L 3 -12 L 1.5 -16 L -1.5 -16 Z" fill="#9a4a28" stroke="#3a2a14" strokeWidth="0.3" />
      <line x1="0" y1="-14" x2="-9" y2="-22" stroke="#3a2a14" strokeWidth="0.6" />
      <line x1="0" y1="-14" x2="9" y2="-22" stroke="#3a2a14" strokeWidth="0.6" />
      <line x1="0" y1="-14" x2="-9" y2="-6" stroke="#3a2a14" strokeWidth="0.6" />
      <line x1="0" y1="-14" x2="9" y2="-6" stroke="#3a2a14" strokeWidth="0.6" />
    </g>
  ),
  // Matterhorn (Switzerland)
  Switzerland: (
    <g>
      <path d="M -10 0 L -2 -18 L 2 -14 L 10 0 Z" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.4" />
      <path d="M -2 -18 L -1 -14 L 2 -14 Z" fill="#fde8b8" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
  // Northern lights silhouette / fjord (Norway)
  Norway: (
    <g>
      <path d="M -10 0 L -4 -16 L 0 -8 L 4 -18 L 10 0 Z" fill="#7aa089" stroke="#3a2a14" strokeWidth="0.3" />
      <path d="M -8 -8 L -4 -16 L -2 -10" stroke="#fde8b8" strokeWidth="0.5" fill="none" />
    </g>
  ),
  // Little Mermaid / Nyhavn houses (Denmark)
  Denmark: (
    <g>
      <rect x="-9" y="-10" width="3" height="10" fill="#9a4a28" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-5.5" y="-12" width="3" height="12" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-2" y="-9" width="3" height="9" fill="#7aa089" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="1.5" y="-13" width="3" height="13" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="5" y="-10" width="3" height="10" fill="#fde8b8" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
  // Pagoda (Japan replacement for any East Asia fallback) — not used directly but kept
  // Salt Cathedral / Andean peaks (Colombia, Peru)
  Peru: (
    <g>
      <path d="M -10 0 L -6 -10 L -2 -4 L 2 -16 L 6 -8 L 10 0 Z" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.4" />
      <path d="M 2 -16 L 1 -12 L 4 -12 Z" fill="#fde8b8" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
  Colombia: (
    <g>
      <path d="M -10 0 L -4 -12 L 0 -6 L 4 -14 L 10 0 Z" fill="#7aa089" stroke="#3a2a14" strokeWidth="0.4" />
    </g>
  ),
  // Ferris wheel (Canada — CN tower)
  Canada: (
    <g>
      <line x1="0" y1="-22" x2="0" y2="0" stroke="#9a7546" strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="0" cy="-14" rx="3.5" ry="2" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <circle cx="0" cy="-22" r="1.2" fill="#9a4a28" />
    </g>
  ),
  // Mosque silhouette (Morocco)
  Morocco: (
    <g>
      <rect x="-3" y="-22" width="6" height="22" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
      <path d="M -3 -22 L 3 -22 L 0 -25 Z" fill="#9a4a28" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-9" y="-10" width="6" height="10" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="3" y="-10" width="6" height="10" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
  // Old town castle (Czechia)
  Czechia: (
    <g>
      <rect x="-9" y="-10" width="18" height="10" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-9" y="-12" width="3" height="2" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-3" y="-12" width="3" height="2" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="3" y="-12" width="3" height="2" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <path d="M -3 -10 L 3 -10 L 3 -18 L 0 -22 L -3 -18 Z" fill="#9a4a28" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
  // Generic onion-dome (Russia — not visited but) / Stephansdom (Austria)
  Austria: (
    <g>
      <rect x="-3" y="-14" width="6" height="14" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <path d="M -3 -14 L 3 -14 L 0 -24 Z" fill="#9a4a28" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
  // Hungarian Parliament
  Hungary: (
    <g>
      <rect x="-10" y="-9" width="20" height="9" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <rect x="-2" y="-14" width="4" height="5" fill="#cb9b56" stroke="#3a2a14" strokeWidth="0.3" />
      <path d="M -2 -14 L 2 -14 L 0 -20 Z" fill="#9a4a28" stroke="#3a2a14" strokeWidth="0.3" />
    </g>
  ),
};

// Region-keyed fallback (very simple) — when we don't have a hand-drawn icon
const FALLBACK = (
  <g>
    <circle cx="0" cy="-6" r="3.5" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
    <rect x="-1" y="-3" width="2" height="3" fill="#9a7546" stroke="#3a2a14" strokeWidth="0.3" />
  </g>
);

export default function LandmarkLayer({
  places,
  visibleByPlace,
}: {
  places: Place[];
  visibleByPlace: Map<string, boolean>;
}) {
  // One landmark per country (use the first matching place by stop order)
  const seen = new Set<string>();
  const items: Array<{ slug: string; coord: [number, number]; country: string }> = [];
  for (const p of places) {
    if (seen.has(p.country)) continue;
    seen.add(p.country);
    if (visibleByPlace && !visibleByPlace.get(p.slug)) continue;
    items.push({ slug: p.slug, coord: p.coordinates, country: p.country });
  }
  return (
    <g pointerEvents="none">
      {items.map((it) => {
        const icon = LANDMARK[it.country] ?? FALLBACK;
        return (
          <Marker key={`lm-${it.slug}`} coordinates={it.coord}>
            <g>
              {/* Soft drop shadow for the "protruding" feel */}
              <ellipse cx="0" cy="1.5" rx="9" ry="2" fill="rgba(60,40,12,0.18)" />
              {icon}
            </g>
          </Marker>
        );
      })}
    </g>
  );
}

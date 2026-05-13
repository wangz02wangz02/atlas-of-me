"use client";

import type { ReactElement } from "react";
import { Marker } from "react-simple-maps";
import type { Place } from "@/lib/places-types";

/**
 * Hand-drawn SVG figurines for famous landmarks, one per country.
 *
 * Each icon is drawn within a roughly 28-unit-wide × 32-unit-tall box,
 * from (-14, -32) to (14, 0), so the base of the figurine sits ON the
 * marker coordinate (the city/country dot). Most use 4-6 layered paths
 * with subtle shading for a small but readable silhouette at any zoom.
 *
 * The palette stays in the project's warm-vintage range (sandstone,
 * umber, parchment, deep stone) so the figurines feel like illustrated
 * postcards rather than icons from a stock library.
 */

// Reused palette tokens
const STONE = "#8a6a3e";
const STONE_DARK = "#5a3f1f";
const STONE_LIGHT = "#c8a160";
const ROOF = "#9a4a28";
const ROOF_DARK = "#6a2e16";
const SAND = "#d9b277";
const SAND_DARK = "#b08146";
const GOLD = "#d8a657";
const CREAM = "#fde8b8";
const SNOW = "#fffaf0";
const SKY = "#7aa0b6";
const SEA = "#3f6d83";
const COPPER = "#6e9b80";
const GREEN_DARK = "#3f5f3a";
const DEEP = "#2a1d10";
const BLOOD = "#7a2018";

const LANDMARK: Record<string, ReactElement> = {
  // ---------------------------------------------------------------------------
  // Eiffel Tower — France
  // 4 splayed legs, 3 platforms, antenna. Iron-lattice feel via thin verticals.
  France: (
    <g>
      {/* base ground shadow */}
      <ellipse cx="0" cy="0.5" rx="11" ry="1.2" fill={DEEP} opacity="0.25" />
      {/* main silhouette — splayed legs into top spire */}
      <path
        d="M -8 0 L -6 -8 L -3 -16 L -1.4 -23 L -1.4 -26 L 0 -29.5 L 1.4 -26 L 1.4 -23 L 3 -16 L 6 -8 L 8 0 Z"
        fill={STONE}
        stroke={STONE_DARK}
        strokeWidth="0.35"
        strokeLinejoin="round"
      />
      {/* highlight strip on the right side */}
      <path
        d="M 0 -29.5 L 1.4 -26 L 1.4 -23 L 3 -16 L 6 -8 L 8 0 L 6 0 L 4.5 -8 L 2 -16 L 1 -23 L 1 -26 Z"
        fill={STONE_LIGHT}
        opacity="0.45"
      />
      {/* first platform deck */}
      <rect x="-7" y="-9" width="14" height="0.9" fill={STONE_DARK} />
      <rect x="-7" y="-9.7" width="14" height="0.4" fill={STONE_LIGHT} />
      {/* arch between the legs (first level) */}
      <path
        d="M -5 -1 Q 0 -7 5 -1 L 5 0 L -5 0 Z"
        fill={DEEP}
        opacity="0.55"
      />
      {/* second platform deck */}
      <rect x="-3.4" y="-17" width="6.8" height="0.7" fill={STONE_DARK} />
      {/* lattice cross marks (small) */}
      <line x1="-4.5" y1="-4" x2="-2.5" y2="-6" stroke={STONE_DARK} strokeWidth="0.25" />
      <line x1="-2.5" y1="-4" x2="-4.5" y2="-6" stroke={STONE_DARK} strokeWidth="0.25" />
      <line x1="4.5" y1="-4" x2="2.5" y2="-6" stroke={STONE_DARK} strokeWidth="0.25" />
      <line x1="2.5" y1="-4" x2="4.5" y2="-6" stroke={STONE_DARK} strokeWidth="0.25" />
      <line x1="-2" y1="-12" x2="2" y2="-14" stroke={STONE_DARK} strokeWidth="0.22" />
      <line x1="2" y1="-12" x2="-2" y2="-14" stroke={STONE_DARK} strokeWidth="0.22" />
      {/* antenna spike on top */}
      <line x1="0" y1="-29.5" x2="0" y2="-32" stroke={STONE_DARK} strokeWidth="0.5" />
      <circle cx="0" cy="-32.2" r="0.5" fill={GOLD} />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Big Ben — United Kingdom
  // Square Gothic clock tower with pyramid spire and ornate detail.
  "United Kingdom": (
    <g>
      <ellipse cx="0" cy="0.5" rx="6" ry="1" fill={DEEP} opacity="0.25" />
      {/* tower body */}
      <rect
        x="-3"
        y="-24"
        width="6"
        height="24"
        fill={SAND}
        stroke={STONE_DARK}
        strokeWidth="0.35"
      />
      {/* darker side shading */}
      <rect x="1.4" y="-24" width="1.6" height="24" fill={SAND_DARK} opacity="0.55" />
      {/* horizontal stone bands */}
      <rect x="-3" y="-20" width="6" height="0.4" fill={STONE_DARK} />
      <rect x="-3" y="-3" width="6" height="0.4" fill={STONE_DARK} />
      {/* arched window slits */}
      <path
        d="M -1.5 -19 Q -1.5 -20.5 0 -20.5 Q 1.5 -20.5 1.5 -19 L 1.5 -16 L -1.5 -16 Z"
        fill={DEEP}
        opacity="0.45"
      />
      {/* clock face */}
      <rect x="-3.5" y="-15.5" width="7" height="3.5" fill={STONE_LIGHT} stroke={STONE_DARK} strokeWidth="0.3" />
      <circle cx="0" cy="-13.7" r="1.6" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.3" />
      <line x1="0" y1="-13.7" x2="0" y2="-12.5" stroke={STONE_DARK} strokeWidth="0.3" />
      <line x1="0" y1="-13.7" x2="0.9" y2="-13.7" stroke={STONE_DARK} strokeWidth="0.3" />
      {/* belfry */}
      <rect x="-3.4" y="-26" width="6.8" height="2" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* spire (pyramid) */}
      <path d="M -3 -26 L 0 -32 L 3 -26 Z" fill={ROOF} stroke={STONE_DARK} strokeWidth="0.3" strokeLinejoin="round" />
      <path d="M 0 -32 L 0 -26 L 3 -26 Z" fill={ROOF_DARK} opacity="0.55" />
      {/* gold finial */}
      <circle cx="0" cy="-32.6" r="0.6" fill={GOLD} />
      {/* corner pinnacles */}
      <path d="M -3.6 -26 L -3.6 -28.4 L -3 -28.4 L -3 -26 Z" fill={SAND_DARK} />
      <path d="M 3.6 -26 L 3.6 -28.4 L 3 -28.4 L 3 -26 Z" fill={SAND_DARK} />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Statue of Liberty — United States of America
  "United States of America": (
    <g>
      <ellipse cx="0" cy="0.5" rx="7" ry="1" fill={DEEP} opacity="0.25" />
      {/* pedestal base */}
      <path
        d="M -5 0 L -5 -3 L -4.5 -7 L 4.5 -7 L 5 -3 L 5 0 Z"
        fill={STONE_LIGHT}
        stroke={STONE_DARK}
        strokeWidth="0.35"
      />
      <rect x="-4" y="-9" width="8" height="2" fill={STONE} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* tablet in left arm */}
      <rect x="-3.6" y="-17" width="2.4" height="3" fill={STONE_LIGHT} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* robe body */}
      <path
        d="M -2.2 -9 L -2.6 -16 L -1.8 -22 L 1.8 -22 L 2.6 -16 L 2.2 -9 Z"
        fill={COPPER}
        stroke={STONE_DARK}
        strokeWidth="0.35"
      />
      {/* head silhouette */}
      <circle cx="0" cy="-23.4" r="1.5" fill={COPPER} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* spiked crown */}
      <path
        d="M -2 -24.5 L -1.5 -26 L -0.8 -24.5 L -0.4 -26.4 L 0 -24.5 L 0.4 -26.4 L 0.8 -24.5 L 1.5 -26 L 2 -24.5 Z"
        fill={COPPER}
        stroke={STONE_DARK}
        strokeWidth="0.3"
        strokeLinejoin="round"
      />
      {/* torch arm */}
      <path d="M 2.4 -19 L 4.4 -28 L 5.4 -32" stroke={COPPER} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M 4.6 -32 L 6.6 -32 L 5.6 -30 Z" fill={GOLD} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* flame */}
      <path d="M 4.8 -32 Q 5.6 -33.5 6.4 -32 Q 5.6 -31 4.8 -32" fill={GOLD} />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Pyramids of Giza — Egypt (3 pyramids + a small Sphinx)
  Egypt: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1.2" fill={DEEP} opacity="0.25" />
      {/* back pyramid (Khufu — largest) */}
      <path d="M -3 0 L 4 -24 L 11 0 Z" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.35" strokeLinejoin="round" />
      <path d="M 4 -24 L 4 0 L 11 0 Z" fill={STONE_DARK} opacity="0.45" />
      {/* mid pyramid (Khafre) */}
      <path d="M -8 0 L -2 -20 L 4 0 Z" fill={SAND} stroke={STONE_DARK} strokeWidth="0.35" strokeLinejoin="round" />
      <path d="M -2 -20 L -2 0 L 4 0 Z" fill={STONE_DARK} opacity="0.35" />
      {/* front pyramid (Menkaure) */}
      <path d="M -12 0 L -8 -13 L -4 0 Z" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.35" strokeLinejoin="round" />
      {/* tiny sphinx in foreground */}
      <path d="M -1 -1 L 2 -1 L 2.4 -3 L 1 -4 L 0 -4 L -1 -3 Z" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="0.8" y="-4.6" width="1.2" height="0.8" fill={SAND_DARK} />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Brandenburg Gate — Germany
  Germany: (
    <g>
      <ellipse cx="0" cy="0.5" rx="11" ry="1" fill={DEEP} opacity="0.25" />
      {/* base steps */}
      <rect x="-10" y="-1" width="20" height="1" fill={STONE_DARK} />
      {/* columns (6 doric) */}
      <rect x="-9.4" y="-15" width="1.6" height="14" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="-6.3" y="-15" width="1.6" height="14" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="-3.2" y="-15" width="1.6" height="14" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="1.6" y="-15" width="1.6" height="14" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="4.7" y="-15" width="1.6" height="14" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="7.8" y="-15" width="1.6" height="14" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* central archway */}
      <rect x="-1.4" y="-15" width="2.8" height="14" fill={DEEP} opacity="0.4" />
      {/* entablature */}
      <rect x="-10" y="-17" width="20" height="2.2" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="-10" y="-18" width="20" height="1" fill={STONE} />
      {/* quadriga statue on top */}
      <rect x="-3" y="-20.5" width="6" height="2.5" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* horses (simplified) */}
      <path d="M -2.4 -20.5 L -2.4 -23 L -1.4 -24 L -1.4 -23 L -0.8 -23 L -0.8 -20.5 Z" fill={STONE_DARK} />
      <path d="M -0.4 -20.5 L -0.4 -23 L 0.6 -24 L 0.6 -23 L 1.2 -23 L 1.2 -20.5 Z" fill={STONE_DARK} />
      <path d="M 1.6 -20.5 L 1.6 -23 L 2.6 -24 L 2.6 -23 L 3.2 -23 L 3.2 -20.5 Z" fill={STONE_DARK} />
      {/* victory wing flourish */}
      <path d="M -2 -23.5 L 0 -25 L 2 -23.5" stroke={GOLD} strokeWidth="0.6" fill="none" strokeLinecap="round" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Colosseum — Italy
  Italy: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1.2" fill={DEEP} opacity="0.25" />
      {/* outer oval (back) */}
      <ellipse cx="0" cy="-6" rx="13" ry="4.6" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.35" />
      {/* mid level */}
      <rect x="-12.5" y="-14" width="25" height="8" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      <ellipse cx="0" cy="-14" rx="12.5" ry="3.4" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* top level (partial ruin — only left ~60%) */}
      <path
        d="M -12 -14 L -12 -19 L 3 -19 L 3 -16 L 4 -16 L 4 -14 Z"
        fill={SAND}
        stroke={STONE_DARK}
        strokeWidth="0.3"
      />
      {/* arched openings — three tiers */}
      {Array.from({ length: 7 }).map((_, i) => {
        const x = -10.4 + i * 3.2;
        return (
          <path
            key={`a1-${i}`}
            d={`M ${x} -6 Q ${x + 1} -8.6 ${x + 2} -6 L ${x + 2} -5 L ${x} -5 Z`}
            fill={DEEP}
            opacity="0.55"
          />
        );
      })}
      {Array.from({ length: 7 }).map((_, i) => {
        const x = -10.4 + i * 3.2;
        return (
          <path
            key={`a2-${i}`}
            d={`M ${x} -12.5 Q ${x + 1} -14.5 ${x + 2} -12.5 L ${x + 2} -11 L ${x} -11 Z`}
            fill={DEEP}
            opacity="0.5"
          />
        );
      })}
      {Array.from({ length: 4 }).map((_, i) => {
        const x = -10.4 + i * 3.2;
        return (
          <rect
            key={`r-${i}`}
            x={x}
            y={-18.4}
            width={2}
            height={2.6}
            fill={DEEP}
            opacity="0.45"
          />
        );
      })}
      {/* highlight along the top of the upper rim */}
      <path d="M -12 -19 L 3 -19" stroke={STONE_LIGHT} strokeWidth="0.4" opacity="0.7" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Sagrada Família — Spain (4 spires of varying height + crossing)
  Spain: (
    <g>
      <ellipse cx="0" cy="0.5" rx="8" ry="1" fill={DEEP} opacity="0.25" />
      {/* base body */}
      <rect x="-7" y="-10" width="14" height="10" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.35" />
      {/* main body shadow */}
      <rect x="3" y="-10" width="4" height="10" fill={STONE_DARK} opacity="0.3" />
      {/* arched door */}
      <path d="M -1.4 0 L -1.4 -3 Q -1.4 -4.5 0 -4.5 Q 1.4 -4.5 1.4 -3 L 1.4 0 Z" fill={DEEP} opacity="0.6" />
      {/* 4 ornate spires (asymmetric heights) */}
      {[
        { x: -6, h: 18 },
        { x: -2, h: 24 },
        { x: 2, h: 26 },
        { x: 6, h: 20 },
      ].map((s, i) => (
        <g key={i}>
          <path
            d={`M ${s.x - 1.4} -10 L ${s.x - 0.7} ${-s.h} L ${s.x} ${-s.h - 2} L ${s.x + 0.7} ${-s.h} L ${s.x + 1.4} -10 Z`}
            fill={SAND}
            stroke={STONE_DARK}
            strokeWidth="0.3"
            strokeLinejoin="round"
          />
          <path
            d={`M ${s.x} ${-s.h - 2} L ${s.x} -10 L ${s.x + 1.4} -10 Z`}
            fill={STONE_DARK}
            opacity="0.35"
          />
          {/* texture bands on spire */}
          <line x1={s.x - 1.2} y1={-s.h + 5} x2={s.x + 1.2} y2={-s.h + 5} stroke={STONE_DARK} strokeWidth="0.25" />
          <line x1={s.x - 1.2} y1={-s.h + 10} x2={s.x + 1.2} y2={-s.h + 10} stroke={STONE_DARK} strokeWidth="0.25" />
          <circle cx={s.x} cy={-s.h - 2.6} r="0.5" fill={GOLD} />
        </g>
      ))}
      {/* small central crossing tower (highest) */}
      <path
        d="M -1 -10 L -0.5 -28 L 0 -30 L 0.5 -28 L 1 -10 Z"
        fill={SAND}
        stroke={STONE_DARK}
        strokeWidth="0.3"
        strokeLinejoin="round"
      />
      <circle cx="0" cy="-30.4" r="0.6" fill={GOLD} />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Parthenon — Greece
  Greece: (
    <g>
      <ellipse cx="0" cy="0.5" rx="12" ry="1" fill={DEEP} opacity="0.25" />
      {/* stylobate (base steps) */}
      <rect x="-11" y="-1.2" width="22" height="1.2" fill={STONE} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="-10.4" y="-2.2" width="20.8" height="1" fill={STONE_LIGHT} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* columns (8 doric) */}
      {[-9.4, -6.6, -3.8, -1, 1.8, 4.6, 7.4, 9.4].map((x, i) => (
        <g key={i}>
          <rect x={x - 0.6} y="-14" width="1.2" height="11.5" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.2" />
          {/* flute shadows */}
          <line x1={x} y1="-14" x2={x} y2="-2.5" stroke={STONE_DARK} strokeWidth="0.2" opacity="0.5" />
        </g>
      ))}
      {/* architrave + frieze */}
      <rect x="-11" y="-16" width="22" height="2" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="-11" y="-14.5" width="22" height="0.6" fill={STONE_DARK} opacity="0.45" />
      {/* pediment (triangular roof) */}
      <path d="M -11 -16 L 0 -23 L 11 -16 Z" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.35" strokeLinejoin="round" />
      <path d="M 0 -23 L 11 -16 L 0 -16 Z" fill={STONE_DARK} opacity="0.35" />
      {/* tympanum relief hint */}
      <path d="M -6 -18 L 6 -18" stroke={STONE_DARK} strokeWidth="0.25" />
      {/* acroterion finial */}
      <path d="M -0.6 -23 L 0 -24.4 L 0.6 -23 Z" fill={STONE_LIGHT} stroke={STONE_DARK} strokeWidth="0.25" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Hagia Sophia — Türkiye (also "Turkey")
  Turkey: (
    <g>
      <ellipse cx="0" cy="0.5" rx="14" ry="1.1" fill={DEEP} opacity="0.25" />
      {/* mosque body */}
      <rect x="-9" y="-12" width="18" height="12" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.35" />
      {/* central great dome */}
      <path d="M -7 -12 A 7 6.5 0 0 1 7 -12 Z" fill={SAND} stroke={STONE_DARK} strokeWidth="0.35" />
      <path d="M 0 -18.5 A 6.5 6.5 0 0 1 7 -12 Z" fill={STONE_DARK} opacity="0.3" />
      {/* small semi-domes */}
      <path d="M -9 -10 A 3 2.6 0 0 1 -3 -10 Z" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M 3 -10 A 3 2.6 0 0 1 9 -10 Z" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* dome highlight stripe */}
      <path d="M -5 -16 Q 0 -19 5 -16" stroke={STONE_LIGHT} strokeWidth="0.4" fill="none" opacity="0.6" />
      {/* tiny finial on the great dome */}
      <line x1="0" y1="-18.5" x2="0" y2="-20.4" stroke={STONE_DARK} strokeWidth="0.45" />
      <circle cx="0" cy="-20.8" r="0.4" fill={GOLD} />
      {/* 4 minarets */}
      {[-12, -10.5, 10.5, 12].map((x, i) => (
        <g key={i}>
          <rect x={x - 0.35} y="-24" width="0.7" height="24" fill={SAND} stroke={STONE_DARK} strokeWidth="0.25" />
          <rect x={x - 0.6} y="-19" width="1.2" height="0.6" fill={SAND_DARK} />
          <path d={`M ${x - 0.6} -24 L ${x} -27 L ${x + 0.6} -24 Z`} fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.2" />
          <circle cx={x} cy="-21" r="0.35" fill={DEEP} opacity="0.5" />
        </g>
      ))}
      {/* arched windows on body */}
      {[-6, -3, 0, 3, 6].map((x, i) => (
        <path
          key={i}
          d={`M ${x - 0.7} -2 L ${x - 0.7} -5 Q ${x - 0.7} -6.4 ${x} -6.4 Q ${x + 0.7} -6.4 ${x + 0.7} -5 L ${x + 0.7} -2 Z`}
          fill={DEEP}
          opacity="0.55"
        />
      ))}
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Great Wall — China (crenellated wall on a ridge + watchtower)
  China: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1" fill={DEEP} opacity="0.25" />
      {/* mountain ridge silhouette */}
      <path
        d="M -13 0 L -10 -8 L -7 -5 L -3 -11 L 2 -7 L 6 -13 L 10 -8 L 13 0 Z"
        fill={STONE_DARK}
        opacity="0.55"
      />
      {/* wall snaking along the ridge */}
      <path
        d="M -13 -2 L -10 -10 L -7 -7 L -3 -13 L 2 -9 L 6 -15 L 10 -10 L 13 -2"
        stroke={SAND_DARK}
        strokeWidth="2.4"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M -13 -2 L -10 -10 L -7 -7 L -3 -13 L 2 -9 L 6 -15 L 10 -10 L 13 -2"
        stroke={STONE_DARK}
        strokeWidth="0.4"
        fill="none"
        strokeLinejoin="round"
      />
      {/* crenellations along the wall */}
      {[
        { x: -11.5, y: -7 },
        { x: -9, y: -10 },
        { x: -5, y: -10 },
        { x: -1, y: -11.5 },
        { x: 4, y: -12.5 },
        { x: 8, y: -12 },
      ].map((c, i) => (
        <rect key={i} x={c.x - 0.5} y={c.y - 1.4} width="1" height="0.8" fill={STONE_DARK} />
      ))}
      {/* watchtower (front) */}
      <rect x="-1.4" y="-19" width="2.8" height="7" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M -2 -19 L 0 -22 L 2 -19 Z" fill={ROOF} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="-1.7" y="-19.7" width="3.4" height="0.7" fill={ROOF_DARK} />
      <line x1="0" y1="-22" x2="0" y2="-23.6" stroke={STONE_DARK} strokeWidth="0.4" />
      <circle cx="0" cy="-23.8" r="0.4" fill={GOLD} />
      {/* small banner */}
      <path d="M 0 -23 L 2 -22.3 L 0 -21.6 Z" fill={BLOOD} />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Taipei 101 — Taiwan
  Taiwan: (
    <g>
      <ellipse cx="0" cy="0.5" rx="5" ry="1" fill={DEEP} opacity="0.25" />
      {/* base */}
      <rect x="-3.5" y="-3.5" width="7" height="3.5" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* 8 stacked truncated-pyramid segments — distinctive Taipei 101 form */}
      {Array.from({ length: 8 }).map((_, i) => {
        const yTop = -6 - i * 2.8;
        const yBot = -3.5 - i * 2.8;
        const wTop = 2.6;
        const wBot = 2.95;
        return (
          <g key={i}>
            <path
              d={`M ${-wBot} ${yBot} L ${-wTop} ${yTop} L ${wTop} ${yTop} L ${wBot} ${yBot} Z`}
              fill={GREEN_DARK}
              stroke={STONE_DARK}
              strokeWidth="0.25"
              strokeLinejoin="round"
            />
            <path
              d={`M ${wTop} ${yTop} L ${wBot} ${yBot} L ${wBot - 0.5} ${yBot} L ${wTop - 0.4} ${yTop} Z`}
              fill={DEEP}
              opacity="0.4"
            />
          </g>
        );
      })}
      {/* top cap pinnacle */}
      <rect x="-1" y="-29.2" width="2" height="2" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.25" />
      <path d="M -1 -29.2 L 0 -31.4 L 1 -29.2 Z" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.25" />
      <line x1="0" y1="-31.4" x2="0" y2="-33.2" stroke={STONE_DARK} strokeWidth="0.45" />
      <circle cx="0" cy="-33.4" r="0.45" fill={GOLD} />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Atomium — Belgium
  Belgium: (
    <g>
      <ellipse cx="0" cy="0.5" rx="8" ry="1" fill={DEEP} opacity="0.25" />
      {/* tripod base */}
      <line x1="-5" y1="0" x2="0" y2="-8" stroke={STONE_DARK} strokeWidth="0.5" />
      <line x1="0" y1="0" x2="0" y2="-8" stroke={STONE_DARK} strokeWidth="0.5" />
      <line x1="5" y1="0" x2="0" y2="-8" stroke={STONE_DARK} strokeWidth="0.5" />
      {/* tube connections (struts between spheres) */}
      <line x1="0" y1="-12" x2="-7" y2="-18" stroke={STONE} strokeWidth="0.5" />
      <line x1="0" y1="-12" x2="7" y2="-18" stroke={STONE} strokeWidth="0.5" />
      <line x1="0" y1="-12" x2="0" y2="-26" stroke={STONE} strokeWidth="0.5" />
      <line x1="-7" y1="-18" x2="-4" y2="-24" stroke={STONE} strokeWidth="0.5" />
      <line x1="7" y1="-18" x2="4" y2="-24" stroke={STONE} strokeWidth="0.5" />
      <line x1="-4" y1="-24" x2="0" y2="-26" stroke={STONE} strokeWidth="0.5" />
      <line x1="4" y1="-24" x2="0" y2="-26" stroke={STONE} strokeWidth="0.5" />
      {/* 9 spheres (one center + 8 corners; we draw the 5 visible from front) */}
      {[
        { x: 0, y: -10, r: 2 },
        { x: -7, y: -18, r: 1.8 },
        { x: 7, y: -18, r: 1.8 },
        { x: -4, y: -24, r: 1.8 },
        { x: 4, y: -24, r: 1.8 },
        { x: 0, y: -26, r: 2 },
      ].map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r={s.r} fill={STONE_LIGHT} stroke={STONE_DARK} strokeWidth="0.3" />
          <circle cx={s.x - s.r * 0.32} cy={s.y - s.r * 0.4} r={s.r * 0.4} fill={CREAM} opacity="0.55" />
        </g>
      ))}
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Windmill — Netherlands (Kinderdijk-style polder mill)
  Netherlands: (
    <g>
      <ellipse cx="0" cy="0.5" rx="8" ry="1" fill={DEEP} opacity="0.25" />
      {/* mill body (octagonal silhouette as trapezoid) */}
      <path
        d="M -4 0 L -3 -13 L 3 -13 L 4 0 Z"
        fill={SAND}
        stroke={STONE_DARK}
        strokeWidth="0.35"
        strokeLinejoin="round"
      />
      <path d="M 1.5 -13 L 4 0 L 1.5 0 Z" fill={STONE_DARK} opacity="0.3" />
      {/* horizontal plank bands */}
      <line x1="-3.6" y1="-4" x2="3.6" y2="-4" stroke={STONE_DARK} strokeWidth="0.3" />
      <line x1="-3.4" y1="-8" x2="3.4" y2="-8" stroke={STONE_DARK} strokeWidth="0.3" />
      {/* cap */}
      <path d="M -3 -13 L 3 -13 L 2.4 -15 L -2.4 -15 Z" fill={ROOF_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* sails — 4 arms */}
      <g transform="translate(0,-14)">
        <line x1="0" y1="0" x2="-11" y2="-9" stroke={STONE_DARK} strokeWidth="0.5" />
        <line x1="0" y1="0" x2="9" y2="-11" stroke={STONE_DARK} strokeWidth="0.5" />
        <line x1="0" y1="0" x2="-9" y2="11" stroke={STONE_DARK} strokeWidth="0.5" />
        <line x1="0" y1="0" x2="11" y2="9" stroke={STONE_DARK} strokeWidth="0.5" />
        {/* sail panels (lighter color) */}
        <path d="M -2 -1.6 L -11 -9 L -10.4 -8 L -1.2 -0.8 Z" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.2" />
        <path d="M 1.6 -2 L 9 -11 L 8 -10.4 L 0.8 -1.2 Z" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.2" />
        <path d="M -1.6 2 L -9 11 L -8 10.4 L -0.8 1.2 Z" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.2" />
        <path d="M 2 1.6 L 11 9 L 10.4 8 L 1.2 0.8 Z" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.2" />
        <circle r="0.7" fill={STONE_DARK} />
      </g>
      {/* tiny door */}
      <rect x="-0.7" y="-2.4" width="1.4" height="2.4" fill={DEEP} opacity="0.55" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Matterhorn — Switzerland
  Switzerland: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1.1" fill={DEEP} opacity="0.25" />
      {/* back ridge silhouette */}
      <path
        d="M -13 0 L -8 -10 L -5 -6 L -1 -14 L 2 -10 L 6 -16 L 9 -10 L 13 0 Z"
        fill={STONE_DARK}
        opacity="0.55"
      />
      {/* main asymmetric peak (the Matterhorn) */}
      <path
        d="M -10 0 L -4 -20 L -1 -26 L 2 -22 L 7 -10 L 11 0 Z"
        fill={STONE}
        stroke={STONE_DARK}
        strokeWidth="0.35"
        strokeLinejoin="round"
      />
      {/* lit face (sunlight from the right) */}
      <path
        d="M -1 -26 L 2 -22 L 7 -10 L 11 0 L 6 0 L 0 -23 Z"
        fill={STONE_LIGHT}
        opacity="0.45"
      />
      {/* snow cap on the peak */}
      <path
        d="M -3.5 -19 L -2.4 -21 L -1 -26 L 0.6 -21 L 1.6 -22 Q 0 -19 -3.5 -19 Z"
        fill={SNOW}
        stroke={STONE_DARK}
        strokeWidth="0.25"
        strokeLinejoin="round"
      />
      {/* snow streak down the face */}
      <path d="M -1 -26 L -0.8 -16 L -1.5 -10" stroke={SNOW} strokeWidth="0.5" fill="none" opacity="0.7" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Geirangerfjord — Norway
  Norway: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1" fill={DEEP} opacity="0.25" />
      {/* sea */}
      <path
        d="M -13 0 L 13 0 L 13 -3 Q 8 -2 5 -3 Q 0 -4 -5 -3 Q -8 -2 -13 -3 Z"
        fill={SEA}
        stroke={STONE_DARK}
        strokeWidth="0.3"
      />
      {/* sea reflections */}
      <line x1="-10" y1="-1.4" x2="-6" y2="-1.4" stroke={CREAM} strokeWidth="0.25" opacity="0.5" />
      <line x1="3" y1="-1.8" x2="8" y2="-1.8" stroke={CREAM} strokeWidth="0.25" opacity="0.5" />
      {/* left mountain (taller) */}
      <path d="M -13 -3 L -10 -14 L -7 -8 L -5 -17 L -2 -10 L 0 -8 L 0 -3 Z"
        fill={GREEN_DARK}
        stroke={STONE_DARK}
        strokeWidth="0.3"
        strokeLinejoin="round"
      />
      {/* right mountain (snow-capped) */}
      <path d="M 0 -3 L 2 -10 L 5 -16 L 8 -12 L 11 -18 L 13 -10 L 13 -3 Z"
        fill={GREEN_DARK}
        stroke={STONE_DARK}
        strokeWidth="0.3"
        strokeLinejoin="round"
      />
      {/* lit face on right peak */}
      <path d="M 5 -16 L 8 -12 L 11 -18 L 11 -8 L 7 -12 Z" fill={STONE_LIGHT} opacity="0.4" />
      {/* snow caps */}
      <path d="M -6.2 -16 L -5 -17 L -3.6 -15 Q -5 -14.4 -6.2 -16 Z" fill={SNOW} />
      <path d="M 9.8 -17 L 11 -18 L 12.2 -16 Q 11 -15.4 9.8 -17 Z" fill={SNOW} />
      {/* aurora hint */}
      <path
        d="M -12 -20 Q -6 -22 0 -20 Q 6 -19 11 -22"
        stroke={SNOW}
        strokeWidth="0.4"
        fill="none"
        opacity="0.55"
      />
      <path
        d="M -12 -22 Q -6 -24 0 -22 Q 6 -21 11 -24"
        stroke="#7adf9c"
        strokeWidth="0.3"
        fill="none"
        opacity="0.45"
      />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Nyhavn — Denmark (colorful gabled houses + boat)
  Denmark: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1" fill={DEEP} opacity="0.25" />
      {/* water */}
      <rect x="-13" y="-2" width="26" height="2" fill={SEA} />
      <line x1="-12" y1="-1" x2="-7" y2="-1" stroke={CREAM} strokeWidth="0.25" opacity="0.5" />
      {/* houses — 5 of varying heights and colors with gable roofs */}
      {[
        { x: -12, h: 13, c: "#bd3a36", roof: ROOF_DARK },
        { x: -7.5, h: 16, c: "#e6b94a", roof: ROOF_DARK },
        { x: -3, h: 12, c: "#4b8a8f", roof: ROOF_DARK },
        { x: 1.5, h: 17, c: "#c1632b", roof: ROOF_DARK },
        { x: 6, h: 13, c: "#7a8b54", roof: ROOF_DARK },
        { x: 10, h: 14, c: "#bd3a36", roof: ROOF_DARK },
      ].map((h, i) => (
        <g key={i}>
          <rect
            x={h.x}
            y={-h.h}
            width="3.4"
            height={h.h - 2}
            fill={h.c}
            stroke={STONE_DARK}
            strokeWidth="0.3"
          />
          {/* gable roof */}
          <path
            d={`M ${h.x - 0.3} ${-h.h} L ${h.x + 1.7} ${-h.h - 2} L ${h.x + 3.7} ${-h.h} Z`}
            fill={h.roof}
            stroke={STONE_DARK}
            strokeWidth="0.3"
            strokeLinejoin="round"
          />
          {/* windows */}
          <rect x={h.x + 0.5} y={-h.h + 2} width="0.9" height="1.4" fill={CREAM} />
          <rect x={h.x + 2} y={-h.h + 2} width="0.9" height="1.4" fill={CREAM} />
          <rect x={h.x + 0.5} y={-h.h + 5} width="0.9" height="1.4" fill={CREAM} />
          <rect x={h.x + 2} y={-h.h + 5} width="0.9" height="1.4" fill={CREAM} />
        </g>
      ))}
      {/* small boat in foreground */}
      <path d="M -2 -2 L 4 -2 L 3.2 0 L -1.2 0 Z" fill={STONE_DARK} stroke={DEEP} strokeWidth="0.25" />
      <line x1="1" y1="-2" x2="1" y2="-5" stroke={STONE_DARK} strokeWidth="0.35" />
      <path d="M 1 -2 L 1 -5 L 2.6 -3.4 Z" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.25" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Machu Picchu — Peru (terraced ruin + Andean peaks)
  Peru: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1" fill={DEEP} opacity="0.25" />
      {/* back peaks */}
      <path
        d="M -13 0 L -10 -10 L -6 -4 L -1 -15 L 4 -8 L 10 -16 L 13 0 Z"
        fill={STONE_DARK}
        opacity="0.55"
      />
      {/* iconic Huayna Picchu spike */}
      <path d="M 4 -8 L 7 -22 L 10 -16 Z" fill={STONE} stroke={STONE_DARK} strokeWidth="0.35" />
      {/* lit face */}
      <path d="M 7 -22 L 10 -16 L 8 -16 L 7.4 -19 Z" fill={STONE_LIGHT} opacity="0.5" />
      {/* terraced city */}
      <g transform="translate(-4, 0)">
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x={-3 + i * 0.4}
            y={-1.2 - i * 1.4}
            width={6 - i * 0.8}
            height="1.2"
            fill={GREEN_DARK}
            stroke={STONE_DARK}
            strokeWidth="0.25"
          />
        ))}
        {/* small stone structures on top terrace */}
        <rect x="-2" y="-9.4" width="1.4" height="1.6" fill={STONE} stroke={STONE_DARK} strokeWidth="0.2" />
        <path d="M -2 -9.4 L -1.3 -10.4 L -0.6 -9.4 Z" fill={STONE_DARK} />
        <rect x="0.4" y="-9" width="1.4" height="1.2" fill={STONE} stroke={STONE_DARK} strokeWidth="0.2" />
        <path d="M 0.4 -9 L 1.1 -9.9 L 1.8 -9 Z" fill={STONE_DARK} />
      </g>
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Andes — Colombia (mountain ridge variation)
  Colombia: (
    <g>
      <ellipse cx="0" cy="0.5" rx="12" ry="1" fill={DEEP} opacity="0.25" />
      <path
        d="M -12 0 L -9 -8 L -6 -3 L -2 -12 L 2 -7 L 6 -14 L 9 -9 L 12 0 Z"
        fill={GREEN_DARK}
        stroke={STONE_DARK}
        strokeWidth="0.35"
        strokeLinejoin="round"
      />
      <path d="M 2 -7 L 6 -14 L 9 -9 L 12 0 L 8 0 L 4 -10 Z" fill={STONE_LIGHT} opacity="0.35" />
      <path d="M -2 -12 L -2.6 -11 L -1.4 -11 Z" fill={SNOW} />
      <path d="M 6 -14 L 5.2 -13 L 6.8 -13 Z" fill={SNOW} />
      {/* coffee plant or palm hint */}
      <line x1="-7" y1="0" x2="-7" y2="-3" stroke={STONE_DARK} strokeWidth="0.35" />
      <path d="M -8 -3 Q -7 -4.5 -6 -3" stroke={GREEN_DARK} strokeWidth="0.5" fill="none" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // CN Tower — Canada
  Canada: (
    <g>
      <ellipse cx="0" cy="0.5" rx="5" ry="1" fill={DEEP} opacity="0.25" />
      {/* main vertical shaft */}
      <path
        d="M -0.7 0 L -0.7 -20 L -1 -22 L -1 -26 L 1 -26 L 1 -22 L 0.7 -20 L 0.7 0 Z"
        fill={STONE}
        stroke={STONE_DARK}
        strokeWidth="0.3"
      />
      {/* observation pod */}
      <ellipse cx="0" cy="-20" rx="3" ry="1.4" fill={STONE_LIGHT} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="-3" y="-20" width="6" height="0.8" fill={STONE} stroke={STONE_DARK} strokeWidth="0.25" />
      <ellipse cx="0" cy="-21.4" rx="2.4" ry="1" fill={CREAM} opacity="0.7" />
      {/* upper sky pod */}
      <rect x="-0.9" y="-25" width="1.8" height="1.6" fill={STONE_DARK} />
      {/* antenna spike */}
      <line x1="0" y1="-26" x2="0" y2="-32" stroke={STONE_DARK} strokeWidth="0.45" />
      <circle cx="0" cy="-32.2" r="0.4" fill={GOLD} />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Hassan II Mosque — Morocco
  Morocco: (
    <g>
      <ellipse cx="0" cy="0.5" rx="10" ry="1" fill={DEEP} opacity="0.25" />
      {/* mosque body */}
      <rect x="-7" y="-10" width="14" height="10" fill={SAND} stroke={STONE_DARK} strokeWidth="0.35" />
      <rect x="3" y="-10" width="4" height="10" fill={STONE_DARK} opacity="0.3" />
      {/* horseshoe arches */}
      {[-5, -1.6, 1.8, 5.2].map((x, i) => (
        <path
          key={i}
          d={`M ${x - 1.1} 0 L ${x - 1.1} -3.5 Q ${x - 1.1} -5.2 ${x} -5.2 Q ${x + 1.1} -5.2 ${x + 1.1} -3.5 L ${x + 1.1} 0 Z`}
          fill={DEEP}
          opacity="0.55"
        />
      ))}
      {/* roof crenellations */}
      {[-7, -5, -3, -1, 1, 3, 5].map((x, i) => (
        <rect key={i} x={x} y="-11.5" width="1.4" height="1.5" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.2" />
      ))}
      {/* tall minaret */}
      <rect x="-1.3" y="-28" width="2.6" height="18" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="0.4" y="-28" width="0.9" height="18" fill={STONE_DARK} opacity="0.3" />
      {/* decorative tile bands */}
      <rect x="-1.3" y="-26" width="2.6" height="0.7" fill={ROOF_DARK} />
      <rect x="-1.3" y="-20" width="2.6" height="0.7" fill={ROOF_DARK} />
      <rect x="-1.3" y="-14" width="2.6" height="0.7" fill={ROOF_DARK} />
      {/* minaret window */}
      <rect x="-0.6" y="-22.5" width="1.2" height="1.6" fill={DEEP} opacity="0.55" />
      {/* minaret top cap */}
      <rect x="-1.6" y="-29.4" width="3.2" height="1.4" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M -1.4 -29.4 L 0 -31.6 L 1.4 -29.4 Z" fill={ROOF} stroke={STONE_DARK} strokeWidth="0.3" />
      <line x1="0" y1="-31.6" x2="0" y2="-33.4" stroke={STONE_DARK} strokeWidth="0.4" />
      <circle cx="0" cy="-33.6" r="0.4" fill={GOLD} />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Prague Castle / Charles Bridge — Czechia
  Czechia: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1" fill={DEEP} opacity="0.25" />
      {/* river */}
      <rect x="-13" y="-1.5" width="26" height="1.5" fill={SEA} />
      {/* bridge with arches */}
      <rect x="-12" y="-5" width="24" height="3.5" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      {[-9, -4.5, 0, 4.5, 9].map((x, i) => (
        <path
          key={i}
          d={`M ${x - 1.6} -1.5 Q ${x} -3.6 ${x + 1.6} -1.5 Z`}
          fill={DEEP}
          opacity="0.6"
        />
      ))}
      {/* tower at bridge end */}
      <rect x="-12.5" y="-12" width="2.6" height="7" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M -12.8 -12 L -11.2 -14 L -9.6 -12 Z" fill={ROOF_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* castle on hill behind */}
      <path d="M -8 -5 L -8 -10 L -2 -16 L 2 -16 L 8 -10 L 8 -5 Z" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* cathedral with twin spires */}
      <rect x="-1.6" y="-21" width="3.2" height="5" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M -2 -21 L -1.2 -27 L -0.4 -21 Z" fill={ROOF_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M 0.4 -21 L 1.2 -27 L 2 -21 Z" fill={ROOF_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      <line x1="-1.2" y1="-27" x2="-1.2" y2="-28.4" stroke={STONE_DARK} strokeWidth="0.3" />
      <line x1="1.2" y1="-27" x2="1.2" y2="-28.4" stroke={STONE_DARK} strokeWidth="0.3" />
      {/* rose window */}
      <circle cx="0" cy="-19" r="0.6" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.2" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Stephansdom — Austria
  Austria: (
    <g>
      <ellipse cx="0" cy="0.5" rx="7" ry="1" fill={DEEP} opacity="0.25" />
      {/* cathedral body */}
      <rect x="-5" y="-12" width="10" height="12" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* tile roof (multi-color hint) */}
      <path d="M -5 -12 L -3 -16 L 3 -16 L 5 -12 Z" fill={ROOF} stroke={STONE_DARK} strokeWidth="0.3" />
      <line x1="-3" y1="-15" x2="3" y2="-15" stroke={ROOF_DARK} strokeWidth="0.3" />
      <line x1="-2" y1="-13.6" x2="2" y2="-13.6" stroke={ROOF_DARK} strokeWidth="0.3" />
      {/* main tall spire */}
      <path d="M 1.4 -16 L 2.4 -28 L 3 -30 L 3.6 -28 L 4.6 -16 Z" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" strokeLinejoin="round" />
      <line x1="3" y1="-30" x2="3" y2="-31.6" stroke={STONE_DARK} strokeWidth="0.35" />
      <circle cx="3" cy="-31.8" r="0.4" fill={GOLD} />
      {/* shorter north tower */}
      <path d="M -4.2 -16 L -3.6 -20 L -3 -22 L -2.4 -20 L -1.8 -16 Z" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" strokeLinejoin="round" />
      <line x1="-3" y1="-22" x2="-3" y2="-23.6" stroke={STONE_DARK} strokeWidth="0.3" />
      {/* rose window */}
      <circle cx="0" cy="-7" r="1.3" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.25" />
      <path d="M -1.3 -7 L 1.3 -7 M 0 -8.3 L 0 -5.7" stroke={STONE_DARK} strokeWidth="0.2" />
      {/* arched door */}
      <path d="M -1 0 L -1 -3 Q -1 -4.2 0 -4.2 Q 1 -4.2 1 -3 L 1 0 Z" fill={DEEP} opacity="0.65" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Hungarian Parliament — Hungary
  Hungary: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1" fill={DEEP} opacity="0.25" />
      {/* base / reflection in Danube */}
      <rect x="-13" y="-1" width="26" height="1" fill={SEA} opacity="0.6" />
      {/* main body */}
      <rect x="-12" y="-10" width="24" height="9" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* arched windows */}
      {[-10.5, -8.5, -6.5, -4.5, 4.5, 6.5, 8.5, 10.5].map((x, i) => (
        <path
          key={i}
          d={`M ${x - 0.6} -2 L ${x - 0.6} -7 Q ${x - 0.6} -8.2 ${x} -8.2 Q ${x + 0.6} -8.2 ${x + 0.6} -7 L ${x + 0.6} -2 Z`}
          fill={DEEP}
          opacity="0.55"
        />
      ))}
      {/* central façade with extra height */}
      <rect x="-3.5" y="-14" width="7" height="13" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* twin side spires */}
      <path d="M -12.6 -10 L -11.6 -16 L -10.6 -10 Z" fill={ROOF_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M 10.6 -10 L 11.6 -16 L 12.6 -10 Z" fill={ROOF_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* central neo-gothic dome */}
      <rect x="-2" y="-14" width="4" height="2" fill={STONE_DARK} />
      <path d="M -3 -14 Q 0 -21 3 -14 Z" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="-1.4" y="-20" width="2.8" height="2" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.25" />
      <path d="M -1.4 -20 L 0 -24 L 1.4 -20 Z" fill={ROOF} stroke={STONE_DARK} strokeWidth="0.3" />
      <line x1="0" y1="-24" x2="0" y2="-26" stroke={STONE_DARK} strokeWidth="0.35" />
      <circle cx="0" cy="-26.2" r="0.45" fill={GOLD} />
      {/* big arched main entrance */}
      <path d="M -1.4 -1 L -1.4 -5 Q -1.4 -7 0 -7 Q 1.4 -7 1.4 -5 L 1.4 -1 Z" fill={DEEP} opacity="0.65" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Niagara / mountains — Canada alternate not used, but keep generic
  // (Canada uses CN Tower above)

  // ---------------------------------------------------------------------------
  // Burj Khalifa — United Arab Emirates
  "United Arab Emirates": (
    <g>
      <ellipse cx="0" cy="0.5" rx="5" ry="1" fill={DEEP} opacity="0.25" />
      <path d="M -3.5 0 L -2.5 -8 L -1.5 -16 L -0.8 -24 L -0.3 -30 L 0.3 -30 L 0.8 -24 L 1.5 -16 L 2.5 -8 L 3.5 0 Z"
        fill={STONE_LIGHT}
        stroke={STONE_DARK}
        strokeWidth="0.3"
        strokeLinejoin="round"
      />
      <path d="M 0 -30 L 0.3 -30 L 0.8 -24 L 1.5 -16 L 2.5 -8 L 3.5 0 L 1.5 0 L 1 -22 Z" fill={STONE_DARK} opacity="0.35" />
      <line x1="0" y1="-30" x2="0" y2="-34" stroke={STONE_DARK} strokeWidth="0.5" />
      <circle cx="0" cy="-34.2" r="0.4" fill={GOLD} />
      {/* vertical highlight lines */}
      <line x1="-0.8" y1="-22" x2="-0.8" y2="-2" stroke={STONE_DARK} strokeWidth="0.2" opacity="0.6" />
      <line x1="0.8" y1="-22" x2="0.8" y2="-2" stroke={STONE_DARK} strokeWidth="0.2" opacity="0.6" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Mount Fuji — Japan
  Japan: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1" fill={DEEP} opacity="0.25" />
      <path
        d="M -13 0 L -3 -18 L 0 -22 L 3 -18 L 13 0 Z"
        fill={STONE}
        stroke={STONE_DARK}
        strokeWidth="0.35"
        strokeLinejoin="round"
      />
      <path d="M 0 -22 L 3 -18 L 13 0 L 5 0 L 1 -16 Z" fill={STONE_DARK} opacity="0.35" />
      {/* iconic snow cap */}
      <path
        d="M -3 -18 L -2 -19 L -1 -17 L 0 -22 L 1 -17 L 2 -19 L 3 -18 Q 0 -16 -3 -18 Z"
        fill={SNOW}
        stroke={STONE_DARK}
        strokeWidth="0.25"
      />
      {/* snow streaks down face */}
      <path d="M -1.2 -17 L -1.4 -10" stroke={SNOW} strokeWidth="0.45" opacity="0.7" />
      <path d="M 1.2 -17 L 1.5 -8" stroke={SNOW} strokeWidth="0.45" opacity="0.7" />
      {/* cherry blossom hint */}
      <circle cx="-9" cy="-3" r="0.6" fill="#f5b3c8" />
      <circle cx="-7.8" cy="-2" r="0.5" fill="#f5b3c8" />
      <circle cx="-6.6" cy="-3.4" r="0.5" fill="#f5b3c8" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Sydney Opera House — Australia
  Australia: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1" fill={DEEP} opacity="0.25" />
      {/* harbor water */}
      <rect x="-13" y="-1" width="26" height="1" fill={SEA} opacity="0.7" />
      {/* base platform */}
      <rect x="-12" y="-3" width="24" height="2" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* the famous sail shells (overlapping) */}
      <path d="M -10 -3 Q -8 -16 -4 -3 Z" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M -7 -3 Q -5 -13 -1 -3 Z" fill={SNOW} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M -3 -3 Q -1 -17 3 -3 Z" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M 1 -3 Q 3 -14 7 -3 Z" fill={SNOW} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M 4 -3 Q 6 -10 10 -3 Z" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* shell shading lines */}
      <path d="M -8 -16 Q -7 -10 -4 -3" stroke={STONE_DARK} strokeWidth="0.25" fill="none" opacity="0.7" />
      <path d="M -1 -17 Q 0 -10 3 -3" stroke={STONE_DARK} strokeWidth="0.25" fill="none" opacity="0.7" />
      <path d="M 3 -14 Q 4 -8 7 -3" stroke={STONE_DARK} strokeWidth="0.25" fill="none" opacity="0.7" />
      {/* harbor bridge hint */}
      <path
        d="M -13 -3 Q -7 -7 0 -7 Q 7 -7 13 -3"
        stroke={STONE_DARK}
        strokeWidth="0.6"
        fill="none"
        opacity="0.5"
      />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Taj Mahal — India
  India: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1" fill={DEEP} opacity="0.25" />
      {/* reflecting pool */}
      <rect x="-9" y="-1" width="18" height="1" fill={SEA} opacity="0.5" />
      {/* base platform */}
      <rect x="-10" y="-4" width="20" height="3" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* 4 minarets */}
      {[-9, -7, 7, 9].map((x, i) => (
        <g key={i}>
          <rect x={x - 0.4} y="-18" width="0.8" height="14" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.25" />
          <rect x={x - 0.6} y="-14" width="1.2" height="0.6" fill={SAND_DARK} />
          <rect x={x - 0.6} y="-10" width="1.2" height="0.6" fill={SAND_DARK} />
          <path d={`M ${x - 0.6} -18 L ${x} -20 L ${x + 0.6} -18 Z`} fill={CREAM} stroke={STONE_DARK} strokeWidth="0.25" />
          <line x1={x} y1="-20" x2={x} y2="-21.6" stroke={STONE_DARK} strokeWidth="0.3" />
          <circle cx={x} cy="-21.8" r="0.3" fill={GOLD} />
        </g>
      ))}
      {/* main mausoleum body */}
      <rect x="-5" y="-12" width="10" height="8" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* iwan (central arched recess) */}
      <path d="M -1.8 -4 L -1.8 -10 Q -1.8 -11.5 0 -11.5 Q 1.8 -11.5 1.8 -10 L 1.8 -4 Z" fill={DEEP} opacity="0.5" />
      {/* corner chattris */}
      <rect x="-4.6" y="-13" width="1.2" height="1" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.2" />
      <path d="M -4.7 -13 Q -4 -14.6 -3.3 -13 Z" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.2" />
      <rect x="3.4" y="-13" width="1.2" height="1" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.2" />
      <path d="M 3.3 -13 Q 4 -14.6 4.7 -13 Z" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.2" />
      {/* great onion dome */}
      <path
        d="M -3.4 -12 C -3.4 -16 -2 -19 0 -19 C 2 -19 3.4 -16 3.4 -12 Q 0 -10 -3.4 -12 Z"
        fill={SNOW}
        stroke={STONE_DARK}
        strokeWidth="0.3"
      />
      {/* dome shadow */}
      <path d="M 0 -19 C 2 -19 3.4 -16 3.4 -12 Q 1.5 -10 0 -10 Z" fill={STONE_DARK} opacity="0.18" />
      <rect x="-0.6" y="-20.4" width="1.2" height="1.4" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.2" />
      <path d="M -0.6 -20.4 L 0 -21.8 L 0.6 -20.4 Z" fill={SAND_DARK} />
      <line x1="0" y1="-21.8" x2="0" y2="-23.4" stroke={STONE_DARK} strokeWidth="0.3" />
      <circle cx="0" cy="-23.6" r="0.4" fill={GOLD} />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Christ the Redeemer — Brazil
  Brazil: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1" fill={DEEP} opacity="0.25" />
      {/* sugarloaf mountain */}
      <path d="M -13 0 L -9 -10 L -6 -3 L -2 -12 L 1 -8 L 5 -16 L 8 -10 L 13 0 Z" fill={GREEN_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* statue base/pedestal on peak */}
      <rect x="-1.4" y="-19" width="2.8" height="3" fill={STONE_LIGHT} stroke={STONE_DARK} strokeWidth="0.25" />
      {/* statue body */}
      <rect x="-0.7" y="-23" width="1.4" height="4" fill={STONE_LIGHT} stroke={STONE_DARK} strokeWidth="0.25" />
      {/* outstretched arms */}
      <rect x="-4" y="-23.4" width="8" height="0.9" fill={STONE_LIGHT} stroke={STONE_DARK} strokeWidth="0.25" />
      {/* head */}
      <circle cx="0" cy="-24" r="0.8" fill={STONE_LIGHT} stroke={STONE_DARK} strokeWidth="0.25" />
      {/* arm drape lines */}
      <line x1="-4" y1="-22.5" x2="-4" y2="-21.4" stroke={STONE_DARK} strokeWidth="0.25" />
      <line x1="4" y1="-22.5" x2="4" y2="-21.4" stroke={STONE_DARK} strokeWidth="0.25" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Petra — Jordan
  Jordan: (
    <g>
      <ellipse cx="0" cy="0.5" rx="11" ry="1" fill={DEEP} opacity="0.25" />
      {/* cliff face background */}
      <rect x="-11" y="-22" width="22" height="22" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M -11 -22 L 11 -22 L 11 -20 L -11 -20 Z" fill={STONE_DARK} opacity="0.5" />
      {/* carved façade of Al-Khazneh */}
      <rect x="-5" y="-18" width="10" height="18" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* lower columns */}
      {[-3.4, -1.5, 1.5, 3.4].map((x, i) => (
        <rect key={i} x={x - 0.4} y="-9" width="0.8" height="9" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.2" />
      ))}
      {/* lower entablature */}
      <rect x="-5" y="-10" width="10" height="1" fill={STONE} />
      {/* pediment */}
      <path d="M -5 -10 L 0 -14 L 5 -10 Z" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* upper structure (tholos) */}
      <rect x="-3.5" y="-18" width="7" height="4" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      <circle cx="0" cy="-16" r="2" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="-1" y="-15.6" width="2" height="1.6" fill={DEEP} opacity="0.5" />
      <path d="M -2 -18 L 0 -20 L 2 -18 Z" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.25" />
      {/* arched doorway */}
      <path d="M -1.4 0 L -1.4 -4 Q -1.4 -6 0 -6 Q 1.4 -6 1.4 -4 L 1.4 0 Z" fill={DEEP} opacity="0.65" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Angkor Wat — Cambodia
  Cambodia: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1" fill={DEEP} opacity="0.25" />
      {/* reflecting moat */}
      <rect x="-13" y="-1.4" width="26" height="1.4" fill={SEA} opacity="0.6" />
      {/* base platform */}
      <rect x="-12" y="-3.4" width="24" height="2" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* outer corner towers (small) */}
      {[-9.2, -5.5, 5.5, 9.2].map((x, i) => (
        <g key={i}>
          <rect x={x - 0.7} y="-8" width="1.4" height="4.6" fill={SAND} stroke={STONE_DARK} strokeWidth="0.25" />
          <path d={`M ${x - 0.9} -8 L ${x} -12 L ${x + 0.9} -8 Z`} fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.25" />
          <line x1={x} y1="-12" x2={x} y2="-13.2" stroke={STONE_DARK} strokeWidth="0.3" />
        </g>
      ))}
      {/* middle towers */}
      {[-3, 3].map((x, i) => (
        <g key={i}>
          <rect x={x - 0.9} y="-13" width="1.8" height="9.6" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
          <path d={`M ${x - 1.2} -13 L ${x} -18 L ${x + 1.2} -13 Z`} fill={ROOF_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
          <line x1={x} y1="-18" x2={x} y2="-20" stroke={STONE_DARK} strokeWidth="0.35" />
        </g>
      ))}
      {/* central tallest tower */}
      <rect x="-1.5" y="-18" width="3" height="14.6" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M -1.8 -18 L 0 -26 L 1.8 -18 Z" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" strokeLinejoin="round" />
      {/* lotus bud finial */}
      <path d="M -0.6 -26 Q 0 -28.5 0.6 -26 Q 0.3 -27.5 0 -27.5 Q -0.3 -27.5 -0.6 -26 Z" fill={ROOF} stroke={STONE_DARK} strokeWidth="0.25" />
      <line x1="0" y1="-27.5" x2="0" y2="-29.4" stroke={STONE_DARK} strokeWidth="0.3" />
      <circle cx="0" cy="-29.6" r="0.4" fill={GOLD} />
      {/* stepped pyramid hints between towers */}
      <rect x="-12" y="-5.4" width="24" height="2" fill={SAND} stroke={STONE_DARK} strokeWidth="0.25" />
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Saint Basil's Cathedral — Russia
  Russia: (
    <g>
      <ellipse cx="0" cy="0.5" rx="9" ry="1" fill={DEEP} opacity="0.25" />
      {/* central church body */}
      <rect x="-1.4" y="-12" width="2.8" height="12" fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* central tallest tower with onion dome */}
      <path d="M -2 -12 L -1.6 -18 L 1.6 -18 L 2 -12 Z" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.3" />
      <path
        d="M -2 -18 C -2 -22 -1 -24 0 -25 C 1 -24 2 -22 2 -18 Q 0 -16 -2 -18 Z"
        fill="#bc4a3a"
        stroke={STONE_DARK}
        strokeWidth="0.3"
      />
      <line x1="0" y1="-25" x2="0" y2="-27.4" stroke={STONE_DARK} strokeWidth="0.4" />
      <path d="M -0.8 -27 L 0 -28.6 L 0.8 -27 L 0 -26.4 Z" fill={GOLD} stroke={STONE_DARK} strokeWidth="0.2" />
      {/* 4 side onion domes — different colors */}
      {[
        { x: -5.5, h: 8, color: "#2a8e76" },
        { x: -3, h: 6, color: "#d4b54a" },
        { x: 3, h: 6, color: "#6c6cc7" },
        { x: 5.5, h: 8, color: "#bc4a3a" },
      ].map((d, i) => (
        <g key={i}>
          <rect x={d.x - 1} y={-d.h - 3} width="2" height={d.h + 3} fill={SAND_DARK} stroke={STONE_DARK} strokeWidth="0.25" />
          <path
            d={`M ${d.x - 1.3} ${-d.h - 3} C ${d.x - 1.3} ${-d.h - 6} ${d.x - 0.5} ${-d.h - 7.5} ${d.x} ${-d.h - 8} C ${d.x + 0.5} ${-d.h - 7.5} ${d.x + 1.3} ${-d.h - 6} ${d.x + 1.3} ${-d.h - 3} Q ${d.x} ${-d.h - 1.5} ${d.x - 1.3} ${-d.h - 3} Z`}
            fill={d.color}
            stroke={STONE_DARK}
            strokeWidth="0.3"
          />
          {/* swirl decoration */}
          <path
            d={`M ${d.x - 0.9} ${-d.h - 4} Q ${d.x} ${-d.h - 6} ${d.x + 0.9} ${-d.h - 4}`}
            stroke={CREAM}
            strokeWidth="0.3"
            fill="none"
            opacity="0.7"
          />
          <line x1={d.x} y1={-d.h - 8} x2={d.x} y2={-d.h - 9.6} stroke={STONE_DARK} strokeWidth="0.3" />
          <path d={`M ${d.x - 0.5} ${-d.h - 9.4} L ${d.x} ${-d.h - 10.4} L ${d.x + 0.5} ${-d.h - 9.4} Z`} fill={GOLD} />
        </g>
      ))}
    </g>
  ),

  // ---------------------------------------------------------------------------
  // Mount Fuji is already Japan. Below: bonus landmarks for non-visited
  // countries to round out the figurine catalog.
  // ---------------------------------------------------------------------------

  // Easter Island Moai — Chile
  Chile: (
    <g>
      <ellipse cx="0" cy="0.5" rx="8" ry="1" fill={DEEP} opacity="0.25" />
      {/* three moai of varying sizes */}
      {[
        { x: -6, h: 18, w: 4 },
        { x: 0, h: 24, w: 5 },
        { x: 6, h: 20, w: 4.4 },
      ].map((m, i) => (
        <g key={i}>
          <path
            d={`M ${m.x - m.w / 2} 0 L ${m.x - m.w / 2 + 0.4} ${-m.h + 4} L ${m.x - m.w / 2} ${-m.h} L ${m.x + m.w / 2} ${-m.h} L ${m.x + m.w / 2 - 0.4} ${-m.h + 4} L ${m.x + m.w / 2} 0 Z`}
            fill={STONE}
            stroke={STONE_DARK}
            strokeWidth="0.3"
            strokeLinejoin="round"
          />
          <path
            d={`M ${m.x + m.w / 2 - 0.5} 0 L ${m.x + m.w / 2 - 0.1} ${-m.h + 4} L ${m.x + m.w / 2} ${-m.h} L ${m.x + m.w / 2} 0 Z`}
            fill={STONE_DARK}
            opacity="0.45"
          />
          {/* heavy brow and nose hint */}
          <rect x={m.x - m.w / 2 + 0.6} y={-m.h + 1.4} width={m.w - 1.2} height={0.5} fill={STONE_DARK} />
          <line x1={m.x} y1={-m.h + 2.4} x2={m.x} y2={-m.h + m.h / 3} stroke={STONE_DARK} strokeWidth="0.3" />
          <line x1={m.x - 0.5} y1={-m.h + m.h / 3} x2={m.x + 0.5} y2={-m.h + m.h / 3} stroke={STONE_DARK} strokeWidth="0.3" />
        </g>
      ))}
    </g>
  ),

  // Petronas Twin Towers — Malaysia
  Malaysia: (
    <g>
      <ellipse cx="0" cy="0.5" rx="9" ry="1" fill={DEEP} opacity="0.25" />
      {/* connecting skybridge */}
      <rect x="-4" y="-14" width="8" height="1" fill={STONE} stroke={STONE_DARK} strokeWidth="0.25" />
      <line x1="-3" y1="-14" x2="-3" y2="-13" stroke={STONE_DARK} strokeWidth="0.25" />
      <line x1="3" y1="-14" x2="3" y2="-13" stroke={STONE_DARK} strokeWidth="0.25" />
      {/* two towers — segmented */}
      {[-4, 4].map((cx, i) => (
        <g key={i}>
          {[0, 1, 2, 3, 4].map((seg) => (
            <rect
              key={seg}
              x={cx - 1.6 + seg * 0.05}
              y={-6 - seg * 4}
              width={3.2 - seg * 0.1}
              height={4}
              fill={STONE_LIGHT}
              stroke={STONE_DARK}
              strokeWidth="0.25"
            />
          ))}
          <rect x={cx - 0.6} y="-28" width="1.2" height="2" fill={STONE_DARK} />
          <line x1={cx} y1="-28" x2={cx} y2="-31.4" stroke={STONE_DARK} strokeWidth="0.45" />
          <circle cx={cx} cy="-31.6" r="0.35" fill={GOLD} />
        </g>
      ))}
      {/* tower windows hint */}
      {[-4, 4].map((cx, i) => (
        <g key={i}>
          {[0, 1, 2, 3, 4].map((seg) => (
            <line
              key={seg}
              x1={cx - 1.4}
              y1={-4 - seg * 4}
              x2={cx + 1.4}
              y2={-4 - seg * 4}
              stroke={STONE_DARK}
              strokeWidth="0.2"
            />
          ))}
        </g>
      ))}
    </g>
  ),

  // Marina Bay Sands — Singapore
  Singapore: (
    <g>
      <ellipse cx="0" cy="0.5" rx="11" ry="1" fill={DEEP} opacity="0.25" />
      {/* sky park (the boat-shaped top deck) */}
      <path d="M -10 -16 L 10 -16 L 9 -19 L -8 -19 Z" fill={STONE_LIGHT} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M -9 -19 L -8 -19 L -2 -20 L 2 -20 L 8 -19 L 9 -19 Z" fill={STONE_DARK} opacity="0.45" />
      {/* tiny trees on top */}
      <circle cx="-5" cy="-20.5" r="0.4" fill={GREEN_DARK} />
      <circle cx="-1" cy="-20.5" r="0.4" fill={GREEN_DARK} />
      <circle cx="3" cy="-20.5" r="0.4" fill={GREEN_DARK} />
      {/* three towers */}
      {[-7, 0, 7].map((cx, i) => (
        <g key={i}>
          <rect x={cx - 1.4} y="-16" width="2.8" height="16" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.3" />
          {/* curved lean */}
          <path d={`M ${cx - 1.4} -16 L ${cx - 0.6} -16 L ${cx - 1.2} 0 L ${cx - 1.4} 0 Z`} fill={STONE_DARK} opacity="0.35" />
          {[1, 4, 7, 10, 13].map((y) => (
            <line key={y} x1={cx - 1.2} y1={-y} x2={cx + 1.2} y2={-y} stroke={STONE_DARK} strokeWidth="0.18" />
          ))}
        </g>
      ))}
    </g>
  ),

  // Tiger's Nest — Bhutan (cliffside monastery)
  Bhutan: (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="1" fill={DEEP} opacity="0.25" />
      {/* cliff face */}
      <path d="M -13 0 L -11 -22 L -3 -24 L 0 -22 L 11 -25 L 13 0 Z" fill={STONE} stroke={STONE_DARK} strokeWidth="0.3" />
      <path d="M 0 -22 L 11 -25 L 13 0 L 8 0 L 4 -18 Z" fill={STONE_DARK} opacity="0.45" />
      {/* monastery clinging to cliff */}
      <rect x="-3" y="-16" width="6" height="6" fill={CREAM} stroke={STONE_DARK} strokeWidth="0.3" />
      {/* golden roofs */}
      <path d="M -3.4 -16 L -3 -18 L 0 -19 L 3 -18 L 3.4 -16 Z" fill={GOLD} stroke={STONE_DARK} strokeWidth="0.3" />
      <rect x="-2" y="-13" width="0.8" height="0.8" fill={ROOF_DARK} />
      <rect x="-0.4" y="-13" width="0.8" height="0.8" fill={ROOF_DARK} />
      <rect x="1.2" y="-13" width="0.8" height="0.8" fill={ROOF_DARK} />
      {/* prayer flags */}
      <path d="M 3.4 -17 L 8 -19" stroke={STONE_DARK} strokeWidth="0.2" />
      <rect x="5.6" y="-19" width="0.5" height="1" fill="#c64e3f" />
      <rect x="6.3" y="-19.2" width="0.5" height="1" fill="#d4b54a" />
      <rect x="7" y="-19" width="0.5" height="1" fill="#2a8e76" />
      {/* prayer flags on other side */}
      <path d="M -3.4 -17 L -8 -19" stroke={STONE_DARK} strokeWidth="0.2" />
      <rect x="-6.1" y="-19" width="0.5" height="1" fill="#c64e3f" />
      <rect x="-6.8" y="-19.2" width="0.5" height="1" fill="#d4b54a" />
      <rect x="-7.5" y="-19" width="0.5" height="1" fill="#6c6cc7" />
    </g>
  ),
};

// Generic fallback for countries without a custom figurine
const FALLBACK = (
  <g>
    <ellipse cx="0" cy="0.5" rx="3" ry="0.5" fill={DEEP} opacity="0.25" />
    <rect x="-1.5" y="-6" width="3" height="6" fill={SAND} stroke={STONE_DARK} strokeWidth="0.3" />
    <path d="M -2 -6 L 0 -8 L 2 -6 Z" fill={ROOF} stroke={STONE_DARK} strokeWidth="0.3" />
    <rect x="-0.6" y="-3.5" width="1.2" height="1.5" fill={DEEP} opacity="0.6" />
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
              {/* soft drop shadow under the figurine */}
              <ellipse cx="0" cy="1.6" rx="10" ry="2" fill="rgba(40,25,8,0.22)" />
              {icon}
            </g>
          </Marker>
        );
      })}
    </g>
  );
}

"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

type Props = {
  /** Memories palette = deeper, more midnight. Globe palette = slightly
   *  warmer with a hint of dusk. */
  palette?: "memories" | "globe";
};

type Star = {
  /** percent of viewport */
  x: number;
  y: number;
  /** SVG radius in viewBox units (the SVG is `0 0 100 100`) */
  r: number;
  opacity: number;
  twinkSec: number;
  twinkPhase: number;
  tint: string;
  bright: boolean;
};

type Planet = {
  x: number;
  y: number;
  r: number;
  driftSec: number;
  hue: string;
  ring?: boolean;
  ringTilt?: number;
};

const PALETTES: Record<NonNullable<Props["palette"]>, {
  bg: string;
  nebula1: string;
  nebula2: string;
}> = {
  memories: {
    bg: "radial-gradient(ellipse at 50% 35%, #2c3460 0%, #14193a 50%, #07091a 100%)",
    nebula1: "rgba(120, 90, 200, 0.10)", // violet
    nebula2: "rgba(80, 140, 180, 0.07)", // teal
  },
  globe: {
    bg: "radial-gradient(ellipse at 50% 38%, #1f2a48 0%, #0c1226 55%, #03060f 100%)",
    nebula1: "rgba(80, 130, 180, 0.09)", // cool teal
    nebula2: "rgba(180, 110, 80, 0.07)", // warm rust
  },
};

const STAR_COUNT = 620;

/**
 * Fullscreen procedural starfield + a couple of muted distant planets.
 *
 * Realism touches over the previous version:
 *  - Power-law star size distribution: 75% tiny pinpricks, 22% mid, 3% bright.
 *  - Per-star color tint drawn from a realistic palette (cool white,
 *    yellow-orange, light blue) instead of a single warm cream.
 *  - The few brightest stars get diffraction-style cross spikes via SVG.
 *  - Two faint nebula washes layered behind the field so the void has
 *    color variation instead of one flat gradient.
 *  - Planets are smaller, more muted, and drift extremely slowly so they
 *    feel "distant" rather than dragged across the screen.
 *  - Deterministic seed → no hydration mismatch.
 */
export default function UniverseBackdrop({ palette = "globe" }: Props) {
  const colors = PALETTES[palette];

  const stars = useMemo<Star[]>(() => {
    let s = palette === "globe" ? 9301 : 4221;
    const rng = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const out: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const sizeRoll = rng();
      // SVG viewBox is 0..100. Star radii expressed in those units.
      const r =
        sizeRoll < 0.75
          ? 0.04 + rng() * 0.08
          : sizeRoll < 0.97
            ? 0.12 + rng() * 0.1
            : 0.22 + rng() * 0.18;
      const bright = sizeRoll >= 0.97;
      // Color tint sampled from a realistic stellar palette.
      const colorRoll = rng();
      const tint =
        colorRoll < 0.62
          ? "#ffffff"
          : colorRoll < 0.78
            ? "#fff3d0" // warm white / G-class
            : colorRoll < 0.9
              ? "#ffd9b0" // pale orange / K-class
              : colorRoll < 0.96
                ? "#cfe0ff" // pale blue / A-class
                : "#ffc890"; // amber / late K
      out.push({
        x: rng() * 100,
        y: rng() * 100,
        r,
        opacity: 0.35 + rng() * 0.6,
        twinkSec: 2.4 + rng() * 7,
        twinkPhase: rng() * 9,
        tint,
        bright,
      });
    }
    return out;
  }, [palette]);

  const planets: Planet[] = useMemo(
    () => [
      {
        x: 16,
        y: 28,
        r: 46,
        driftSec: 240,
        hue: palette === "memories" ? "#6a5ca8" : "#8674b8",
      },
      {
        x: 84,
        y: 76,
        r: 74,
        driftSec: 360,
        hue: palette === "memories" ? "#b07a5a" : "#a87a4a",
        ring: true,
        ringTilt: -18,
      },
    ],
    [palette],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ background: colors.bg }}
    >
      {/* Two nebula washes for color variation behind the stars. Kept very
       *  low opacity so they read as "atmosphere" rather than wallpaper. */}
      <div
        className="absolute"
        style={{
          left: "12%",
          top: "8%",
          width: "70%",
          height: "60%",
          background: `radial-gradient(ellipse at 30% 40%, ${colors.nebula1}, transparent 65%)`,
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "30%",
          top: "40%",
          width: "60%",
          height: "55%",
          background: `radial-gradient(ellipse at 60% 50%, ${colors.nebula2}, transparent 65%)`,
          filter: "blur(60px)",
        }}
      />

      {/* Distant planets — drift in a very slow elliptical loop */}
      {planets.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.r * 2,
            height: p.r * 2,
            marginLeft: -p.r,
            marginTop: -p.r,
            opacity: 0.35,
          }}
          animate={{
            x: [0, 14, 0, -14, 0],
            y: [0, -8, 0, 8, 0],
          }}
          transition={{
            duration: p.driftSec,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg viewBox={`-${p.r} -${p.r} ${p.r * 2} ${p.r * 2}`} width="100%" height="100%">
            <defs>
              <radialGradient id={`planet-grad-${i}-${palette}`} cx="32%" cy="30%" r="78%">
                <stop offset="0%" stopColor={p.hue} stopOpacity={0.85} />
                <stop offset="55%" stopColor={p.hue} stopOpacity={0.55} />
                <stop offset="100%" stopColor={p.hue} stopOpacity={0.05} />
              </radialGradient>
              <radialGradient id={`planet-shade-${i}-${palette}`} cx="68%" cy="74%" r="64%">
                <stop offset="0%" stopColor="#000" stopOpacity={0} />
                <stop offset="100%" stopColor="#000" stopOpacity={0.45} />
              </radialGradient>
            </defs>
            {p.ring && (
              <g transform={`rotate(${p.ringTilt ?? -15})`}>
                <ellipse
                  cx={0}
                  cy={0}
                  rx={p.r * 0.95}
                  ry={p.r * 0.22}
                  fill="none"
                  stroke={p.hue}
                  strokeOpacity={0.55}
                  strokeWidth={1.4}
                />
                <ellipse
                  cx={0}
                  cy={0}
                  rx={p.r * 0.82}
                  ry={p.r * 0.16}
                  fill="none"
                  stroke={p.hue}
                  strokeOpacity={0.3}
                  strokeWidth={0.9}
                />
              </g>
            )}
            <circle r={p.r * 0.6} fill={`url(#planet-grad-${i}-${palette})`} />
            <circle r={p.r * 0.6} fill={`url(#planet-shade-${i}-${palette})`} />
          </svg>
        </motion.div>
      ))}

      {/* Starfield. preserveAspectRatio=none stretches the viewBox to the
       *  viewport so stars distribute evenly across the whole screen. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        className="absolute inset-0"
      >
        {stars.map((star, i) => {
          if (star.bright) {
            // Brightest stars get a soft halo and a faint cross spike.
            const spike = star.r * 5;
            return (
              <g
                key={i}
                style={{
                  animation: `atlasTwink ${star.twinkSec}s ease-in-out ${-star.twinkPhase}s infinite alternate`,
                  transformOrigin: `${star.x}% ${star.y}%`,
                }}
                opacity={star.opacity}
              >
                {/* halo */}
                <circle
                  cx={star.x}
                  cy={star.y}
                  r={star.r * 1.8}
                  fill={star.tint}
                  opacity={0.18}
                />
                {/* core */}
                <circle cx={star.x} cy={star.y} r={star.r} fill={star.tint} />
                {/* diffraction spikes (thin lines through center) */}
                <line
                  x1={star.x - spike}
                  y1={star.y}
                  x2={star.x + spike}
                  y2={star.y}
                  stroke={star.tint}
                  strokeWidth={0.04}
                  opacity={0.55}
                  strokeLinecap="round"
                />
                <line
                  x1={star.x}
                  y1={star.y - spike}
                  x2={star.x}
                  y2={star.y + spike}
                  stroke={star.tint}
                  strokeWidth={0.04}
                  opacity={0.55}
                  strokeLinecap="round"
                />
              </g>
            );
          }
          return (
            <circle
              key={i}
              cx={star.x}
              cy={star.y}
              r={star.r}
              fill={star.tint}
              opacity={star.opacity}
              style={{
                animation: `atlasTwink ${star.twinkSec}s ease-in-out ${-star.twinkPhase}s infinite alternate`,
              }}
            />
          );
        })}
      </svg>

      <style jsx global>{`
        @keyframes atlasTwink {
          0% {
            opacity: 0.18;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

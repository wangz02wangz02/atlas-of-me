"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

type Props = {
  /** Memories palette = deeper, more midnight. Globe palette = slightly
   *  warmer with a hint of dusk. */
  palette?: "memories" | "globe";
  /** Camera offset in pixels.  Stars and planets get a *fraction* of this
   *  applied so they drift at "distant body" speeds when the user drags
   *  the camera through the universe.  Stars move least, planets a bit
   *  more, Earth at full speed (handled by Globe itself). */
  cameraOffset?: { x: number; y: number };
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

type Body = {
  kind: "planet" | "moon" | "sun" | "mars";
  x: number;
  y: number;
  r: number;
  driftSec: number;
  hue: string;
  hueDeep?: string;
  ring?: boolean;
  ringTilt?: number;
  label?: string;
  sublabel?: string;
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
export default function UniverseBackdrop({
  palette = "globe",
  cameraOffset = { x: 0, y: 0 },
}: Props) {
  const colors = PALETTES[palette];

  // Parallax factors — small fractions of the camera offset so distant
  // objects drift slowly when the user drags around. The starfield gets
  // the tiniest factor (effectively infinite distance), planets a bit
  // more (they're closer than stars). Earth itself rides at 1.0 inside
  // the Globe component, so it appears to move "the most" — which is
  // the correct perspective for a 3rd-person camera flight around it.
  const starShiftX = cameraOffset.x * -0.08;
  const starShiftY = cameraOffset.y * -0.08;
  const planetShiftX = cameraOffset.x * -0.35;
  const planetShiftY = cameraOffset.y * -0.35;
  const nebulaShiftX = cameraOffset.x * -0.04;
  const nebulaShiftY = cameraOffset.y * -0.04;

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

  const bodies: Body[] = useMemo(
    () => [
      // The Sun — top-right corner, big warm disk with a corona.
      {
        kind: "sun",
        x: 88,
        y: 16,
        r: 58,
        driftSec: 420,
        hue: "#ffd07a",
        hueDeep: "#ff8a3a",
        label: "Sol",
      },
      // The Moon — lower-left, smaller pale disk with subtle crater shading.
      {
        kind: "moon",
        x: 12,
        y: 78,
        r: 38,
        driftSec: 320,
        hue: "#d8d4cb",
        hueDeep: "#8e8a82",
        label: "Luna",
      },
      // Mars — middle-right, smaller rust disk. Pinned as a "future
      // destination" so it threads through to the predict panel.
      {
        kind: "mars",
        x: 76,
        y: 62,
        r: 26,
        driftSec: 260,
        hue: "#d96a3a",
        hueDeep: "#7a3115",
        label: "Mars",
        sublabel: "future destination",
      },
      // One ringed gas-giant-ish planet for variety, far upper-left.
      {
        kind: "planet",
        x: 18,
        y: 26,
        r: 30,
        driftSec: 380,
        hue: palette === "memories" ? "#7e6cb0" : "#8c78b8",
        ring: true,
        ringTilt: -20,
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
      {/* Nebula washes — drift extremely slowly with the camera (almost
       *  infinite distance). */}
      <div
        className="absolute"
        style={{
          left: "12%",
          top: "8%",
          width: "70%",
          height: "60%",
          background: `radial-gradient(ellipse at 30% 40%, ${colors.nebula1}, transparent 65%)`,
          filter: "blur(40px)",
          transform: `translate(${nebulaShiftX}px, ${nebulaShiftY}px)`,
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
          transform: `translate(${nebulaShiftX}px, ${nebulaShiftY}px)`,
        }}
      />

      {/* Celestial bodies — drift slowly on their own AND parallax with the
       *  camera offset so the whole scene moves coherently. */}
      {bodies.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.r * 2,
            height: p.r * 2,
            marginLeft: -p.r + planetShiftX,
            marginTop: -p.r + planetShiftY,
            opacity: p.kind === "sun" ? 0.65 : 0.42,
          }}
          animate={{
            x: [0, 12, 0, -12, 0],
            y: [0, -6, 0, 6, 0],
          }}
          transition={{
            duration: p.driftSec,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg
            viewBox={`-${p.r * 1.6} -${p.r * 1.6} ${p.r * 3.2} ${p.r * 3.2}`}
            width="100%"
            height="100%"
            style={{ overflow: "visible" }}
          >
            <defs>
              <radialGradient id={`body-grad-${i}-${palette}`} cx="32%" cy="30%" r="78%">
                <stop offset="0%" stopColor={p.hue} stopOpacity={0.95} />
                <stop offset="55%" stopColor={p.hueDeep ?? p.hue} stopOpacity={0.6} />
                <stop offset="100%" stopColor={p.hueDeep ?? p.hue} stopOpacity={0.05} />
              </radialGradient>
              <radialGradient id={`body-shade-${i}-${palette}`} cx="68%" cy="74%" r="64%">
                <stop offset="0%" stopColor="#000" stopOpacity={0} />
                <stop offset="100%" stopColor="#000" stopOpacity={0.45} />
              </radialGradient>
              {p.kind === "sun" && (
                <radialGradient id={`body-corona-${i}`} cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor={p.hue} stopOpacity={0.7} />
                  <stop offset="35%" stopColor={p.hue} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={p.hue} stopOpacity={0} />
                </radialGradient>
              )}
              {p.kind === "moon" && (
                <radialGradient id={`body-crater-${i}`} cx="38%" cy="32%" r="62%">
                  <stop offset="0%" stopColor="#fffaf0" stopOpacity={0.6} />
                  <stop offset="60%" stopColor="#fffaf0" stopOpacity={0} />
                </radialGradient>
              )}
            </defs>

            {/* Corona / glow for the sun */}
            {p.kind === "sun" && (
              <circle r={p.r * 1.4} fill={`url(#body-corona-${i})`} />
            )}

            {/* Ring for gas-giant planets */}
            {p.ring && (
              <g transform={`rotate(${p.ringTilt ?? -15})`}>
                <ellipse
                  cx={0}
                  cy={0}
                  rx={p.r * 0.95}
                  ry={p.r * 0.22}
                  fill="none"
                  stroke={p.hue}
                  strokeOpacity={0.6}
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

            {/* Body disk */}
            <circle r={p.r * 0.62} fill={`url(#body-grad-${i}-${palette})`} />

            {/* Moon: a few faint craters */}
            {p.kind === "moon" && (
              <g opacity={0.5}>
                <circle cx={-p.r * 0.22} cy={p.r * 0.12} r={p.r * 0.08} fill="#9c958a" />
                <circle cx={p.r * 0.18} cy={-p.r * 0.04} r={p.r * 0.05} fill="#9c958a" />
                <circle cx={p.r * 0.05} cy={p.r * 0.25} r={p.r * 0.06} fill="#9c958a" />
                <circle r={p.r * 0.62} fill={`url(#body-crater-${i})`} />
              </g>
            )}

            {/* Mars: subtle polar cap */}
            {p.kind === "mars" && (
              <g opacity={0.7}>
                <ellipse
                  cx={p.r * 0.05}
                  cy={-p.r * 0.42}
                  rx={p.r * 0.16}
                  ry={p.r * 0.08}
                  fill="#fde8c4"
                />
              </g>
            )}

            {/* Shading */}
            <circle r={p.r * 0.62} fill={`url(#body-shade-${i}-${palette})`} />

            {/* Labels */}
            {p.label && (
              <g
                fontFamily="ui-monospace, monospace"
                style={{ pointerEvents: "none" }}
              >
                <line
                  x1={p.r * 0.5}
                  y1={p.r * 0.5}
                  x2={p.r * 0.9}
                  y2={p.r * 0.9}
                  stroke="rgba(253,232,184,0.45)"
                  strokeWidth={0.6}
                />
                <text
                  x={p.r * 0.95}
                  y={p.r * 0.95}
                  fontSize={p.r * 0.18}
                  fill="rgba(253,232,184,0.85)"
                  letterSpacing="2"
                  style={{ textTransform: "uppercase" }}
                >
                  {p.label}
                </text>
                {p.sublabel && (
                  <text
                    x={p.r * 0.95}
                    y={p.r * 1.15}
                    fontSize={p.r * 0.12}
                    fill="rgba(253,232,184,0.55)"
                    letterSpacing="1.5"
                    fontStyle="italic"
                  >
                    {p.sublabel}
                  </text>
                )}
              </g>
            )}
          </svg>
        </motion.div>
      ))}

      {/* Starfield — drifts at the smallest parallax fraction (effectively
       *  "infinite distance"). */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        className="absolute inset-0"
        style={{ transform: `translate(${starShiftX}px, ${starShiftY}px)` }}
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

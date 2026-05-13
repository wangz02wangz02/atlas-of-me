"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

type Props = {
  /** Memories palette = deeper, more midnight.  Globe palette = slightly
   *  warmer with a hint of dusk. */
  palette?: "memories" | "globe";
};

type Star = {
  x: number;
  y: number;
  r: number;
  o: number;
  /** twinkle period, seconds */
  twink: number;
  /** twinkle phase, seconds */
  phase: number;
};

type Planet = {
  x: number; // 0..100 (percent of viewport width)
  y: number; // 0..100 (percent of viewport height)
  r: number; // px
  drift: number; // seconds for one full slow orbit
  hue: string;
  ring?: boolean;
  ringTilt?: number;
};

const PALETTES: Record<NonNullable<Props["palette"]>, {
  bg: string;
  star: string;
}> = {
  memories: {
    bg: "radial-gradient(ellipse at 50% 35%, #3b4570 0%, #1d2340 50%, #0e1426 100%)",
    star: "#fde8b8",
  },
  globe: {
    bg: "radial-gradient(ellipse at 50% 38%, #2b3a55 0%, #131a30 55%, #050810 100%)",
    star: "#fde8b8",
  },
};

const STAR_COUNT = 260;

/**
 * Fullscreen "outer space" background — procedural starfield + a couple of
 * faint distant planets drifting slowly behind the focal orb (globe or
 * memories constellation).  Always deterministic so SSR and the client agree.
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
      const r = rng() * 1.4 + 0.3;
      out.push({
        x: rng() * 100,
        y: rng() * 100,
        r,
        o: rng() * 0.55 + 0.25,
        twink: 2.4 + rng() * 4.5,
        phase: rng() * 5,
      });
    }
    return out;
  }, [palette]);

  // Two muted, distant planets that drift very slowly across the screen.
  // Positions are absolute percentages of the viewport so they read at any
  // size and don't compete with the focal orb in the middle.
  const planets: Planet[] = useMemo(
    () => [
      {
        x: 14,
        y: 22,
        r: 64,
        drift: 110,
        hue: palette === "memories" ? "#7a6ec0" : "#9a7ac4",
      },
      {
        x: 84,
        y: 78,
        r: 92,
        drift: 165,
        hue: palette === "memories" ? "#c08770" : "#c69b6a",
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
      {/* Distant planets — drift in a slow elliptical loop */}
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
            opacity: 0.45,
          }}
          animate={{
            x: [0, 18, 0, -18, 0],
            y: [0, -10, 0, 10, 0],
          }}
          transition={{
            duration: p.drift,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg viewBox={`-${p.r} -${p.r} ${p.r * 2} ${p.r * 2}`} width="100%" height="100%">
            <defs>
              <radialGradient id={`planet-grad-${i}`} cx="32%" cy="30%" r="78%">
                <stop offset="0%" stopColor={p.hue} stopOpacity={0.85} />
                <stop offset="55%" stopColor={p.hue} stopOpacity={0.55} />
                <stop offset="100%" stopColor={p.hue} stopOpacity={0.05} />
              </radialGradient>
              <radialGradient id={`planet-shade-${i}`} cx="68%" cy="74%" r="64%">
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
                  strokeOpacity={0.6}
                  strokeWidth={1.6}
                />
                <ellipse
                  cx={0}
                  cy={0}
                  rx={p.r * 0.82}
                  ry={p.r * 0.16}
                  fill="none"
                  stroke={p.hue}
                  strokeOpacity={0.3}
                  strokeWidth={1}
                />
              </g>
            )}
            <circle r={p.r * 0.62} fill={`url(#planet-grad-${i})`} />
            <circle r={p.r * 0.62} fill={`url(#planet-shade-${i})`} />
          </svg>
        </motion.div>
      ))}

      {/* Procedural starfield. Twinkling via CSS opacity animation so we
       *  don't spend React renders on 260 points. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        className="absolute inset-0"
      >
        {stars.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r / 6}
            fill={colors.star}
            opacity={star.o}
            style={{
              animation: `atlasTwink ${star.twink}s ease-in-out ${-star.phase}s infinite alternate`,
            }}
          />
        ))}
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

"use client";

import { Marker } from "react-simple-maps";
import { motion } from "motion/react";

type Props = {
  coords: [number, number];
  /** When true, render a focused/just-added animation. */
  fresh?: boolean;
  /** Scales the whole marker. The flat map and the orb call this with
   *  different values so it reads at the right size in each context. */
  scale?: number;
  onClick?: (e: React.MouseEvent) => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  /** Optional label drawn next to the pin head. */
  label?: string;
  /** Light or dark surrounding so we can tune the outline / glow. */
  theme?: "paper" | "universe";
};

/**
 * User-dropped pin — a slender drop-pin with a glowing head. Hot magenta
 * by default so it reads as user-added rather than journey-related (the
 * journey uses warm amber/gold). Renders nicely on both the flat paper
 * map and the dark universe orb.
 */
export default function UserPinMarker({
  coords,
  fresh = false,
  scale = 1,
  onClick,
  onHoverStart,
  onHoverEnd,
  label,
  theme = "paper",
}: Props) {
  const headR = 4 * scale;
  const stem = 14 * scale;
  const haloR = 16 * scale;
  const pinHead = "#ff5599";
  const pinHeadShadow = "#a01c5a";
  const stroke = theme === "universe" ? "#180a14" : "#3a0a1d";
  return (
    <Marker
      coordinates={coords}
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      style={{
        default: { cursor: onClick ? "pointer" : "default", outline: "none" },
        hover: { cursor: onClick ? "pointer" : "default", outline: "none" },
        pressed: { cursor: onClick ? "pointer" : "default", outline: "none" },
      }}
    >
      <g>
        {/* Ambient bloom around the head */}
        {fresh ? (
          <motion.circle
            cy={-stem}
            r={haloR}
            fill="url(#user-pin-bloom)"
            initial={{ opacity: 0.95, scale: 0.4 }}
            animate={{ opacity: [1, 0.4, 1], scale: [0.9, 1.25, 0.9] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <circle cy={-stem} r={haloR} fill="url(#user-pin-bloom)" />
        )}

        {/* Drop-pin body: teardrop pointing down to the base */}
        <path
          d={`M 0 -1 L ${-headR * 0.95} ${-stem * 0.55} A ${headR} ${headR} 0 1 1 ${headR * 0.95} ${-stem * 0.55} Z`}
          fill={pinHeadShadow}
          stroke={stroke}
          strokeWidth={0.6 * scale}
        />
        <path
          d={`M 0 -1 L ${-headR * 0.85} ${-stem * 0.55} A ${headR * 0.9} ${headR * 0.9} 0 1 1 ${headR * 0.85} ${-stem * 0.55} Z`}
          fill={pinHead}
        />

        {/* Specular highlight on the head */}
        <ellipse
          cx={-headR * 0.35}
          cy={-stem - headR * 0.15}
          rx={headR * 0.4}
          ry={headR * 0.22}
          fill="#ffffff"
          opacity={0.7}
        />
        {/* Bright center dot */}
        <circle cx={0} cy={-stem - headR * 0.2} r={headR * 0.18} fill="#ffffff" />

        {/* Base ring at the location */}
        <ellipse
          cx={0}
          cy={0}
          rx={1.5 * scale}
          ry={0.5 * scale}
          fill={stroke}
          opacity={0.55}
        />

        {/* Optional label, drawn above the head */}
        {label && (
          <g pointerEvents="none">
            <text
              x={headR + 2 * scale}
              y={-stem + headR * 0.4}
              fontSize={6.5 * scale}
              fontFamily="ui-monospace, monospace"
              fill={theme === "universe" ? "#fde8b8" : "#3a0a1d"}
              opacity={0.95}
              style={{ textTransform: "uppercase", letterSpacing: "1.5px" }}
            >
              {label}
            </text>
          </g>
        )}
      </g>
    </Marker>
  );
}

/**
 * Shared `<defs>` block — call once near the top of each map's SVG so
 * UserPinMarker can reference the bloom gradient. Returns a fragment that
 * just contributes to a parent `<defs>`.
 */
export function UserPinDefs() {
  return (
    <radialGradient id="user-pin-bloom">
      <stop offset="0%" stopColor="#ff5599" stopOpacity={0.8} />
      <stop offset="40%" stopColor="#ff5599" stopOpacity={0.28} />
      <stop offset="100%" stopColor="#ff5599" stopOpacity={0} />
    </radialGradient>
  );
}

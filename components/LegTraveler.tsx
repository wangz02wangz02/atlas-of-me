"use client";

import { useEffect, useMemo, useState } from "react";
import { Marker, useMapContext } from "react-simple-maps";
import { motion } from "motion/react";
import { geoInterpolate } from "d3-geo";
import type { TransportMode } from "@/lib/places-types";
import { MODE_STYLE } from "@/lib/places";

type Props = {
  fromCoord: [number, number];
  toCoord: [number, number];
  mode: TransportMode;
  legKey: number;
  zoom: number;
};

function smoothstep(k: number) {
  return k * k * (3 - 2 * k);
}

const FLIGHT_DUR = 1800;
const PAUSE_DUR = 1400;
const CYCLE = FLIGHT_DUR + PAUSE_DUR;

/**
 * Plane (or mode-specific glyph) that rides along the current leg's arc with
 * a growing dashed trail behind it.
 *
 * The plane never sits still — it loops the leg continuously (~1.8s flight +
 * 1.4s pause at the destination, then resets and flies again) so the map
 * always has visible motion, the way the line traces across the map in
 * Indiana Jones.  When the active leg changes (legKey), the plane snaps to
 * the new leg's start and the loop continues from there.
 *
 * Update rate is 20fps via setInterval rather than 60fps RAF: more than
 * smooth enough for plane travel and keeps the parent SVG cheap.
 */
export default function LegTraveler({
  fromCoord,
  toCoord,
  mode,
  legKey,
  zoom,
}: Props) {
  const { projection } = useMapContext() as {
    projection: (c: [number, number]) => [number, number] | null;
  };
  const [t, setT] = useState(0);

  useEffect(() => {
    setT(0);
    const cycleStart = performance.now();
    const id = window.setInterval(() => {
      const cycleT = (performance.now() - cycleStart) % CYCLE;
      const flightT = Math.min(1, cycleT / FLIGHT_DUR);
      setT(smoothstep(flightT));
    }, 50);
    return () => clearInterval(id);
  }, [legKey]);

  const interp = useMemo(
    () => geoInterpolate(fromCoord, toCoord),
    [fromCoord, toCoord],
  );

  const trailPath = useMemo(() => {
    if (t < 0.001) return null;
    // Continuous polyline along the leg up to t. We bail only on non-finite
    // projections (the orthographic globe's back hemisphere); the flat map
    // keeps the line continuous through the antimeridian, matching the user
    // preference for "the line connects" over "the line ends cleanly."
    const steps = 28;
    const out: string[] = [];
    let curr: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const p = interp((i / steps) * t);
      const proj = projection(p);
      if (!proj || !Number.isFinite(proj[0]) || !Number.isFinite(proj[1])) {
        if (curr.length > 1) out.push(`M${curr.join("L")}`);
        curr = [];
        continue;
      }
      curr.push(`${proj[0].toFixed(2)},${proj[1].toFixed(2)}`);
    }
    if (curr.length > 1) out.push(`M${curr.join("L")}`);
    return out.length ? out.join(" ") : null;
  }, [interp, projection, t]);

  const pos = interp(t);
  const aheadT = t < 0.98 ? t + 0.02 : Math.max(0.97, t - 0.02);
  const ahead = interp(aheadT);
  const pA = projection(pos);
  const pB = projection(ahead);
  if (
    !pA ||
    !pB ||
    !Number.isFinite(pA[0]) ||
    !Number.isFinite(pB[0]) ||
    !Number.isFinite(pA[1]) ||
    !Number.isFinite(pB[1])
  ) {
    return null;
  }

  const dx = aheadT > t ? pB[0] - pA[0] : pA[0] - pB[0];
  const dy = aheadT > t ? pB[1] - pA[1] : pA[1] - pB[1];
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const color = MODE_STYLE[mode].color;
  // Plane is sized in *screen* pixels (not zoom-scaled) so it stays
  // readable when zoomed out and doesn't get cartoonishly huge zoomed in.
  const size = Math.max(14, Math.min(26, 20 / zoom));

  return (
    <>
      {trailPath && (
        <>
          {/* soft glow under the trail so it pops on light land */}
          <path
            d={trailPath}
            stroke={color}
            strokeWidth={3.6 / zoom}
            strokeOpacity={0.18}
            strokeLinecap="round"
            fill="none"
            pointerEvents="none"
          />
          <path
            d={trailPath}
            stroke={color}
            strokeWidth={1.7 / zoom}
            strokeDasharray={`${4 / zoom} ${3 / zoom}`}
            strokeLinecap="round"
            fill="none"
            opacity={0.98}
            pointerEvents="none"
          />
        </>
      )}
      <Marker coordinates={pos}>
        <g pointerEvents="none">
          {/* Pulsing bright halo so the plane is unmistakable */}
          <motion.circle
            r={size * 1.4}
            fill="url(#leg-traveler-halo)"
            initial={{ opacity: 0.5, scale: 0.85 }}
            animate={{ opacity: [0.45, 0.9, 0.45], scale: [0.85, 1.05, 0.85] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle r={size * 0.95} fill="rgba(255,255,255,0.65)" />
          <g transform={`rotate(${angle.toFixed(2)})`}>
            <ModeIcon mode={mode} size={size} color={color} />
          </g>
        </g>
      </Marker>
    </>
  );
}

function ModeIcon({
  mode,
  size,
  color,
}: {
  mode: TransportMode;
  size: number;
  color: string;
}) {
  // Each icon is drawn in a ~12-unit-wide canvas, then scaled to `size`.
  const s = size / 12;
  if (mode === "flight") {
    return (
      <g transform={`scale(${s.toFixed(3)})`}>
        <path
          d="M-9 0 L-3 -1.4 L-1.5 -5 L0 -6.5 L1.5 -5 L3 -1.4 L9 0 L3 1.4 L1.5 5 L0 6.5 L-1.5 5 L-3 1.4 Z"
          fill={color}
          stroke="#fff"
          strokeWidth={0.7}
          strokeLinejoin="round"
        />
      </g>
    );
  }
  if (mode === "train") {
    return (
      <g transform={`scale(${s.toFixed(3)})`}>
        <rect
          x={-6}
          y={-3}
          width={12}
          height={6}
          rx={1.2}
          fill={color}
          stroke="#fff"
          strokeWidth={0.6}
        />
        <circle cx={-3.5} cy={-1.2} r={0.9} fill="#fff" />
        <circle cx={3.5} cy={-1.2} r={0.9} fill="#fff" />
      </g>
    );
  }
  if (mode === "ship") {
    return (
      <g transform={`scale(${s.toFixed(3)})`}>
        <path
          d="M-7 1 L7 1 L5 4 L-5 4 Z"
          fill={color}
          stroke="#fff"
          strokeWidth={0.6}
          strokeLinejoin="round"
        />
        <path
          d="M0 -5 L0 1 M0 -5 L4 -1.5 L0 -1.5"
          fill={color}
          stroke="#fff"
          strokeWidth={0.6}
        />
      </g>
    );
  }
  if (mode === "car") {
    return (
      <g transform={`scale(${s.toFixed(3)})`}>
        <rect
          x={-5}
          y={-2}
          width={10}
          height={3.5}
          rx={1.5}
          fill={color}
          stroke="#fff"
          strokeWidth={0.6}
        />
        <circle cx={-3} cy={2} r={1} fill="#222" />
        <circle cx={3} cy={2} r={1} fill="#222" />
      </g>
    );
  }
  // bus
  return (
    <g transform={`scale(${s.toFixed(3)})`}>
      <rect
        x={-6}
        y={-3}
        width={12}
        height={6}
        rx={1}
        fill={color}
        stroke="#fff"
        strokeWidth={0.6}
      />
      <rect x={-4.5} y={-2} width={2} height={2} fill="#fff" opacity={0.75} />
      <rect x={-1.5} y={-2} width={2} height={2} fill="#fff" opacity={0.75} />
      <rect x={1.5} y={-2} width={2} height={2} fill="#fff" opacity={0.75} />
    </g>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Marker, useMapContext } from "react-simple-maps";
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

/**
 * Plane (or mode-specific glyph) that rides along the current leg's arc.
 * Animates 0 → 1 whenever `legKey` changes; leaves a growing dashed trail.
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
  const [t, setT] = useState(1);
  const prevKey = useRef<number | null>(null);

  useEffect(() => {
    // First mount: no animation, just park at destination.
    if (prevKey.current === null) {
      prevKey.current = legKey;
      setT(1);
      return;
    }
    if (prevKey.current === legKey) return;
    prevKey.current = legKey;
    setT(0);
    let raf = 0;
    const t0 = performance.now();
    const dur = 1100;
    const step = () => {
      const raw = Math.min(1, (performance.now() - t0) / dur);
      setT(smoothstep(raw));
      if (raw < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [legKey]);

  const interp = useMemo(
    () => geoInterpolate(fromCoord, toCoord),
    [fromCoord, toCoord],
  );

  const trailPath = useMemo(() => {
    if (t < 0.001) return null;
    const steps = 28;
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const p = interp((i / steps) * t);
      const proj = projection(p);
      if (!proj || !Number.isFinite(proj[0]) || !Number.isFinite(proj[1])) {
        // hit the antimeridian seam — give up on this segment
        if (pts.length > 1) return `M${pts.join("L")}`;
        return null;
      }
      pts.push(`${proj[0].toFixed(2)},${proj[1].toFixed(2)}`);
    }
    return pts.length > 1 ? `M${pts.join("L")}` : null;
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
  const size = 11 / zoom;

  return (
    <>
      {trailPath && (
        <path
          d={trailPath}
          stroke={color}
          strokeWidth={1.4 / zoom}
          strokeDasharray={`${4 / zoom} ${3 / zoom}`}
          strokeLinecap="round"
          fill="none"
          opacity={0.95}
          pointerEvents="none"
        />
      )}
      <Marker coordinates={pos}>
        <g pointerEvents="none">
          {/* soft halo so the icon reads on any background */}
          <circle r={size * 0.95} fill="rgba(255,255,255,0.55)" />
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

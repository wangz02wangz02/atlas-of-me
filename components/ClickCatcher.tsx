"use client";

import { useMapContext } from "react-simple-maps";

/**
 * Invisible click-catcher that converts a screen click into a geographic
 * [lon, lat] using the map's current projection (orthographic on the
 * globe, equirectangular on the flat map). Placed inside the SVG so the
 * surrounding ZoomableGroup / projectionConfig transforms apply, and the
 * inverse projection lands on the right point.
 *
 * The catcher is a huge transparent rect so it covers the visible
 * viewport even at any zoom / pan. It only renders when `active` is true.
 */
export default function ClickCatcher({
  active,
  onPick,
  cursor = "crosshair",
}: {
  active: boolean;
  onPick: (lonLat: [number, number]) => void;
  cursor?: string;
}) {
  const { projection } = useMapContext() as {
    projection: {
      invert?: (xy: [number, number]) => [number, number] | null;
    };
  };
  if (!active) return null;
  const onClick = (e: React.MouseEvent<SVGRectElement>) => {
    e.stopPropagation();
    const svgEl = e.currentTarget.ownerSVGElement;
    if (!svgEl) return;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;
    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const local = pt.matrixTransform(ctm.inverse());
    if (!projection.invert) return;
    const lonLat = projection.invert([local.x, local.y]);
    if (!lonLat || !Number.isFinite(lonLat[0]) || !Number.isFinite(lonLat[1])) {
      return;
    }
    // Wrap lon back into [-180, 180] in case the flat map's wrap copies
    // produced an out-of-range coordinate.
    const wrapped: [number, number] = [
      ((((lonLat[0] + 180) % 360) + 360) % 360) - 180,
      Math.max(-90, Math.min(90, lonLat[1])),
    ];
    onPick(wrapped);
  };
  return (
    <rect
      x={-100000}
      y={-100000}
      width={200000}
      height={200000}
      fill="transparent"
      onClick={onClick}
      style={{ cursor }}
    />
  );
}

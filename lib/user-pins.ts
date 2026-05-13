/**
 * User-added pins — places the visitor marks on the map themselves.
 *
 * Stored in localStorage so they survive a reload but never travel between
 * browsers. The data shape is intentionally small: one entry per pin with
 * a stable id, a city + country label, and the lon/lat coordinate.
 */

export type UserPin = {
  id: string;
  city: string;
  country: string;
  /** [lon, lat] — GeoJSON order, what every projection in this app expects. */
  coords: [number, number];
  createdAt: number;
};

const LS_KEY = "atlas-user-pins";

export function loadPins(): UserPin[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UserPin[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p) =>
        p &&
        typeof p.id === "string" &&
        typeof p.city === "string" &&
        Array.isArray(p.coords) &&
        p.coords.length === 2,
    );
  } catch {
    return [];
  }
}

export function savePins(pins: UserPin[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(pins));
  } catch {
    /* ignore quota errors */
  }
}

export function newPinId(): string {
  return `pin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

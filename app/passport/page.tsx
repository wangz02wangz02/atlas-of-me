import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getAllPlacesWithPhotos } from "@/lib/places-server";
import {
  formatStampDate,
  formatPageDate,
  getCountryStamps,
  getPassportPages,
} from "@/lib/passport";
import PassportClient from "@/components/PassportClient";

function loadAltitudes(): Record<string, number> {
  try {
    const p = path.join(process.cwd(), "data", "altitudes.json");
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return {};
  }
}

export const metadata = {
  title: "Travel Passport — Atlas of Me",
};

export default function PassportPage() {
  const places = getAllPlacesWithPhotos();
  const placeBySlug = new Map(places.map((p) => [p.slug, p]));
  const altitudes = loadAltitudes();
  const stamps = getCountryStamps().map((s) => ({
    ...s,
    firstDate: formatStampDate(s.firstDate),
  }));
  const pages = getPassportPages(altitudes).map((p) => {
    const place = placeBySlug.get(p.city.slug);
    return {
      stop: p.stop,
      date: formatPageDate(p.date),
      slug: p.city.slug,
      name: p.city.name,
      country: p.city.country,
      countryCode: p.city.countryCode,
      tagline: p.city.tagline,
      photo: place?.photos?.[0] ?? null,
      altitude: p.altitude,
    };
  });

  return <PassportClient stamps={stamps} pages={pages} />;
}

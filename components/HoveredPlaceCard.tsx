"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Place } from "@/lib/places-types";

type Forecast = {
  temperature: number | null;
  windspeed: number | null;
  weathercode: number | null;
  is_day: number | null;
  timezone: string | null;
  loading: boolean;
} | null;

const WEATHER_CODE: Record<number, string> = {
  0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog",
  51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
  61: "Rain", 63: "Rain", 65: "Heavy rain",
  71: "Snow", 73: "Snow", 75: "Snow",
  80: "Showers", 81: "Showers", 82: "Showers",
  95: "Storm", 96: "Storm", 99: "Storm",
};

export default function HoveredPlaceCard({ place }: { place: Place | null }) {
  const [forecast, setForecast] = useState<Forecast>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!place) {
      setForecast(null);
      return;
    }
    const ctrl = new AbortController();
    setForecast({
      temperature: null,
      windspeed: null,
      weathercode: null,
      is_day: null,
      timezone: null,
      loading: true,
    });
    const [lon, lat] = place.coordinates;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(
      3,
    )}&longitude=${lon.toFixed(3)}&current_weather=true&timezone=auto`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        const cw = data?.current_weather ?? {};
        setForecast({
          temperature: cw.temperature ?? null,
          windspeed: cw.windspeed ?? null,
          weathercode: cw.weathercode ?? null,
          is_day: cw.is_day ?? null,
          timezone: data?.timezone ?? null,
          loading: false,
        });
      })
      .catch((e: unknown) => {
        if ((e as Error)?.name === "AbortError") return;
        setForecast({
          temperature: null,
          windspeed: null,
          weathercode: null,
          is_day: null,
          timezone: null,
          loading: false,
        });
      });
    return () => ctrl.abort();
  }, [place]);

  let timeStr = "";
  if (place) {
    try {
      timeStr = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: forecast?.timezone ?? undefined,
      }).format(now);
    } catch {
      const offsetH = Math.round(place.coordinates[0] / 15);
      const local = new Date(now.getTime() + offsetH * 3600_000);
      timeStr = local.toUTCString().slice(17, 22);
    }
  }

  return (
    <div className="pointer-events-none fixed left-6 top-20 z-30">
      <AnimatePresence>
        {place && (
          <motion.div
            key={place.slug}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="min-w-[220px] rounded-md border border-paper-3 bg-paper/95 px-3 py-2 shadow-md backdrop-blur-md"
          >
            <div className="text-[9px] uppercase tracking-[0.3em] text-ink-faint">
              {place.country}
            </div>
            <div className="font-display text-xl leading-tight text-ink">
              {place.name}
            </div>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-soft">
              <span className="font-mono">{timeStr || "—:—"}</span>
              <span className="text-ink-faint">·</span>
              {forecast?.loading ? (
                <span className="text-ink-faint">loading…</span>
              ) : forecast && forecast.temperature !== null ? (
                <>
                  <span className="font-mono">
                    {Math.round(forecast.temperature)}°C
                  </span>
                  <span className="text-ink-faint">
                    {forecast.weathercode !== null
                      ? WEATHER_CODE[forecast.weathercode] ?? "—"
                      : "—"}
                  </span>
                </>
              ) : (
                <span className="text-ink-faint">weather n/a</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

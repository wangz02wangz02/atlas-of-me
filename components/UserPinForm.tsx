"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { countryAt } from "@/lib/country-lookup";
import { NAME_MAX, sanitizeName, type UserPin } from "@/lib/user-pins";

type Props = {
  /** Pin we're editing (with id, city, country) or a freshly captured
   *  location (no id yet). */
  initial:
    | UserPin
    | { coords: [number, number]; city?: string; country?: string };
  onSave: (next: { city: string; country: string }) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

/**
 * Modal form for adding or editing a user pin. The country field is
 * auto-prefilled from a reverse point-in-polygon lookup against the
 * countries-110m TopoJSON (when the click hits land). Either field
 * can be freely edited.
 */
export default function UserPinForm({
  initial,
  onSave,
  onCancel,
  onDelete,
}: Props) {
  const [city, setCity] = useState<string>(initial.city ?? "");
  const [country, setCountry] = useState<string>(initial.country ?? "");
  const [autoPending, setAutoPending] = useState<boolean>(
    !initial.country,
  );

  useEffect(() => {
    if (initial.country) return;
    let active = true;
    (async () => {
      const c = await countryAt(initial.coords[0], initial.coords[1]);
      if (!active) return;
      setAutoPending(false);
      if (c) setCountry((prev) => prev || c);
    })();
    return () => {
      active = false;
    };
    // initial.coords is stable per modal open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Sanitize on the way out — strips C0 controls + bidi overrides, collapses
    // whitespace, and enforces the same length cap that `loadPins` re-checks.
    const safeCity = sanitizeName(city);
    if (!safeCity) return;
    onSave({ city: safeCity, country: sanitizeName(country) });
  };

  return (
    <motion.div
      key="pin-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 backdrop-blur-sm"
    >
      <motion.form
        initial={{ y: 18, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 16, scale: 0.97, opacity: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="w-[min(420px,92vw)] rounded-lg border border-paper-3 bg-paper/96 p-5 shadow-2xl backdrop-blur"
      >
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
              {"id" in initial ? "Edit pin" : "Drop a pin"}
            </div>
            <div className="mt-1 font-display text-xl text-ink">
              {"id" in initial ? initial.city : "New place"}
            </div>
          </div>
          <div className="text-right font-mono text-[10px] text-ink-faint">
            {initial.coords[1].toFixed(2)}°{initial.coords[1] >= 0 ? "N" : "S"}
            <br />
            {initial.coords[0].toFixed(2)}°{initial.coords[0] >= 0 ? "E" : "W"}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block text-[10px] uppercase tracking-[0.22em] text-ink-faint">
            <span className="block">City</span>
            <input
              type="text"
              autoFocus
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={NAME_MAX}
              placeholder="e.g. Reykjavík"
              className="mt-1 w-full rounded-sm border border-paper-3 bg-paper-2/60 px-2 py-1.5 text-[13px] normal-case tracking-normal text-ink"
            />
          </label>
          <label className="block text-[10px] uppercase tracking-[0.22em] text-ink-faint">
            <span className="flex items-center gap-2">
              <span>Country</span>
              {autoPending && (
                <span className="text-[9px] italic text-ink-faint">
                  auto-detecting…
                </span>
              )}
            </span>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              maxLength={NAME_MAX}
              placeholder="Auto-filled when you click on land"
              className="mt-1 w-full rounded-sm border border-paper-3 bg-paper-2/60 px-2 py-1.5 text-[13px] normal-case tracking-normal text-ink"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="text-[10px] uppercase tracking-[0.22em] text-ink-faint transition hover:text-amber"
          >
            cancel
          </button>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-md border border-rust/40 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-rust transition hover:bg-rust/10"
              >
                delete
              </button>
            )}
            <button
              type="submit"
              disabled={!city.trim()}
              className="rounded-md border border-amber bg-amber/15 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-amber-deep transition hover:bg-amber/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              save pin
            </button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}

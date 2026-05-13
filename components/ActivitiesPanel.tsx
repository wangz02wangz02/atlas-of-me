"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LEGS, CITIES, MODE_STYLE } from "@/lib/places";

type ActivityKind = "hike" | "bike" | "kayak";

type Activity = {
  id: string;
  kind: ActivityKind;
  city: string;
  /** Optional fields per kind — hike has distance + elevation, bike has
   *  distance, kayak has duration. We accept partials freely so the
   *  user can leave fields blank if they don't know. */
  distanceKm?: number;
  elevationM?: number;
  durationMin?: number;
  note?: string;
  createdAt: number;
};

const LS_KEY = "atlas-activities";

function loadActivities(): Activity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Activity[];
  } catch {
    return [];
  }
}

function saveActivities(list: Activity[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota errors */
  }
}

export default function ActivitiesPanel({ onClose }: { onClose: () => void }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [kind, setKind] = useState<ActivityKind>("hike");
  const [city, setCity] = useState<string>("paris");
  const [distance, setDistance] = useState<string>("");
  const [elevation, setElevation] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [rocketOpen, setRocketOpen] = useState(false);

  useEffect(() => {
    setActivities(loadActivities());
  }, []);

  // City options sorted by stop order so the most-recent feel like top picks
  const cityOptions = useMemo(() => {
    const seq: string[] = [LEGS[0].from, ...LEGS.map((l) => l.to)];
    const seen = new Set<string>();
    const out: { slug: string; name: string }[] = [];
    for (const slug of seq) {
      if (seen.has(slug)) continue;
      seen.add(slug);
      const c = CITIES[slug];
      if (c) out.push({ slug, name: c.name });
    }
    return out;
  }, []);

  const reset = () => {
    setDistance("");
    setElevation("");
    setDuration("");
    setNote("");
  };

  const addActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Activity = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      city,
      createdAt: Date.now(),
    };
    if (distance) next.distanceKm = parseFloat(distance);
    if (elevation) next.elevationM = parseFloat(elevation);
    if (duration) next.durationMin = parseFloat(duration);
    if (note) next.note = note;
    const list = [next, ...activities];
    setActivities(list);
    saveActivities(list);
    reset();
  };

  const removeActivity = (id: string) => {
    const list = activities.filter((a) => a.id !== id);
    setActivities(list);
    saveActivities(list);
  };

  // Aggregate stats — visualization!
  const totalDistance = activities.reduce(
    (s, a) => s + (a.distanceKm ?? 0),
    0,
  );
  const totalElevation = activities.reduce(
    (s, a) => s + (a.elevationM ?? 0),
    0,
  );
  const totalDuration = activities.reduce(
    (s, a) => s + (a.durationMin ?? 0),
    0,
  );
  const byKind = {
    hike: activities.filter((a) => a.kind === "hike").length,
    bike: activities.filter((a) => a.kind === "bike").length,
    kayak: activities.filter((a) => a.kind === "kayak").length,
  };

  return (
    <div className="w-[min(640px,92vw)] max-h-[88vh] overflow-y-auto rounded-lg border border-paper-3 bg-paper/96 p-5 backdrop-blur-md shadow-2xl">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
            Side trips
          </div>
          <div className="mt-1 font-display text-2xl text-ink">
            Activities log
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] uppercase tracking-[0.22em] text-ink-faint transition hover:text-amber"
        >
          ✕ close
        </button>
      </div>

      {/* Aggregate stats row */}
      <div className="mt-4 grid grid-cols-4 gap-3 rounded-md border border-paper-3/60 bg-paper-2/50 p-3">
        <StatTile label="Activities" value={activities.length.toString()} />
        <StatTile
          label="Distance"
          value={totalDistance ? `${totalDistance.toFixed(1)} km` : "—"}
        />
        <StatTile
          label="Climbed"
          value={totalElevation ? `${Math.round(totalElevation)} m` : "—"}
        />
        <StatTile
          label="Time"
          value={
            totalDuration
              ? `${Math.floor(totalDuration / 60)}h ${Math.round(totalDuration % 60)}m`
              : "—"
          }
        />
      </div>

      {/* Form */}
      <form onSubmit={addActivity} className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <KindToggle kind={kind} onChange={setKind} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[10px] uppercase tracking-[0.22em] text-ink-faint">
            <span className="block">City</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-sm border border-paper-3 bg-paper-2/60 px-2 py-1 text-[12px] text-ink"
            >
              {cityOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {kind !== "kayak" && (
            <NumField
              label="Distance (km)"
              value={distance}
              onChange={setDistance}
              placeholder="12.5"
            />
          )}
          {kind === "hike" && (
            <NumField
              label="Elevation gain (m)"
              value={elevation}
              onChange={setElevation}
              placeholder="640"
            />
          )}
          <NumField
            label="Duration (min)"
            value={duration}
            onChange={setDuration}
            placeholder="180"
          />
        </div>
        <label className="block text-[10px] uppercase tracking-[0.22em] text-ink-faint">
          <span className="block">Note (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was it like?"
            className="mt-1 w-full rounded-sm border border-paper-3 bg-paper-2/60 px-2 py-1 text-[12px] normal-case tracking-normal text-ink"
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            className="rounded-md border border-amber bg-amber/15 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-amber-deep transition hover:bg-amber/25"
          >
            + add {kind}
          </button>
          <button
            type="button"
            onClick={() => setRocketOpen(true)}
            className="rounded-md border border-rust/30 bg-rust/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-rust transition hover:bg-rust/10"
          >
            ✦ rocket to mars · reserved
          </button>
        </div>
      </form>

      {/* Activities list */}
      <div className="mt-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
          Logged · {activities.length}
        </div>
        {activities.length === 0 ? (
          <div className="mt-2 rounded-sm border border-dashed border-paper-3 bg-paper-2/30 p-4 text-center text-[11px] italic text-ink-faint">
            No side trips logged yet. Hike up Mont Blanc? Bike around
            Amsterdam? Add it above.
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-paper-3/60 rounded-sm border border-paper-3/60 bg-paper-2/30">
            {activities.map((a) => {
              const c = CITIES[a.city];
              const style = MODE_STYLE[a.kind];
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-3 py-2 text-[11px]"
                >
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: style.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-[13px] text-ink">
                        {style.label} · {c?.name ?? a.city}
                      </span>
                      <span className="font-mono text-[9px] text-ink-faint">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                      {a.distanceKm ? `${a.distanceKm} km` : null}
                      {a.elevationM
                        ? `${a.distanceKm ? " · " : ""}+${a.elevationM} m`
                        : null}
                      {a.durationMin
                        ? `${
                            a.distanceKm || a.elevationM ? " · " : ""
                          }${Math.floor(a.durationMin / 60)}h ${Math.round(
                            a.durationMin % 60,
                          )}m`
                        : null}
                    </div>
                    {a.note && (
                      <div className="text-[11px] italic text-ink-soft">
                        “{a.note}”
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeActivity(a.id)}
                    aria-label="Remove"
                    className="text-[10px] text-ink-faint hover:text-rust"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {rocketOpen && <RocketReservedModal onClose={() => setRocketOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function KindToggle({
  kind,
  onChange,
}: {
  kind: ActivityKind;
  onChange: (k: ActivityKind) => void;
}) {
  const opts: { id: ActivityKind; label: string; glyph: string }[] = [
    { id: "hike", label: "Hike", glyph: "⋀" },
    { id: "bike", label: "Bike", glyph: "⊙" },
    { id: "kayak", label: "Kayak", glyph: "≈" },
  ];
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-paper-3">
      {opts.map((o) => (
        <button
          type="button"
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1 text-[11px] uppercase tracking-[0.22em] transition ${
            kind === o.id
              ? "bg-amber/20 text-amber-deep"
              : "bg-paper-2/40 text-ink-faint hover:text-ink"
          }`}
        >
          <span className="mr-1.5">{o.glyph}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-[10px] uppercase tracking-[0.22em] text-ink-faint">
      <span className="block">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-sm border border-paper-3 bg-paper-2/60 px-2 py-1 text-[12px] normal-case tracking-normal text-ink"
      />
    </label>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-xl text-ink">{value}</div>
      <div className="text-[9px] uppercase tracking-[0.22em] text-ink-faint">
        {label}
      </div>
    </div>
  );
}

function RocketReservedModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      key="rocket-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, scale: 0.94, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 20, scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-[min(440px,92vw)] rounded-lg border-2 border-rust bg-paper p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            ▲
          </span>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-rust/80">
              Reserved · Premium
            </div>
            <div className="font-display text-2xl text-ink">
              Rocket to Mars
            </div>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
          Seven months of low-gravity tea. A view no human has ever
          journaled before. We&apos;re holding your seat on the next launch
          window — but the price tag still has more zeros than feels
          reasonable.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-md border border-rust/30 bg-rust/5 p-3 text-center">
          <div>
            <div className="font-display text-lg text-rust">225M km</div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-ink-faint">
              distance
            </div>
          </div>
          <div>
            <div className="font-display text-lg text-rust">7 mo</div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-ink-faint">
              transit
            </div>
          </div>
          <div>
            <div className="font-display text-lg text-rust">$$$$</div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-ink-faint">
              fare
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.22em] text-ink-faint italic">
            Launch window: 2031
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-paper-3 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-ink hover:border-amber hover:text-amber"
          >
            close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

"use client";

export type Layers = {
  trail: boolean;
  dayNight: boolean;
  clocks: boolean;
  landmarks: boolean;
  heatmap: boolean;
  /** Size multiplier for landmark figurines. 1 = default, 1.5 = comfy,
   *  2 = generous, 2.5 = enormous. */
  landmarkSize: number;
};

const LANDMARK_SIZES: Array<{ value: number; label: string }> = [
  { value: 0.9, label: "S" },
  { value: 1.3, label: "M" },
  { value: 1.7, label: "L" },
  { value: 2.2, label: "XL" },
];

const LAYER_DEFS: Array<{
  key: keyof Layers;
  label: string;
  hint: string;
}> = [
  {
    key: "trail",
    label: "Light trail",
    hint: "Amber filament tracing the journey",
  },
  {
    key: "heatmap",
    label: "Memory heatmap",
    hint: "Tint each country by visits + photos + journal density",
  },
  {
    key: "dayNight",
    label: "Day / night",
    hint: "Soft shading on the side currently in darkness",
  },
  {
    key: "clocks",
    label: "Local clocks",
    hint: "Tiny clock per visited country, in its own time",
  },
  {
    key: "landmarks",
    label: "Landmarks",
    hint: "Hand-drawn icons of each country's most famous sight",
  },
];

export default function LayersPanel({
  layers,
  onChange,
}: {
  layers: Layers;
  onChange: (next: Layers) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
        Map layers
      </div>
      <ul className="space-y-1">
        {LAYER_DEFS.map((def) => {
          const on = layers[def.key];
          return (
            <li key={def.key}>
              <button
                type="button"
                onClick={() => onChange({ ...layers, [def.key]: !on })}
                className="group flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition hover:bg-paper-2"
              >
                <span
                  aria-hidden
                  className={`mt-0.5 grid h-4 w-7 shrink-0 place-items-center rounded-full border transition ${
                    on
                      ? "border-amber bg-amber/30"
                      : "border-paper-3 bg-paper-2"
                  }`}
                >
                  <span
                    className={`block h-3 w-3 rounded-full transition-transform ${
                      on ? "translate-x-1.5 bg-amber" : "-translate-x-1.5 bg-ink-faint/50"
                    }`}
                  />
                </span>
                <span className="flex-1">
                  <span className="block text-sm text-ink">{def.label}</span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-ink-faint">
                    {def.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Landmark size — only meaningful when the Landmarks layer is on,
       *  but the control stays visible so the user can prep size first. */}
      <div className="border-t border-paper-3 pt-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-ink-faint">
          <span>Landmark size</span>
          <span className="font-mono normal-case tracking-normal text-ink">
            ×{layers.landmarkSize.toFixed(1)}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1 rounded-md border border-paper-3 bg-paper-2/40 p-1">
          {LANDMARK_SIZES.map((s) => {
            const active = Math.abs(s.value - layers.landmarkSize) < 0.05;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => onChange({ ...layers, landmarkSize: s.value })}
                className={`rounded-sm py-1 text-[10px] uppercase tracking-[0.22em] transition ${
                  active
                    ? "bg-amber/25 text-amber-deep"
                    : "text-ink-faint hover:bg-paper-2 hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-paper-3 pt-3 text-[10px] text-ink-faint">
        Hover any country for live local time + weather (top-left badge).
      </div>
    </div>
  );
}

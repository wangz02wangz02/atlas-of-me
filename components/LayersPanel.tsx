"use client";

export type Layers = {
  trail: boolean;
  dayNight: boolean;
  clocks: boolean;
  landmarks: boolean;
};

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
      <div className="border-t border-paper-3 pt-3 text-[10px] text-ink-faint">
        Hover any country for live local time + weather (top-left badge).
      </div>
    </div>
  );
}

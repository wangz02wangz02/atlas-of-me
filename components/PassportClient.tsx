"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Stamp = {
  country: string;
  countryCode: string;
  firstStop: number;
  firstDate: string;
  cities: string[];
};

type Page = {
  stop: number;
  date: string;
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  tagline: string;
  photo: { src: string; alt: string } | null;
  altitude?: number;
};

type Props = {
  stamps: Stamp[];
  pages: Page[];
};

const LS_NAME = "atlas-passport-name";
const LS_SIG = "atlas-passport-signature";
const LS_NATIONALITY = "atlas-passport-nationality";

export default function PassportClient({ stamps, pages }: Props) {
  // Editable holder name + signature persisted to localStorage so the user can
  // print or screenshot a customized passport without us needing a backend.
  const [name, setName] = useState("Atlas Holder");
  const [signature, setSignature] = useState("a. holder");
  const [nationality, setNationality] = useState("Citizen of the world");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const n = localStorage.getItem(LS_NAME);
      const s = localStorage.getItem(LS_SIG);
      const na = localStorage.getItem(LS_NATIONALITY);
      if (n) setName(n);
      if (s) setSignature(s);
      if (na) setNationality(na);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LS_NAME, name);
    } catch {
      /* ignore */
    }
  }, [name, mounted]);
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LS_SIG, signature);
    } catch {
      /* ignore */
    }
  }, [signature, mounted]);
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LS_NATIONALITY, nationality);
    } catch {
      /* ignore */
    }
  }, [nationality, mounted]);

  return (
    <div className="passport-root min-h-svh bg-paper text-ink">
      {/* Toolbar (hidden on print) */}
      <div className="passport-toolbar fixed left-4 right-4 top-4 z-10 flex items-center justify-between rounded-md border border-paper-3 bg-paper/90 px-3 py-2 shadow-sm backdrop-blur">
        <Link
          href="/"
          className="text-[11px] uppercase tracking-[0.22em] text-ink-faint hover:text-amber"
        >
          ← Back to map
        </Link>
        <div className="text-[10px] uppercase tracking-[0.32em] text-ink-faint">
          travel passport
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-sm border border-paper-3 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-ink hover:border-amber hover:text-amber"
        >
          Save as PDF
        </button>
      </div>

      {/* Cover */}
      <section className="passport-page mx-auto max-w-3xl px-8 pt-24 pb-16">
        <div className="rounded-md border-2 border-amber-deep bg-[radial-gradient(circle_at_top_right,rgba(182,128,58,0.08),transparent_60%)] p-10">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.45em] text-amber-deep/80">
              Atlas of Me
            </div>
            <div className="mt-2 font-display text-4xl text-ink">
              International Travel Passport
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.32em] text-ink-faint">
              Issued by the Bureau of Wanderings
            </div>
          </div>

          {/* Crest */}
          <div className="my-8 flex justify-center">
            <svg width="80" height="80" viewBox="-40 -40 80 80" aria-hidden>
              <circle r={36} fill="none" stroke="#8c5d22" strokeWidth={2} />
              <circle r={28} fill="none" stroke="#8c5d22" strokeWidth={0.5} />
              <path
                d="M 0 -22 L 0 22 M -22 0 L 22 0"
                stroke="#8c5d22"
                strokeWidth={0.8}
              />
              <circle r={6} fill="none" stroke="#8c5d22" strokeWidth={1.4} />
              <text
                y={5}
                textAnchor="middle"
                fontFamily="serif"
                fontStyle="italic"
                fontSize="10"
                fill="#8c5d22"
              >
                A
              </text>
            </svg>
          </div>

          {/* Photo + identity */}
          <div className="grid grid-cols-[140px_1fr] gap-6">
            <div className="flex aspect-[3/4] items-center justify-center rounded-sm border border-paper-3 bg-paper-2/60 text-center text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              photograph
              <br />
              of holder
            </div>
            <div className="flex flex-col gap-3">
              <Field label="Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="passport-input w-full bg-transparent outline-none"
                  placeholder="Your name"
                />
              </Field>
              <Field label="Nationality">
                <input
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="passport-input w-full bg-transparent outline-none"
                  placeholder="Citizen of the world"
                />
              </Field>
              <Field label="Stamps">
                <span className="text-ink">{stamps.length} countries</span>
              </Field>
              <Field label="Pages">
                <span className="text-ink">{pages.length} entries</span>
              </Field>
              <Field label="Signature">
                <input
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="passport-input w-full bg-transparent font-display italic outline-none"
                  placeholder="Sign here"
                />
              </Field>
            </div>
          </div>

          <div className="mt-10 border-t border-paper-3 pt-3 text-center text-[9px] uppercase tracking-[0.32em] text-ink-faint">
            This passport remains the property of the issuing authority.
          </div>
        </div>
      </section>

      {/* Stamps page */}
      <section className="passport-page mx-auto max-w-4xl px-8 pb-16">
        <div className="mb-6 flex items-baseline justify-between">
          <div className="font-display text-2xl text-ink">Stamps</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
            {stamps.length} entries · one per country
          </div>
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-10 sm:grid-cols-4 lg:grid-cols-5">
          {stamps.map((s, i) => (
            <Stamp key={s.country} stamp={s} index={i} />
          ))}
        </div>
      </section>

      {/* Altitude profile — line chart of elevation over the journey */}
      <section className="passport-page mx-auto max-w-4xl px-8 pb-16">
        <div className="mb-6 flex items-baseline justify-between">
          <div className="font-display text-2xl text-ink">Altitude profile</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
            meters above sea level
          </div>
        </div>
        <AltitudeChart pages={pages} />
      </section>

      {/* Per-city pages */}
      <section className="passport-page mx-auto max-w-4xl px-8 pb-24">
        <div className="mb-6 flex items-baseline justify-between">
          <div className="font-display text-2xl text-ink">Pages</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
            {pages.length} stops · in journey order
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {pages.map((p) => (
            <article
              key={`${p.stop}-${p.slug}`}
              className="page-card flex gap-4 rounded-md border border-paper-3 bg-paper-2/40 p-3"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm border border-paper-3 bg-paper-2">
                {p.photo ? (
                  <Image
                    src={p.photo.src}
                    alt={p.photo.alt}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[9px] uppercase tracking-[0.22em] text-ink-faint">
                    no photo
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-display text-base text-ink">
                    {p.name}
                  </div>
                  <div className="font-mono text-[10px] text-ink-faint">
                    #{p.stop.toString().padStart(3, "0")}
                  </div>
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                  {p.country} · {p.countryCode}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-amber-deep/80">
                  {p.date}
                </div>
                <div className="mt-1 line-clamp-2 text-[12px] italic text-ink-soft">
                  {p.tagline}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <style jsx global>{`
        .passport-input {
          border-bottom: 1px dashed var(--color-paper-3);
          font-size: 14px;
          padding: 2px 0;
        }
        .passport-input:focus {
          border-bottom-color: var(--color-amber);
        }

        @media print {
          .passport-toolbar {
            display: none !important;
          }
          .passport-root {
            background: white !important;
          }
          .passport-page {
            break-after: page;
            page-break-after: always;
          }
          .page-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          body::before {
            display: none !important;
          }
        }
        @page {
          size: A4 portrait;
          margin: 14mm;
        }
      `}</style>
    </div>
  );
}

function AltitudeChart({ pages }: { pages: Page[] }) {
  const valid = pages.filter((p) => typeof p.altitude === "number");
  if (valid.length < 2) {
    return (
      <div className="rounded-md border border-paper-3 bg-paper-2/40 p-6 text-center text-[11px] italic text-ink-faint">
        No altitude data available.
      </div>
    );
  }
  const W = 900;
  const H = 240;
  const padX = 28;
  const padY = 22;
  const altitudes = pages.map((p) =>
    typeof p.altitude === "number" ? p.altitude : 0,
  );
  const maxA = Math.max(20, ...altitudes);
  const minA = Math.min(0, ...altitudes);
  const range = Math.max(1, maxA - minA);
  const n = pages.length;

  const x = (i: number) => padX + (i / Math.max(1, n - 1)) * (W - padX * 2);
  const y = (alt: number) =>
    H - padY - ((alt - minA) / range) * (H - padY * 2);

  // Build polyline
  const points = pages.map((p, i) => [
    x(i),
    y(typeof p.altitude === "number" ? p.altitude : 0),
  ]);
  const pathLine = points
    .map((pt, i) => `${i === 0 ? "M" : "L"}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`)
    .join(" ");
  // Area underneath (filled)
  const pathArea =
    pathLine +
    ` L${points[points.length - 1][0].toFixed(1)},${H - padY} ` +
    ` L${points[0][0].toFixed(1)},${H - padY} Z`;

  // Five y-axis tick lines
  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round(minA + (i / yTicks) * range),
  );

  // Highest point gets a label callout
  let maxIdx = 0;
  for (let i = 1; i < altitudes.length; i++)
    if (altitudes[i] > altitudes[maxIdx]) maxIdx = i;
  const maxCity = pages[maxIdx];

  return (
    <div className="rounded-md border border-paper-3 bg-paper-2/40 p-4">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block">
        <defs>
          <linearGradient id="alt-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#b6803a" stopOpacity={0.32} />
            <stop offset="100%" stopColor="#b6803a" stopOpacity={0.03} />
          </linearGradient>
        </defs>

        {/* y-axis grid */}
        {tickValues.map((v, i) => {
          const yy = y(v);
          return (
            <g key={i}>
              <line
                x1={padX}
                y1={yy}
                x2={W - padX}
                y2={yy}
                stroke="rgba(122,94,52,0.15)"
                strokeWidth={0.5}
                strokeDasharray={i === 0 ? undefined : "2 3"}
              />
              <text
                x={padX - 4}
                y={yy + 3}
                textAnchor="end"
                fontFamily="ui-monospace, monospace"
                fontSize={9}
                fill="#8a8578"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* x-axis stop ticks every 10 stops */}
        {pages
          .filter((_, i) => i % 10 === 0)
          .map((p) => {
            const i = p.stop - 1;
            return (
              <g key={p.stop}>
                <line
                  x1={x(i)}
                  y1={H - padY}
                  x2={x(i)}
                  y2={H - padY + 3}
                  stroke="rgba(122,94,52,0.4)"
                  strokeWidth={0.6}
                />
                <text
                  x={x(i)}
                  y={H - padY + 14}
                  textAnchor="middle"
                  fontFamily="ui-monospace, monospace"
                  fontSize={9}
                  fill="#8a8578"
                >
                  {p.stop}
                </text>
              </g>
            );
          })}

        {/* Area */}
        <path d={pathArea} fill="url(#alt-fill)" />
        {/* Line */}
        <path
          d={pathLine}
          fill="none"
          stroke="#9a4a28"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Highest-point callout */}
        {maxCity && (
          <g>
            <circle
              cx={x(maxIdx)}
              cy={y(altitudes[maxIdx])}
              r={3.5}
              fill="#fff"
              stroke="#9a4a28"
              strokeWidth={1.2}
            />
            <line
              x1={x(maxIdx)}
              y1={y(altitudes[maxIdx]) - 4}
              x2={x(maxIdx)}
              y2={y(altitudes[maxIdx]) - 18}
              stroke="rgba(154,74,40,0.5)"
              strokeWidth={0.6}
            />
            <text
              x={x(maxIdx)}
              y={y(altitudes[maxIdx]) - 22}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
              fontSize={10}
              fill="#9a4a28"
            >
              {maxCity.name} · {altitudes[maxIdx]} m
            </text>
          </g>
        )}
      </svg>
      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-ink-faint">
        <span>stop number →</span>
        <span>
          highest: {altitudes[maxIdx]} m at {maxCity?.name}
        </span>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.32em] text-ink-faint">
        {label}
      </div>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}

function Stamp({ stamp, index }: { stamp: Stamp; index: number }) {
  // Pseudo-random rotation per stamp so the grid looks stamped, not printed.
  const tilt = ((index * 37) % 9) - 4; // -4..+4 degrees
  return (
    <div className="flex flex-col items-center">
      <div
        className="stamp-disc"
        style={{ transform: `rotate(${tilt}deg)` }}
        aria-label={`Stamp for ${stamp.country}`}
      >
        <svg viewBox="-50 -50 100 100" width="100%" height="100%">
          {/* outer ring */}
          <circle r={47} fill="none" stroke="#9a4a28" strokeWidth={1.6} />
          <circle r={43} fill="none" stroke="#9a4a28" strokeWidth={0.6} />
          {/* country code center */}
          <text
            y={3}
            textAnchor="middle"
            fontFamily="ui-serif, Georgia, serif"
            fontWeight="700"
            fontSize="22"
            fill="#9a4a28"
            letterSpacing="1"
          >
            {stamp.countryCode}
          </text>
          {/* stop number */}
          <text
            y={-22}
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize="8"
            fill="#9a4a28"
            letterSpacing="0.5"
          >
            STOP {stamp.firstStop.toString().padStart(3, "0")}
          </text>
          {/* date */}
          <text
            y={30}
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize="7"
            fill="#9a4a28"
            letterSpacing="0.5"
          >
            {stamp.firstDate}
          </text>
          {/* tiny ticks around */}
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const x1 = Math.cos(a) * 39;
            const y1 = Math.sin(a) * 39;
            const x2 = Math.cos(a) * 43;
            const y2 = Math.sin(a) * 43;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#9a4a28"
                strokeWidth={0.5}
              />
            );
          })}
        </svg>
      </div>
      <div className="mt-2 text-center text-[10px] uppercase tracking-[0.18em] text-ink-soft">
        {stamp.country}
      </div>
      {stamp.cities.length > 1 && (
        <div className="text-center text-[9px] italic text-ink-faint">
          +{stamp.cities.length - 1} more {stamp.cities.length === 2 ? "city" : "cities"}
        </div>
      )}
      <style jsx>{`
        .stamp-disc {
          width: 92px;
          height: 92px;
          opacity: 0.92;
          filter: blur(0.2px);
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  src?: string;
  durationLabel?: string;
};

function fmt(t: number): string {
  if (!Number.isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const BAR_COUNT = 48;

export default function AudioPlayer({ src, durationLabel }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Deterministic "fake waveform" — heights vary across the bar set so it
  // looks like a recording. Real waveform analysis would need WebAudio +
  // the actual file; this is decorative for v1.
  const heights = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const a = Math.sin(i * 0.7) * 0.5 + 0.5;
      const b = Math.sin(i * 0.21 + 1.3) * 0.5 + 0.5;
      const c = Math.sin(i * 1.5 + 0.4) * 0.3 + 0.5;
      return Math.max(0.18, Math.min(1, (a + b + c) / 2.4));
    });
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.currentTime);
    const onMeta = () => setDuration(a.duration);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play();
      setPlaying(true);
    }
  };

  const hasAudio = Boolean(src);
  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="rounded-lg border border-paper-3 bg-paper-2/70 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={!hasAudio}
          aria-label={playing ? "Pause audio log" : "Play audio log"}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-amber/40 bg-amber/10 text-amber transition hover:bg-amber/20 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="1" width="3" height="12" rx="0.5" />
              <rect x="9" y="1" width="3" height="12" rx="0.5" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 1.5 L12 7 L3 12.5 Z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            <span>{hasAudio ? "Audio log" : "Voice reflection — coming soon"}</span>
            <span className="font-mono">
              {hasAudio
                ? `${fmt(progress)} / ${fmt(duration)}`
                : durationLabel ?? "—:—"}
            </span>
          </div>

          <div
            className="relative mt-2 flex h-9 w-full items-end gap-[2px]"
            aria-hidden
          >
            {heights.map((h, i) => {
              const barCenterPct = ((i + 0.5) / BAR_COUNT) * 100;
              const isPast = barCenterPct <= pct;
              return (
                <span
                  key={i}
                  className="block flex-1 rounded-[2px]"
                  style={{
                    height: `${Math.round(h * 100)}%`,
                    background: isPast ? "#b6803a" : "#cdc3ad",
                    transition: "background 200ms",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
      {hasAudio && (
        <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      )}
    </div>
  );
}

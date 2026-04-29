"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

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

export default function AudioPlayer({ src, durationLabel }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

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
    <div className="rounded-lg border border-ink-3 bg-ink-2/60 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={!hasAudio}
          aria-label={playing ? "Pause audio log" : "Play audio log"}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-amber/30 bg-amber/10 text-amber transition hover:bg-amber/20 disabled:opacity-30 disabled:cursor-not-allowed"
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
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-bone-dim">
            <span>{hasAudio ? "Audio log" : "Audio coming soon"}</span>
            <span className="font-mono">
              {hasAudio
                ? `${fmt(progress)} / ${fmt(duration)}`
                : durationLabel ?? "—:—"}
            </span>
          </div>
          <div className="relative mt-2 h-[2px] w-full overflow-hidden rounded-full bg-ink-3">
            <motion.div
              className="absolute left-0 top-0 h-full bg-amber"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        </div>
      </div>
      {hasAudio && (
        <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      )}
    </div>
  );
}

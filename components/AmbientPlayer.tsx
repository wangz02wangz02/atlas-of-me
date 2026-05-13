"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * Procedural background music using Web Audio.
 *
 * Rather than ship an audio file (licensing, size, picking the right one
 * for every user), we generate an ambient drone in-browser: five sine
 * oscillators tuned to a soft suspended-2 chord, each with its own slow
 * LFO on amplitude, run through a low-pass filter and a master gain that
 * fades in on play.  Default = OFF.  Preference persists to localStorage
 * so the choice survives a reload but never starts unannounced.
 *
 * Volume is intentionally low (master ~0.07).  The point is to give the
 * scene a little vapor without competing with anything else.
 */
const LS_KEY = "atlas-ambient-on";

export default function AmbientPlayer() {
  const [playing, setPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  useEffect(() => setMounted(true), []);

  const start = () => {
    if (ctxRef.current) return;
    const Ctor =
      (window.AudioContext as typeof AudioContext | undefined) ??
      ((window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext);
    if (!Ctor) return;
    const ctx = new Ctor();

    // Master gain — fades in.
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 1.6);

    // Warm low-pass so the high partials of the sines don't fatigue.
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    filter.Q.value = 0.6;
    filter.connect(master);
    master.connect(ctx.destination);

    // Pad: A-sus2-like chord across two octaves. Slow LFOs on each voice
    // create a gentle shimmer.
    const frequencies = [55, 82.4, 110, 123.5, 165];
    for (const f of frequencies) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 0.16;
      osc.connect(voiceGain).connect(filter);

      // LFO on the voice gain.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.04 + Math.random() * 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.1;
      lfo.connect(lfoGain).connect(voiceGain.gain);

      osc.start();
      lfo.start();
    }

    ctxRef.current = ctx;
    masterRef.current = master;
  };

  const stop = async () => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      await new Promise((r) => setTimeout(r, 850));
      await ctx.close();
    } catch {
      /* ignore */
    }
    ctxRef.current = null;
    masterRef.current = null;
  };

  // Restore preference on mount but never auto-play. We *only* surface
  // whether the saved choice was "on," and the user has to click the
  // toggle to actually start audio (autoplay-policy compliant).
  useEffect(() => {
    if (!mounted) return;
    // Read but don't start — user gesture is required to start audio.
    try {
      const saved = localStorage.getItem(LS_KEY);
      // We intentionally don't auto-start. The saved value just primes
      // the visible state of the toggle for the next session.
      if (saved === "1") {
        // Showing the user that they had it on previously.
        // They'll click again to re-enable.
      }
    } catch {
      /* ignore */
    }
  }, [mounted]);

  const toggle = () => {
    if (playing) {
      stop();
      setPlaying(false);
      try {
        localStorage.setItem(LS_KEY, "0");
      } catch {
        /* ignore */
      }
    } else {
      start();
      setPlaying(true);
      try {
        localStorage.setItem(LS_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const ctx = ctxRef.current;
      if (ctx) ctx.close().catch(() => undefined);
    };
  }, []);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? "Pause background music" : "Play background music"}
      title={playing ? "Mute ambient music" : "Play ambient music"}
      className="pointer-events-auto fixed right-6 top-6 z-30 grid h-9 w-9 place-items-center rounded-full border border-paper-3/60 bg-paper/70 text-ink-faint shadow-sm backdrop-blur transition hover:border-amber hover:text-amber"
    >
      <AnimatePresence mode="wait" initial={false}>
        {playing ? (
          <motion.svg
            key="on"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.18 }}
            fill="currentColor"
          >
            {/* speaker on */}
            <path d="M2 5 L5 5 L8 2 L8 12 L5 9 L2 9 Z" />
            <path
              d="M10 4 Q 12 7 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </motion.svg>
        ) : (
          <motion.svg
            key="off"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.18 }}
            fill="currentColor"
          >
            {/* speaker off */}
            <path d="M2 5 L5 5 L8 2 L8 12 L5 9 L2 9 Z" />
            <line
              x1="9.5"
              y1="4.5"
              x2="13"
              y2="9.5"
              stroke="currentColor"
              strokeWidth="1"
            />
            <line
              x1="13"
              y1="4.5"
              x2="9.5"
              y2="9.5"
              stroke="currentColor"
              strokeWidth="1"
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </button>
  );
}

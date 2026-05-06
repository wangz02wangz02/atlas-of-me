"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

type Photo = { src: string; alt: string };

function tilt(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return ((h % 13) - 6) * 0.9; // ~-5.4..+5.4 deg, deterministic per photo
}

export default function PolaroidGallery({
  photos,
  hasReal,
  placeName,
}: {
  photos: Photo[];
  hasReal: boolean;
  placeName: string;
}) {
  const [open, setOpen] = useState<number | null>(null);

  if (!hasReal || photos.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="relative mx-auto block max-w-[320px]"
            style={{ transform: `rotate(${(i - 1) * 2.4}deg)` }}
          >
            <div className="relative bg-paper p-3 pb-12 shadow-[0_18px_40px_-15px_rgba(60,40,12,0.18)]">
              <div className="flex aspect-square w-full items-center justify-center bg-paper-2">
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
                    {placeName}
                  </div>
                  <div className="mt-1 text-[10px] text-ink-faint/80">
                    coming soon
                  </div>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 truncate text-center font-display text-base italic text-ink/60">
                future memory
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3">
        {photos.map((p, i) => {
          const rot = tilt(p.src);
          return (
            <motion.button
              key={p.src}
              type="button"
              onClick={() => setOpen(i)}
              initial={{ opacity: 0, y: 20, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: rot }}
              whileHover={{ rotate: 0, y: -6, scale: 1.02 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative mx-auto block max-w-[320px]"
              style={{ transformOrigin: "50% 90%" }}
            >
              <span
                aria-hidden
                className="absolute -top-2 left-6 z-10 block h-5 w-12 rounded-sm bg-ink/10"
                style={{ transform: "rotate(-8deg)" }}
              />
              <span
                aria-hidden
                className="absolute -top-2 right-6 z-10 block h-5 w-12 rounded-sm bg-ink/10"
                style={{ transform: "rotate(7deg)" }}
              />
              <div className="relative bg-paper p-3 pb-12 shadow-[0_18px_40px_-15px_rgba(60,40,12,0.25)]">
                <div className="relative aspect-square w-full overflow-hidden bg-paper-2">
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="absolute bottom-3 left-3 right-3 truncate text-center font-display text-base italic text-ink/70">
                  {p.alt}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            key="lightbox"
            className="fixed inset-0 z-50 grid place-items-center bg-ink/85 p-6 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              className="relative flex max-h-[92vh] max-w-[94vw] flex-col items-center"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={photos[open].src}
                alt={photos[open].alt}
                width={1800}
                height={1200}
                sizes="94vw"
                className="block max-h-[88vh] w-auto rounded-lg border border-paper-3 bg-paper object-contain shadow-2xl"
                unoptimized
              />
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="absolute -top-3 -right-3 grid h-9 w-9 place-items-center rounded-full border border-paper-3 bg-paper text-ink hover:text-amber"
              >
                ✕
              </button>
              <div className="mt-3 text-center text-xs italic text-paper">
                {photos[open].alt}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

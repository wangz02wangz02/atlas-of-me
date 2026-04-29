"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

type Photo = { src: string; alt: string };

function tilt(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return ((h % 13) - 6) * 0.9; // ~-5.4 to +5.4 deg, deterministic per photo
}

export default function PolaroidGallery({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);

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
              {/* Tape corners */}
              <span
                aria-hidden
                className="absolute -top-2 left-6 z-10 block h-5 w-12 rounded-sm bg-bone/15"
                style={{ transform: "rotate(-8deg)" }}
              />
              <span
                aria-hidden
                className="absolute -top-2 right-6 z-10 block h-5 w-12 rounded-sm bg-bone/15"
                style={{ transform: "rotate(7deg)" }}
              />
              {/* Polaroid frame */}
              <div className="relative bg-bone p-3 pb-12 shadow-[0_18px_40px_-15px_rgba(0,0,0,0.7)]">
                <div className="relative aspect-square w-full overflow-hidden bg-ink">
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
            className="fixed inset-0 z-50 grid place-items-center bg-ink/90 p-6 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              className="relative max-h-[88vh] w-full max-w-5xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-ink-3">
                <Image
                  src={photos[open].src}
                  alt={photos[open].alt}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="absolute -top-3 -right-3 grid h-9 w-9 place-items-center rounded-full border border-ink-3 bg-ink text-bone hover:text-amber"
              >
                ✕
              </button>
              <div className="mt-3 text-center text-xs italic text-bone-dim">
                {photos[open].alt}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

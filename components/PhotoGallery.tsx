"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

type Photo = { src: string; alt: string };

export default function PhotoGallery({
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-md border border-dashed border-paper-3 bg-paper-2/60"
          >
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
                photographs of {placeName}
              </div>
              <div className="mt-2 text-[11px] text-ink-faint/80">
                coming soon
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p, i) => (
          <motion.button
            key={p.src}
            type="button"
            onClick={() => setOpen(i)}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="group relative block overflow-hidden rounded-md border border-paper-3 bg-paper-2"
          >
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                unoptimized
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper/80 via-transparent to-transparent opacity-70" />
            <div className="absolute bottom-2 left-3 right-3 text-[10px] uppercase tracking-[0.18em] text-ink">
              {p.alt}
            </div>
          </motion.button>
        ))}
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
              className="relative max-h-[88vh] w-full max-w-5xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-paper-3 bg-paper">
                <Image
                  src={photos[open].src}
                  alt={photos[open].alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  unoptimized
                />
              </div>
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

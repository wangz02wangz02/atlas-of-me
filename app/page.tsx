import Link from "next/link";
import { getAllPlaces, getContinents, getStats } from "@/lib/places";
import AtlasExplorer from "@/components/AtlasExplorer";
import Stats from "@/components/Stats";

export default function Home() {
  const places = getAllPlaces();
  const continents = getContinents();
  const stats = getStats();

  return (
    <main>
      <section className="relative px-6 pt-20 pb-12 sm:pt-28">
        <div className="mx-auto max-w-5xl">
          <div className="text-[10px] uppercase tracking-[0.32em] text-amber">
            A travel journal
          </div>
          <h1 className="mt-4 font-display text-6xl leading-[1.02] text-bone sm:text-8xl">
            Atlas <span className="italic text-amber-dim">of</span> Me
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-bone/80">
            A cinematic, interactive map of every place I&rsquo;ve been —
            stitched together with photographs, written reflections, and short
            audio logs. Click any glowing marker to step into a memory.
          </p>
          <div className="mt-8 flex items-center gap-4 text-sm">
            <a
              href="#atlas"
              className="rounded-full border border-amber/50 bg-amber/10 px-5 py-2 text-amber transition hover:bg-amber/20"
            >
              Open the atlas
            </a>
            {places[0] && (
              <Link
                href={`/places/${places[0].slug}`}
                className="text-bone-dim transition hover:text-amber"
              >
                ↳ start with my latest entry
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <Stats stats={stats} />
        </div>
      </section>

      <section id="atlas" className="scroll-mt-12 px-6 pb-24 pt-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h2 className="font-display text-4xl text-bone">The atlas</h2>
            <p className="mt-2 max-w-xl text-sm text-bone-dim">
              Drag to pan, scroll to zoom. Hover a marker for a preview, click
              to enter.
            </p>
          </div>
          <AtlasExplorer places={places} continents={continents} />
        </div>
      </section>

      <footer className="border-t border-ink-3 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-[10px] uppercase tracking-[0.22em] text-bone-dim">
          <span>Atlas of Me · v0.1</span>
          <span>Built with curiosity</span>
        </div>
      </footer>
    </main>
  );
}

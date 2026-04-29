import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPlaces, getPlace } from "@/lib/places";
import PlaceDetailClient from "@/components/PlaceDetailClient";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return getAllPlaces().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = getPlace(slug);
  if (!place) return { title: "Not found — Atlas of Me" };
  return {
    title: `${place.name} — Atlas of Me`,
    description: place.tagline,
  };
}

export default async function PlacePage({ params }: { params: Params }) {
  const { slug } = await params;
  const place = getPlace(slug);
  if (!place) notFound();
  return <PlaceDetailClient place={place} />;
}

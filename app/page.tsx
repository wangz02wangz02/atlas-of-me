import { getAllPlacesWithPhotos } from "@/lib/places-server";
import Stage from "@/components/Stage";

export default function Home() {
  const places = getAllPlacesWithPhotos();
  return <Stage places={places} />;
}

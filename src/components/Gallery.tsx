import RouletteDrum from "./RouletteDrum";
import type { MediaItem } from "@/data/content";

/** Shared by Work (films) and Editorial (photographs). */
export default function Gallery({ items }: { items: MediaItem[] }) {
  return <RouletteDrum items={items} />;
}

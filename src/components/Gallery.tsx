"use client";

import { useState } from "react";
import HorizontalScroller from "./HorizontalScroller";
import VideoOverlay from "./VideoOverlay";
import LoopingVideo from "./LoopingVideo";
import Media from "./Media";
import { ASPECT, type MediaItem } from "@/data/content";

/**
 * Horizontal strip shared by Work (films) and Editorial (photographs).
 * Tiles run full height; width follows each item's aspect ratio.
 */
export default function Gallery({ items }: { items: MediaItem[] }) {
  const [active, setActive] = useState<MediaItem | null>(null);

  return (
    <>
      <HorizontalScroller
        disabled={active !== null}
        className="gap-3 px-6 pt-20 pb-6 md:gap-4 md:px-10 md:pt-20 md:pb-10"
      >
        {items.map((item) => {
          const aspect = item.kind === "video" ? ASPECT[item.format ?? "reel"] : (item.ratio ?? 1.3);

          if (item.kind === "video") {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item)}
                style={{ aspectRatio: aspect }}
                className="group relative h-full shrink-0 cursor-pointer overflow-hidden text-left"
              >
                <LoopingVideo
                  src={item.src}
                  poster={item.poster}
                  className="h-full w-full transition-transform duration-500 group-hover:scale-[1.02]"
                />
                {item.caption && (
                  <span className="absolute bottom-3 left-3 bg-white/85 px-2 py-1 text-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {item.caption}
                  </span>
                )}
              </button>
            );
          }

          return (
            <figure
              key={item.id}
              style={{ aspectRatio: aspect }}
              className="group relative h-full shrink-0"
            >
              <Media
                src={item.src}
                alt={item.caption ?? "Photograph"}
                className="h-full w-full select-none"
              />
              {item.caption && (
                <figcaption className="absolute bottom-3 left-3 bg-white/85 px-2 py-1 text-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {item.caption}
                </figcaption>
              )}
            </figure>
          );
        })}

        <div className="w-6 shrink-0 md:w-10" aria-hidden />
      </HorizontalScroller>

      <VideoOverlay item={active} onClose={() => setActive(null)} />
    </>
  );
}

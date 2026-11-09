"use client";

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { ASPECT, type MediaItem } from "@/data/content";
import { DUCK_EVENT } from "./BackgroundMusic";

type Props = {
  items: MediaItem[]; // videos only
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
};

const aspectOf = (it: MediaItem) => ASPECT[it.format ?? "reel"];

/**
 * Full-screen film preview over a blurred page: the film plays large in the
 * centre, with its neighbours angled away in 3D on either side.
 * Side panels, ‹ › and arrow keys step through; Esc / backdrop closes.
 */
export default function VideoPreview({ items, index, onChange, onClose }: Props) {
  const n = items.length;
  const at = (i: number) => (((i % n) + n) % n);
  const step = useCallback((d: number) => onChange((((index + d) % n) + n) % n), [index, n, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent(DUCK_EVENT, { detail: true }));
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      window.dispatchEvent(new CustomEvent(DUCK_EVENT, { detail: false }));
    };
  }, [onClose, step]);

  const cur = items[index];
  const prev = items[at(index - 1)];
  const next = items[at(index + 1)];

  const side = (it: MediaItem, dir: -1 | 1) => (
    <button
      key={`${it.id}-${dir}`}
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        step(dir);
      }}
      aria-label={`${dir < 0 ? "Previous" : "Next"}: ${it.caption ?? "film"}`}
      style={{
        aspectRatio: aspectOf(it),
        width: `min(${52 * aspectOf(it)}vh, 22vw)`,
        transform: `rotateY(${dir * 38}deg) translateZ(-80px)`,
        transformOrigin: dir < 0 ? "right center" : "left center",
      }}
      className="animate-fade-in hidden shrink-0 cursor-pointer overflow-hidden opacity-80 shadow-2xl transition-opacity hover:opacity-100 md:block"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={it.poster} alt="" draggable={false} className="h-full w-full object-cover" />
    </button>
  );

  // Portal to <body>: the page wrapper's transform animation would otherwise
  // trap this `fixed` overlay inside the content area.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={cur.caption ?? "Film"}
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/30 backdrop-blur-2xl backdrop-saturate-150"
    >
      <button
        type="button"
        onClick={onClose}
        data-cursor="negative"
        aria-label="Close preview"
        className="absolute top-5 right-6 px-2 py-1 text-sm tracking-wide"
      >
        Close
      </button>

      <div
        style={{ perspective: "1600px" }}
        className="flex w-full items-center justify-center gap-6 px-4 md:gap-10"
      >
        {n > 1 && side(prev, -1)}

        <div
          key={cur.id}
          onClick={(e) => e.stopPropagation()}
          // Fit by height, capped by width, keeping the film's own shape.
          style={{ aspectRatio: aspectOf(cur), width: `min(${74 * aspectOf(cur)}vh, var(--maxw))` }}
          className="animate-fade-in shrink-0 overflow-hidden shadow-2xl [--maxw:92vw] md:[--maxw:min(56vw,1100px)]"
        >
          <video
            src={cur.src}
            poster={cur.poster}
            autoPlay
            controls
            loop
            playsInline
            className="h-full w-full bg-black object-cover"
          />
        </div>

        {n > 1 && side(next, 1)}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-5 flex w-full max-w-md items-center justify-between text-sm"
      >
        <button
          type="button"
          onClick={() => step(-1)}
          data-cursor="negative"
          aria-label="Previous film"
          className="flex h-14 w-14 items-center justify-center pb-1.5 text-5xl leading-none font-extralight"
        >
          ‹
        </button>
        <p className="text-foreground/70">
          {cur.caption}
          <span className="ml-3 tabular-nums">
            {index + 1} / {n}
          </span>
        </p>
        <button
          type="button"
          onClick={() => step(1)}
          data-cursor="negative"
          aria-label="Next film"
          className="flex h-14 w-14 items-center justify-center pb-1.5 text-5xl leading-none font-extralight"
        >
          ›
        </button>
      </div>
    </div>,
    document.body,
  );
}

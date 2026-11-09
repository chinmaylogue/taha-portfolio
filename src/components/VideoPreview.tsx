"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { MediaItem } from "@/data/content";
import { DUCK_EVENT } from "./BackgroundMusic";
import RouletteDrum from "./RouletteDrum";

type Props = {
  items: MediaItem[]; // videos only
  index: number;
  onClose: () => void;
};

/**
 * Full-screen film preview over a blurred page: the same 3D roulette drum as
 * the main pages, bigger, spinning in onto the clicked film. The front film
 * plays by itself with no player UI; ‹ ›, arrow keys, swipes and side panels
 * turn the drum. Esc / Close exits.
 */
export default function VideoPreview({ items, index, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent(DUCK_EVENT, { detail: true }));
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      window.dispatchEvent(new CustomEvent(DUCK_EVENT, { detail: false }));
    };
  }, [onClose]);

  // Portal to <body>: the page wrapper's transform animation would otherwise
  // trap this `fixed` overlay inside the content area.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Film preview"
      className="animate-fade-in fixed inset-0 z-50 bg-white/30 backdrop-blur-2xl backdrop-saturate-150"
    >
      <button
        type="button"
        onClick={onClose}
        data-cursor="negative"
        aria-label="Close preview"
        className="absolute top-5 right-6 z-10 px-2 py-1 text-sm tracking-wide"
      >
        Close
      </button>
      <RouletteDrum items={items} startAt={index} inPreview />
    </div>,
    document.body,
  );
}

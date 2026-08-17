"use client";

import { useEffect, useRef } from "react";
import { ASPECT, type MediaItem } from "@/data/content";

type Props = {
  item: MediaItem | null;
  onClose: () => void;
};

export default function VideoOverlay({ item, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !item) return;
    v.currentTime = 0;
    // Browsers block unmuted autoplay in some contexts — fall back rather than stall.
    void v.play().catch(() => {
      v.muted = true;
      void v.play().catch(() => {});
    });
    return () => v.pause();
  }, [item]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.caption ?? "Video"}
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-white/70 p-6 backdrop-blur-xl md:p-14"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close video"
        className="absolute top-6 right-6 text-sm tracking-wide"
      >
        Close
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className={item.format === "wide" ? "w-full max-w-5xl" : "w-full max-w-sm"}
      >
        <video
          ref={videoRef}
          src={item.src}
          poster={item.poster}
          style={{ aspectRatio: ASPECT[item.format ?? "reel"] }}
          controls
          loop
          playsInline
          className="max-h-[82vh] w-full bg-black object-contain shadow-2xl"
        />
        {item.caption && <p className="mt-3 text-sm text-muted">{item.caption}</p>}
      </div>
    </div>
  );
}

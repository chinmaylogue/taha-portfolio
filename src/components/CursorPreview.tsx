"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { NEGATIVE_TARGET } from "./NegativeCursor";

const SIZE = 14; // head radius (px)
const TRAIL = 12; // number of circles in the trail

/**
 * A trail of circles that follows the mouse and reveals the Info page's
 * background through them — a peek at that page.
 * Desktop (fine pointer) only; hidden on /info, where the image is already the backdrop.
 */
export default function CursorPreview() {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const hidden = pathname === "/info";

  useEffect(() => {
    const el = ref.current;
    if (!el || hidden) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const target = { x: -999, y: -999, r: 0 };
    const head = { r: 0 };
    const dots = Array.from({ length: TRAIL }, () => ({ x: -999, y: -999 }));
    let visible = false;
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      // Step aside while the negative lens is on a nav link.
      target.r = (e.target as Element | null)?.closest?.(NEGATIVE_TARGET) ? 0 : SIZE;
      if (!visible) {
        // Start the whole trail at the pointer instead of sliding in from a corner.
        for (const d of dots) {
          d.x = target.x;
          d.y = target.y;
        }
        visible = true;
      }
    };
    const onLeave = () => {
      target.r = 0;
      visible = false;
    };

    const tick = () => {
      head.r += (target.r - head.r) * 0.12;
      // Each circle chases the one ahead of it, so the trail stretches behind fast moves.
      let lead: { x: number; y: number } = target;
      const masks: string[] = [];
      dots.forEach((d, i) => {
        d.x += (lead.x - d.x) * 0.35;
        d.y += (lead.y - d.y) * 0.35;
        lead = d;
        const r = head.r * (1 - i / TRAIL);
        if (r > 0.5) {
          masks.push(
            `radial-gradient(circle ${r.toFixed(1)}px at ${d.x.toFixed(1)}px ${d.y.toFixed(1)}px, #000 98%, transparent 100%)`,
          );
        }
      });
      const mask = masks.length ? masks.join(",") : "linear-gradient(transparent, transparent)";
      el.style.maskImage = mask;
      el.style.webkitMaskImage = mask;
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        maskImage: "linear-gradient(transparent, transparent)",
        WebkitMaskImage: "linear-gradient(transparent, transparent)",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
      className="pointer-events-none fixed inset-0 z-[45] hidden bg-[url('/media/info/info_bg.jpeg')] bg-cover bg-center bg-no-repeat md:block"
    />
  );
}

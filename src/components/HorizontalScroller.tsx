"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Disable wheel hijacking, e.g. while a lightbox is open. */
  disabled?: boolean;
  className?: string;
};

/** Maps vertical wheel/trackpad movement onto horizontal scrolling, with drag-to-pan. */
export default function HorizontalScroller({ children, disabled = false, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const onWheel = (e: WheelEvent) => {
      // Trackpads already send horizontal deltas — leave those alone.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [disabled]);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") el.scrollBy({ left: 400, behavior: "smooth" });
      if (e.key === "ArrowLeft") el.scrollBy({ left: -400, behavior: "smooth" });
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startX = 0;
    let startScroll = 0;
    let dragging = false;

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      el.scrollLeft = startScroll - (e.clientX - startX);
    };
    const up = () => {
      dragging = false;
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`no-scrollbar flex h-full overflow-x-auto overflow-y-hidden ${className}`}
    >
      {children}
    </div>
  );
}

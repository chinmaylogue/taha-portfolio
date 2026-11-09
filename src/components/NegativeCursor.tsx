"use client";

import { useEffect, useRef } from "react";

/** Elements that get the negative lens on hover. */
export const NEGATIVE_TARGET = "[data-cursor='negative']";
const R = 32; // lens radius in px

/** Lens tones: white disc with outlined white text, or black disc with white text. */
const TONES = {
  light: {
    bg: "#fff",
    shadow: "0 0 1px #000, 0.6px 0 0 #000, -0.6px 0 0 #000, 0 0.6px 0 #000, 0 -0.6px 0 #000",
  },
  dark: { bg: "#000", shadow: "none" },
};

/**
 * A white lens that follows the mouse and opens over nav links. Inside it the
 * hovered link is redrawn as a "white negative" — white letters with a dark
 * edge — so the circle stays white on every page while the text flips.
 * The lens is black with white text; add data-cursor-tone="light" to a target
 * for a white lens with outlined white text instead.
 * Desktop (fine pointer) only.
 */
export default function NegativeCursor() {
  const lensRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const lens = lensRef.current;
    const ring = ringRef.current;
    const text = textRef.current;
    if (!lens || !ring || !text) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const target = { x: -999, y: -999, r: 0 };
    const cur = { x: -999, y: -999, r: 0 };
    let seen = false;
    let current: HTMLElement | null = null;
    let frame = 0;

    // Mirror the hovered link's text, font and position inside the lens.
    const mirror = (link: HTMLElement) => {
      const cs = getComputedStyle(link);
      const b = link.getBoundingClientRect();
      const tone = TONES[link.dataset.cursorTone === "light" ? "light" : "dark"];
      lens.style.background = tone.bg;
      text.style.textShadow = tone.shadow;
      text.textContent = link.textContent;
      Object.assign(text.style, {
        left: `${b.left}px`,
        top: `${b.top}px`,
        width: `${b.width}px`,
        height: `${b.height}px`,
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        // Match layout too, so centred glyphs (e.g. the ‹ › arrows) line up.
        display: cs.display === "inline" ? "block" : cs.display,
        alignItems: cs.alignItems,
        justifyContent: cs.justifyContent,
        padding: cs.padding,
        boxSizing: "border-box",
      });
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const link = (e.target as Element | null)?.closest?.<HTMLElement>(NEGATIVE_TARGET) ?? null;
      if (link && link !== current) mirror(link);
      if (link) current = link;
      target.r = link ? R : 0;
      if (!seen) {
        cur.x = target.x;
        cur.y = target.y;
        seen = true;
      }
    };
    const onLeave = () => {
      target.r = 0;
    };

    const tick = () => {
      cur.x += (target.x - cur.x) * 0.3;
      cur.y += (target.y - cur.y) * 0.3;
      cur.r += (target.r - cur.r) * 0.18;
      if (target.r === 0 && cur.r < 0.5) current = null;
      lens.style.clipPath = `circle(${cur.r.toFixed(1)}px at ${cur.x.toFixed(1)}px ${cur.y.toFixed(1)}px)`;
      ring.style.transform = `translate(${(cur.x - R).toFixed(1)}px, ${(cur.y - R).toFixed(1)}px) scale(${(cur.r / R).toFixed(3)})`;
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
  }, []);

  return (
    <>
      {/* Soft edge so the white lens reads on a white page. */}
      <div
        ref={ringRef}
        aria-hidden
        style={{
          width: R * 2,
          height: R * 2,
          transform: "scale(0)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 8px 28px rgba(0,0,0,0.18)",
        }}
        className="pointer-events-none fixed top-0 left-0 z-[46] hidden rounded-full will-change-transform md:block"
      />
      <div
        ref={lensRef}
        aria-hidden
        style={{ clipPath: "circle(0px at -999px -999px)" }}
        className="pointer-events-none fixed inset-0 z-[46] hidden bg-white md:block"
      >
        <span
          ref={textRef}
          style={{
            color: "#fff",
            textShadow:
              "0 0 1px #000, 0.6px 0 0 #000, -0.6px 0 0 #000, 0 0.6px 0 #000, 0 -0.6px 0 #000",
          }}
          className="absolute whitespace-nowrap"
        />
      </div>
    </>
  );
}

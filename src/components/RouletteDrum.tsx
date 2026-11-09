"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/data/content";
import { useSound } from "./BackgroundMusic";
import VideoPreview from "./VideoPreview";

type Props = { items: MediaItem[] };

const SPIN_MS = 2400;
const MIN_TURNS = 2; // full revolutions before landing
const MIN_FACES = 8; // short galleries repeat round the drum so it still reads as a cylinder
const thumb = (item: MediaItem) => (item.kind === "video" ? (item.poster ?? "") : item.src);
// easeOutQuart — fast whip, long glide into the slot.
const ease = (t: number) => 1 - Math.pow(1 - t, 4);

/** Plays a short mechanical tick — a chamber passing the barrel. */
function tick(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(1800, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.03);
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.05);
}

/**
 * Work / Editorial gallery as a 3D revolver drum. It spins in on arrival onto
 * a random chamber; ‹ › (arrow keys, swipe) turn it to the neighbouring one,
 * and clicking a side panel turns it to that panel.
 */
export default function RouletteDrum({ items }: Props) {
  const n = items.length;
  const faces = n * Math.max(1, Math.ceil(MIN_FACES / n));
  const step = 360 / faces;

  const [face, setFace] = useState(0);
  // Index into `videos` while the film preview is open.
  const [preview, setPreview] = useState<number | null>(null);
  const videos = items.filter((it) => it.kind === "video");
  const [spinning, setSpinning] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const stageRef = useRef<HTMLDivElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const rafRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const soundOn = useSound().on;
  const soundRef = useRef(soundOn);
  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  // Face width and drum radius follow the stage size.
  const faceW = size.w * (size.w < 700 ? 0.78 : 0.5);
  const radius = faceW / 2 / Math.tan(Math.PI / faces);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width, h: e.contentRect.height }),
    );
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const paint = useCallback(
    (angle: number, blur = 0) => {
      const drum = drumRef.current;
      if (!drum) return;
      drum.style.transform = `translateZ(${-radius}px) rotateY(${angle}deg)`;
      // Blur goes on each face via a variable: a filter on the drum itself would
      // force it flat (filters disable preserve-3d) and kill the 3D look mid-spin.
      drum.style.setProperty("--blur", blur > 0.3 ? `${blur.toFixed(1)}px` : "0px");
    },
    [radius],
  );

  /** Turn the drum to `to` (deg); calls back once it has locked in. */
  const rotate = useCallback(
    (to: number, done: () => void, duration = SPIN_MS) => {
      const from = angleRef.current;
      const t0 = performance.now();
      let lastSlot = Math.round(from / step);
      let last = from;
      const ctx = soundRef.current ? (audioRef.current ??= new AudioContext()) : null;
      setSpinning(true);

      const frame = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const a = from + (to - from) * ease(p);
        angleRef.current = a;
        paint(a, Math.min(6, Math.abs(a - last) / 4));
        last = a;
        const slot = Math.round(a / step);
        if (slot !== lastSlot) {
          lastSlot = slot;
          if (ctx) tick(ctx);
        }
        if (p < 1) {
          rafRef.current = requestAnimationFrame(frame);
          return;
        }
        paint(to);
        setSpinning(false);
        done();
        // The hammer drops.
        stageRef.current?.animate(
          [{ transform: "scale(0.985)" }, { transform: "scale(1.01)" }, { transform: "scale(1)" }],
          { duration: 320, easing: "ease-out" },
        );
      };
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(frame);
    },
    [paint, step],
  );

  /** Turn the drum `steps` chambers (+ right neighbour, - left) and lock in. */
  const shift = useCallback(
    (steps: number) => {
      if (steps === 0) return;
      const to = Math.round(angleRef.current / step) * step - steps * step;
      const target = (((face + steps) % faces) + faces) % faces;
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      rotate(to, () => setFace(target), still ? 1 : 450 + 150 * Math.min(Math.abs(steps), 4));
    },
    [face, faces, rotate, step],
  );

  // Arrival: drum starts on a random chamber and spins round in 3D onto another.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || !size.w) return;
    opened.current = true;
    const target = Math.floor(Math.random() * faces);
    const to = -target * step;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    angleRef.current = still ? to : to + MIN_TURNS * 360 + step * Math.floor(Math.random() * faces);
    paint(angleRef.current);
    rotate(to, () => setFace(target), still ? 1 : SPIN_MS);
  }, [size.w, faces, step, paint, rotate]);

  // Keep the drum in place when the stage resizes.
  useEffect(() => {
    if (!spinning) paint(angleRef.current);
  }, [paint, spinning]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const go = useCallback(
    (steps: number) => {
      if (spinning || n < 2) return;
      shift(steps);
    },
    [spinning, n, shift],
  );

  useEffect(() => {
    if (preview !== null) return; // the preview owns the keys while open
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, preview]);

  const closePreview = useCallback(() => setPreview(null), []);

  const swipeX = useRef<number | null>(null);
  const item = items[face % n];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Gallery"
      className="flex h-full flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-6 md:px-10 md:pt-24 md:pb-10"
    >
      <div
        ref={stageRef}
        onPointerDown={(e) => (swipeX.current = e.clientX)}
        onPointerUp={(e) => {
          if (swipeX.current === null) return;
          const dx = e.clientX - swipeX.current;
          swipeX.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
        style={{ perspective: `${Math.max(1200, radius * 2.2)}px` }}
        className="relative h-[62vh] w-full max-w-6xl touch-pan-y select-none md:h-[66vh]"
      >
        <div
          ref={drumRef}
          style={{ transformStyle: "preserve-3d" }}
          className="absolute inset-0 will-change-transform"
        >
          {size.w > 0 &&
            Array.from({ length: faces }, (_, f) => {
              const it = items[f % n];
              const live = f === face && !spinning;
              // Which side of the front this face sits on (+ right, - left).
              const rel = ((((f - face) % faces) + faces + faces / 2) % faces) - faces / 2;
              return (
                <div
                  key={f}
                  onClick={
                    rel !== 0
                      ? () => go(rel)
                      : it.kind === "video" && !spinning
                        ? () => setPreview(videos.findIndex((v) => v.id === it.id))
                        : undefined
                  }
                  style={{
                    width: faceW,
                    left: (size.w - faceW) / 2,
                    transform: `rotateY(${f * step}deg) translateZ(${radius}px)`,
                    backfaceVisibility: "hidden",
                    filter: spinning ? "blur(var(--blur, 0px))" : undefined,
                  }}
                  className={`absolute inset-y-0 ${rel !== 0 || it.kind === "video" ? "cursor-pointer" : ""}`}
                >
                  {live && it.kind === "video" ? (
                    <video
                      key={it.id}
                      src={it.src}
                      poster={it.poster}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb(it)}
                      alt={live ? (it.caption ?? "Photograph") : ""}
                      draggable={false}
                      // Films fill their panel (no letterbox bars); photos show whole.
                      className={`h-full w-full ${it.kind === "video" ? "object-cover" : "object-contain"}`}
                    />
                  )}
                </div>
              );
            })}
        </div>
      </div>

      <div
        className="mt-4 flex w-full max-w-md items-center justify-between text-sm"
      >
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={spinning}
          aria-label="Previous"
          data-cursor="negative"
          className="flex h-14 w-14 items-center justify-center pb-1.5 text-5xl leading-none font-extralight disabled:opacity-30"
        >
          ‹
        </button>
        <p className={`text-muted transition-opacity ${spinning ? "opacity-0" : "opacity-100"}`}>
          {item.caption}
          <span className="ml-3 tabular-nums">
            {(face % n) + 1} / {n}
          </span>
        </p>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={spinning}
          aria-label="Next"
          data-cursor="negative"
          className="flex h-14 w-14 items-center justify-center pb-1.5 text-5xl leading-none font-extralight disabled:opacity-30"
        >
          ›
        </button>
      </div>
      {preview !== null && (
        <VideoPreview items={videos} index={preview} onChange={setPreview} onClose={closePreview} />
      )}
    </section>
  );
}

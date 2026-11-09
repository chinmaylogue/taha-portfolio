"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const VOLUME = 0.35;
const STORAGE_KEY = "bg-music-muted";
/** Fired by the video lightbox so the music steps aside while a film plays. */
export const DUCK_EVENT = "bgmusic:duck";

const SoundContext = createContext<{ on: boolean; toggle: () => void }>({
  on: false,
  toggle: () => {},
});

function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Looping ambient soundtrack with an on/off toggle. Browsers block audio until
 * the visitor interacts, so playback starts on the first click/tap/key press.
 */
export default function BackgroundMusic({ src, children }: { src: string; children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ducked, setDucked] = useState(false);

  const fadeTo = useCallback((target: number, onDone?: () => void) => {
    const a = audioRef.current;
    if (!a) return;
    if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
    const from = a.volume;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 800);
      a.volume = from + (target - from) * p;
      if (p < 1) fadeRef.current = requestAnimationFrame(step);
      else onDone?.();
    };
    fadeRef.current = requestAnimationFrame(step);
  }, []);

  const start = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0;
    a.play()
      .then(() => {
        setPlaying(true);
        fadeTo(VOLUME);
      })
      .catch(() => {});
  }, [fadeTo]);

  const stop = () => {
    fadeTo(0, () => audioRef.current?.pause());
    setPlaying(false);
  };

  // Start on first interaction unless the visitor has muted before.
  useEffect(() => {
    if (playing || !src) return;
    const kick = () => {
      if (!readMuted()) start();
    };
    const opts = { once: true } as const;
    window.addEventListener("pointerdown", kick, opts);
    window.addEventListener("keydown", kick, opts);
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, [playing, start, src]);

  // Duck while a video with its own sound is open.
  useEffect(() => {
    const onDuck = (e: Event) => setDucked((e as CustomEvent<boolean>).detail);
    window.addEventListener(DUCK_EVENT, onDuck);
    return () => window.removeEventListener(DUCK_EVENT, onDuck);
  }, []);

  useEffect(() => {
    if (playing) fadeTo(ducked ? 0 : VOLUME);
  }, [ducked, playing, fadeTo]);

  const toggle = () => {
    const mute = playing;
    try {
      localStorage.setItem(STORAGE_KEY, mute ? "1" : "0");
    } catch {}
    if (mute) stop();
    else start();
  };

  return (
    <SoundContext.Provider value={{ on: playing, toggle }}>
      {src && <audio ref={audioRef} src={src} loop preload="auto" />}
      {children}
    </SoundContext.Provider>
  );
}

export const useSound = () => useContext(SoundContext);

/** Speaker icon that switches the background music on/off. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const { on, toggle } = useContext(SoundContext);
  return (
    <button
      type="button"
      // Keep this tap from also triggering the "start on first interaction" listener.
      onPointerDown={(e) => e.stopPropagation()}
      onClick={toggle}
      aria-label={on ? "Mute background music" : "Play background music"}
      aria-pressed={on}
      className={`inline-flex items-center justify-center transition-opacity hover:opacity-60 ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
        {on ? (
          <>
            <path d="M15.5 9a4 4 0 0 1 0 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M18 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </>
        ) : (
          <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}

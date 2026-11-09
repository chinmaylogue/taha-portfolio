"use client";

import { useRef, useState, type ReactNode } from "react";
import type { StorageMode } from "@/lib/cms/store";
import { kindOf, probe, uploadFile } from "./upload";

export const input =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-[13px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 disabled:bg-neutral-100";

export const button =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-2 text-[13px] font-medium text-neutral-900 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50";

export const primaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-neutral-900 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40";

export const iconButton =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent";

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-neutral-700">{label}</span>
      {children}
      {hint && <span className="text-[11px] leading-snug text-neutral-500">{hint}</span>}
    </label>
  );
}

export function Card({ title, description, actions, children }: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4">
        <div>
          <h2 className="text-[14px] font-semibold text-neutral-900">{title}</h2>
          {description && <p className="mt-0.5 text-[12px] text-neutral-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Thumb({ src, kind, className = "" }: { src?: string; kind: "image" | "video"; className?: string }) {
  const base = `shrink-0 overflow-hidden rounded-md bg-neutral-100 ${className}`;
  if (!src) return <div className={`${base} flex items-center justify-center text-[10px] text-neutral-400`}>none</div>;
  if (kind === "video")
    return <video src={src} muted playsInline preload="metadata" className={`${base} object-cover`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" className={`${base} object-cover`} />;
}

export type Uploaded = { url: string; width?: number; height?: number };

/** URL input with an upload button and an inline preview. */
export function MediaField({
  label,
  value,
  onChange,
  onUploaded,
  accept,
  kind,
  storage,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Called with dimensions after an upload, for auto-filling sibling fields. */
  onUploaded?: (u: Uploaded) => void;
  accept: string;
  kind: "image" | "video" | "audio";
  storage: StorageMode;
  hint?: ReactNode;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File) {
    setError(null);
    setProgress(0);
    try {
      const [url, dims] = await Promise.all([uploadFile(file, storage, setProgress), probe(file)]);
      onChange(url);
      onUploaded?.({ url, ...(dims ?? {}) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setProgress(null);
    }
  }

  return (
    <Field label={label} hint={error ? <span className="text-red-600">{error}</span> : hint}>
      <div className="flex items-center gap-2">
        {kind !== "audio" && <Thumb src={value} kind={kind} className="h-9 w-9" />}
        <input
          className={input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or /media/…"
          spellCheck={false}
        />
        <button
          type="button"
          className={`${button} shrink-0`}
          disabled={progress !== null}
          onClick={() => fileRef.current?.click()}
        >
          {progress !== null ? `${Math.round(progress)}%` : "Upload"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) handle(f);
          }}
        />
      </div>
      {kind === "audio" && value && <audio src={value} controls className="mt-1 h-8 w-full" />}
    </Field>
  );
}

export { kindOf };

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaFile, StorageMode } from "@/lib/cms/store";
import { mediaFiles, removeMedia } from "../actions";
import { Card, button, primaryButton } from "./ui";
import { formatBytes, uploadFile } from "./upload";

const isVideo = (name: string) => /\.(mp4|mov|webm|m4v|ogv)$/i.test(name);
const isAudio = (name: string) => /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(name);

/** Everything uploaded through the CMS, with usage flags so nothing live gets deleted. */
export default function MediaLibrary({ storage, usedIn }: { storage: StorageMode; usedIn: string }) {
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await mediaFiles();
    if (res.ok) setFiles(res.data);
    else setError(res.error);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    refresh();
  }, [refresh]);

  async function upload(list: File[]) {
    setError(null);
    for (const [i, f] of list.entries()) {
      try {
        await uploadFile(f, storage, (p) => setProgress((i * 100 + p) / list.length));
      } catch (err) {
        setError(`${f.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      }
    }
    setProgress(null);
    refresh();
  }

  async function remove(f: MediaFile) {
    if (!confirm(`Delete ${f.name} permanently?`)) return;
    const res = await removeMedia(f.url);
    if (res.ok) refresh();
    else setError(res.error);
  }

  return (
    <Card
      title="Media library"
      description={
        storage === "blob"
          ? "Files stored in Vercel Blob."
          : "Files in public/uploads — commit them alongside content/site.json to deploy."
      }
      actions={
        <>
          <button type="button" className={button} onClick={refresh}>
            Refresh
          </button>
          <button
            type="button"
            className={primaryButton}
            disabled={progress !== null}
            onClick={() => fileRef.current?.click()}
          >
            {progress !== null ? `Uploading ${Math.round(progress)}%` : "Upload"}
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            accept="image/*,video/*,audio/*"
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (list.length) upload(list);
            }}
          />
        </>
      }
    >
      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p>
      )}

      {files === null ? (
        <p className="text-[13px] text-neutral-500">Loading…</p>
      ) : files.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 px-6 py-12 text-center text-[13px] text-neutral-500">
          No uploads yet. Files you upload anywhere in the editor show up here.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {files.map((f) => {
            const used = usedIn.includes(f.url);
            return (
              <li key={f.url} className="group overflow-hidden rounded-lg border border-neutral-200 bg-white">
                <div className="relative aspect-square bg-neutral-100">
                  {isVideo(f.name) ? (
                    <video src={f.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  ) : isAudio(f.name) ? (
                    <div className="flex h-full items-center justify-center text-[11px] text-neutral-500">Audio</div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                  {used && (
                    <span className="absolute top-2 left-2 rounded bg-neutral-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      In use
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2 p-2.5">
                  <p className="truncate text-[12px] font-medium text-neutral-900" title={f.name}>
                    {f.name}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {formatBytes(f.size)} · {new Date(f.uploadedAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className={`${button} flex-1 px-2 py-1 text-[11px]`}
                      onClick={async () => {
                        const abs = new URL(f.url, location.origin).toString();
                        await navigator.clipboard.writeText(f.url.startsWith("/") ? f.url : abs);
                        setCopied(f.url);
                        setTimeout(() => setCopied((c) => (c === f.url ? null : c)), 1500);
                      }}
                    >
                      {copied === f.url ? "Copied" : "Copy URL"}
                    </button>
                    <button
                      type="button"
                      className={`${button} px-2 py-1 text-[11px] hover:border-red-300 hover:text-red-600`}
                      disabled={used}
                      title={used ? "Used in the current draft" : "Delete"}
                      onClick={() => remove(f)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

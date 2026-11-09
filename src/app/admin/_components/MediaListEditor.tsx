"use client";

import { useRef, useState } from "react";
import type { MediaItem } from "@/data/content";
import type { StorageMode } from "@/lib/cms/store";
import { Card, Field, MediaField, Thumb, button, iconButton, input, primaryButton } from "./ui";
import { kindOf, probe, uploadFile } from "./upload";

const newId = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const captionFromFile = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

type Props = {
  title: string;
  description: string;
  items: MediaItem[];
  /** Receives an updater so concurrent uploads never patch a stale list. */
  onChange: (update: (items: MediaItem[]) => MediaItem[]) => void;
  defaultKind: "image" | "video";
  storage: StorageMode;
};

export default function MediaListEditor({ title, description, items, onChange, defaultKind, storage }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [pending, setPending] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const bulkRef = useRef<HTMLInputElement>(null);
  const update = (id: string, patch: Partial<MediaItem>) =>
    onChange((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const move = (from: number, to: number) =>
    onChange((list) => {
      if (to < 0 || to >= list.length || from === to) return list;
      const next = [...list];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });

  const remove = (id: string) => onChange((list) => list.filter((it) => it.id !== id));

  const add = () => {
    const it: MediaItem =
      defaultKind === "video"
        ? { id: newId(), kind: "video", src: "", format: "reel", caption: "" }
        : { id: newId(), kind: "image", src: "", ratio: 1.5, caption: "" };
    onChange((list) => [...list, it]);
    setOpen(it.id);
  };

  async function bulkUpload(files: File[]) {
    setErrors([]);
    const fresh = files.map((file) => {
      const kind = kindOf(file);
      const it: MediaItem = {
        id: newId(),
        kind,
        src: "",
        caption: captionFromFile(file.name),
        ...(kind === "video" ? { format: "reel" as const } : { ratio: 1.5 }),
      };
      return { file, it };
    });
    onChange((list) => [...list, ...fresh.map((f) => f.it)]);

    await Promise.all(
      fresh.map(async ({ file, it }) => {
        setPending((p) => ({ ...p, [it.id]: 0 }));
        try {
          const [url, dims] = await Promise.all([
            uploadFile(file, storage, (pct) => setPending((p) => ({ ...p, [it.id]: pct }))),
            probe(file),
          ]);
          update(it.id, { src: url, ...dimsPatch(it.kind, dims) });
        } catch (err) {
          setErrors((e) => [...e, `${file.name}: ${err instanceof Error ? err.message : "upload failed"}`]);
          remove(it.id);
        } finally {
          setPending((p) => {
            const rest = { ...p };
            delete rest[it.id];
            return rest;
          });
        }
      })
    );
  }

  return (
    <Card
      title={title}
      description={`${description} · ${items.length} item${items.length === 1 ? "" : "s"}`}
      actions={
        <>
          <button type="button" className={button} onClick={add}>
            Add item
          </button>
          <button type="button" className={primaryButton} onClick={() => bulkRef.current?.click()}>
            Upload files
          </button>
          <input
            ref={bulkRef}
            type="file"
            multiple
            hidden
            accept={defaultKind === "video" ? "video/*,image/*" : "image/*,video/*"}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (files.length) bulkUpload(files);
            }}
          />
        </>
      }
    >
      {errors.length > 0 && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) e.preventDefault();
        }}
        onDrop={(e) => {
          const files = Array.from(e.dataTransfer.files).filter((f) => /^(image|video)\//.test(f.type));
          if (!files.length) return;
          e.preventDefault();
          bulkUpload(files);
        }}
      >
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 px-6 py-12 text-center text-[13px] text-neutral-500">
            Nothing here yet. Drop files here or use <strong>Upload files</strong>.
          </div>
        ) : (
          <ol className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200">
            {items.map((it, i) => {
              const expanded = open === it.id;
              const uploading = pending[it.id];
              return (
                <li
                  key={it.id}
                  onDragOver={(e) => {
                    if (dragging === null) return;
                    e.preventDefault();
                    if (dragging !== i) {
                      move(dragging, i);
                      setDragging(i);
                    }
                  }}
                  className={`bg-white first:rounded-t-lg last:rounded-b-lg ${dragging === i ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-3 px-3 py-2">
                    <span
                      draggable
                      onDragStart={(e) => {
                        setDragging(i);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => setDragging(null)}
                      className="cursor-grab px-1 text-neutral-400 select-none active:cursor-grabbing"
                      title="Drag to reorder"
                      aria-hidden
                    >
                      ⋮⋮
                    </span>
                    <span className="w-5 text-right text-[11px] text-neutral-400 tabular-nums">{i + 1}</span>
                    <Thumb
                      src={it.kind === "video" ? it.poster || it.src : it.src}
                      kind={it.kind === "video" && !it.poster ? "video" : "image"}
                      className="h-12 w-12"
                    />
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : it.id)}
                      className="flex min-w-0 flex-1 flex-col items-start text-left"
                    >
                      <span className="w-full truncate text-[13px] font-medium text-neutral-900">
                        {it.caption || <span className="text-neutral-400">Untitled</span>}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {uploading !== undefined
                          ? `Uploading… ${Math.round(uploading)}%`
                          : it.kind === "video"
                            ? `Video · ${it.format === "wide" ? "Wide 16:9" : "Reel 9:16"}${it.poster ? "" : " · no poster"}`
                            : `Image · ratio ${it.ratio ?? 1}`}
                        {!it.src && uploading === undefined && <span className="text-red-600"> · missing file</span>}
                      </span>
                    </button>
                    <div className="flex items-center">
                      <button type="button" className={iconButton} onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">
                        ↑
                      </button>
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => move(i, i + 1)}
                        disabled={i === items.length - 1}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => setOpen(expanded ? null : it.id)}
                        aria-label={expanded ? "Collapse" : "Edit"}
                        aria-expanded={expanded}
                      >
                        {expanded ? "▴" : "✎"}
                      </button>
                      <button
                        type="button"
                        className={`${iconButton} hover:text-red-600`}
                        onClick={() => {
                          if (confirm(`Remove "${it.caption || "this item"}"?`)) remove(it.id);
                        }}
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <ItemFields item={it} storage={storage} onChange={(patch) => update(it.id, patch)} />
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Card>
  );
}

function dimsPatch(kind: MediaItem["kind"], dims: { width: number; height: number } | null): Partial<MediaItem> {
  if (!dims || !dims.width || !dims.height) return {};
  return kind === "video"
    ? { format: dims.height > dims.width ? "reel" : "wide" }
    : { ratio: Math.round((dims.width / dims.height) * 1000) / 1000 };
}

function ItemFields({
  item,
  storage,
  onChange,
}: {
  item: MediaItem;
  storage: StorageMode;
  onChange: (patch: Partial<MediaItem>) => void;
}) {
  return (
    <div className="grid gap-4 border-t border-neutral-200 bg-neutral-50 px-4 py-4 md:grid-cols-2">
      <Field label="Caption">
        <input className={input} value={item.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value })} />
      </Field>

      <Field label="Type">
        <select
          className={input}
          value={item.kind}
          onChange={(e) =>
            onChange(
              e.target.value === "video"
                ? { kind: "video", format: item.format ?? "reel", ratio: undefined }
                : { kind: "image", ratio: item.ratio ?? 1.5, format: undefined, poster: undefined }
            )
          }
        >
          <option value="video">Video</option>
          <option value="image">Image</option>
        </select>
      </Field>

      <div className="md:col-span-2">
        <MediaField
          label={item.kind === "video" ? "Video file" : "Image file"}
          value={item.src}
          onChange={(src) => onChange({ src })}
          onUploaded={({ width, height }) =>
            width && height && onChange(dimsPatch(item.kind, { width, height }))
          }
          accept={item.kind === "video" ? "video/*" : "image/*"}
          kind={item.kind}
          storage={storage}
          hint={item.kind === "video" ? "MP4 (H.264) plays everywhere. Format is detected on upload." : "Ratio is detected on upload."}
        />
      </div>

      {item.kind === "video" ? (
        <>
          <div className="md:col-span-2">
            <MediaField
              label="Poster image"
              value={item.poster ?? ""}
              onChange={(poster) => onChange({ poster })}
              accept="image/*"
              kind="image"
              storage={storage}
              hint="Shown on the drum and while the video loads."
            />
          </div>
          <Field label="Format">
            <select
              className={input}
              value={item.format ?? "reel"}
              onChange={(e) => onChange({ format: e.target.value as MediaItem["format"] })}
            >
              <option value="reel">Reel — vertical 9:16</option>
              <option value="wide">Wide — landscape 16:9</option>
            </select>
          </Field>
        </>
      ) : (
        <Field label="Aspect ratio (width ÷ height)" hint="1 = square, 1.5 = 3:2 landscape, 0.8 = 4:5 portrait.">
          <input
            className={input}
            type="number"
            step="0.01"
            min="0.2"
            max="5"
            value={item.ratio ?? 1}
            onChange={(e) => onChange({ ratio: Number(e.target.value) })}
          />
        </Field>
      )}
    </div>
  );
}

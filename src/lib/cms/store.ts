import "server-only";

import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultContent, type SiteContent } from "@/data/content";
import { parseContent } from "./schema";

/**
 * Content + media storage with two backends:
 *
 * - **blob**  — Vercel Blob, used whenever BLOB_READ_WRITE_TOKEN is set. Works on
 *               Vercel's read-only filesystem, so the live site can be edited.
 * - **local** — `content/site.json` and `public/uploads/`, for `next dev` or a
 *               self-hosted server. Commit those files to ship the changes.
 */

export type StorageMode = "blob" | "local";
export const storageMode = (): StorageMode => (process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local");

/** Local mode on Vercel can't write to disk — the admin shows a setup notice instead. */
export const isReadOnly = () => storageMode() === "local" && !!process.env.VERCEL;

const ROOT = process.cwd();
const LOCAL_CONTENT = path.join(ROOT, "content", "site.json");
export const LOCAL_UPLOADS = path.join(ROOT, "public", "uploads");

const BLOB_CONTENT_PREFIX = "cms/content-";
const BLOB_UPLOAD_PREFIX = "uploads/";
const KEEP_VERSIONS = 20;

export type Revision = { url: string; savedAt: string };

/* ------------------------------------------------------------------ content */

async function readBlobContent(): Promise<SiteContent | null> {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: BLOB_CONTENT_PREFIX, limit: 1000 });
  if (!blobs.length) return null;
  // Every save writes a new, immutable file, so the newest one is the live version
  // and CDN caching of any individual file can never serve stale content.
  const latest = blobs.reduce((a, b) => (+new Date(b.uploadedAt) > +new Date(a.uploadedAt) ? b : a));
  const res = await fetch(latest.url);
  if (!res.ok) throw new Error(`Couldn't load content (${res.status})`);
  return parseContent(await res.json());
}

async function readLocalContent(): Promise<SiteContent | null> {
  try {
    return parseContent(JSON.parse(await fs.readFile(LOCAL_CONTENT, "utf8")));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

/** Live site content, de-duplicated per request. Falls back to the seed in `data/content.ts`. */
export const getContent = cache(async (): Promise<SiteContent> => {
  try {
    const stored = storageMode() === "blob" ? await readBlobContent() : await readLocalContent();
    return stored ?? defaultContent;
  } catch (err) {
    console.error("[cms] failed to read content, serving defaults", err);
    return defaultContent;
  }
});

export async function saveContent(input: unknown): Promise<SiteContent> {
  const content = { ...parseContent(input), updatedAt: new Date().toISOString() };
  const json = JSON.stringify(content, null, 2);

  if (storageMode() === "blob") {
    const { put } = await import("@vercel/blob");
    const stamp = content.updatedAt.replace(/[:.]/g, "-");
    await put(`${BLOB_CONTENT_PREFIX}${stamp}.json`, json, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: true,
    });
    pruneRevisions().catch((err) => console.error("[cms] prune failed", err));
  } else {
    if (isReadOnly()) throw new Error("Storage isn't configured for this deployment.");
    await fs.mkdir(path.dirname(LOCAL_CONTENT), { recursive: true });
    await fs.writeFile(LOCAL_CONTENT, json + "\n", "utf8");
  }
  return content;
}

async function pruneRevisions() {
  const { list, del } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: BLOB_CONTENT_PREFIX, limit: 1000 });
  const old = blobs
    .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
    .slice(KEEP_VERSIONS)
    .map((b) => b.url);
  if (old.length) await del(old);
}

/** Previous saves (Blob mode only — local mode relies on git history). */
export async function listRevisions(): Promise<Revision[]> {
  if (storageMode() !== "blob") return [];
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: BLOB_CONTENT_PREFIX, limit: 1000 });
  return blobs
    .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
    .map((b) => ({ url: b.url, savedAt: new Date(b.uploadedAt).toISOString() }));
}

export async function readRevision(url: string): Promise<SiteContent> {
  const revisions = await listRevisions();
  if (!revisions.some((r) => r.url === url)) throw new Error("Unknown revision");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't load revision (${res.status})`);
  return parseContent(await res.json());
}

/* -------------------------------------------------------------------- media */

export type MediaFile = { url: string; name: string; size: number; uploadedAt: string };

export async function listMedia(): Promise<MediaFile[]> {
  if (storageMode() === "blob") {
    const { list } = await import("@vercel/blob");
    const files: MediaFile[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: BLOB_UPLOAD_PREFIX, limit: 1000, cursor });
      for (const b of page.blobs) {
        files.push({
          url: b.url,
          name: b.pathname.slice(BLOB_UPLOAD_PREFIX.length),
          size: b.size,
          uploadedAt: new Date(b.uploadedAt).toISOString(),
        });
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return files.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  let names: string[];
  try {
    names = await fs.readdir(LOCAL_UPLOADS);
  } catch {
    return [];
  }
  const files = await Promise.all(
    names
      .filter((n) => !n.startsWith("."))
      .map(async (name) => {
        const stat = await fs.stat(path.join(LOCAL_UPLOADS, name));
        return { url: `/uploads/${name}`, name, size: stat.size, uploadedAt: stat.mtime.toISOString() };
      })
  );
  return files.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function deleteMedia(url: string): Promise<void> {
  if (storageMode() === "blob") {
    const files = await listMedia();
    if (!files.some((f) => f.url === url)) throw new Error("Not an uploaded file");
    const { del } = await import("@vercel/blob");
    await del(url);
    return;
  }
  if (!url.startsWith("/uploads/")) throw new Error("Not an uploaded file");
  const name = path.basename(url);
  await fs.unlink(path.join(LOCAL_UPLOADS, name));
}

/** `My Shot (final).JPG` → `1731159000000-my-shot-final.jpg` */
export function uploadName(original: string): string {
  const ext = path.extname(original).toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 8);
  const base =
    path
      .basename(original, path.extname(original))
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
  return `${Date.now()}-${base}${ext}`;
}

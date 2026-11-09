"use client";

import type { StorageMode } from "@/lib/cms/store";

export type Progress = (percent: number) => void;

const slug = (name: string) => {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const base =
    (dot > 0 ? name.slice(0, dot) : name)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
  return `${base}${ext}`;
};

/** Uploads one file and resolves with its public URL. */
export async function uploadFile(file: File, mode: StorageMode, onProgress?: Progress): Promise<string> {
  if (mode === "blob") {
    const { upload } = await import("@vercel/blob/client");
    const blob = await upload(`uploads/${Date.now()}-${slug(file.name)}`, file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload",
      contentType: file.type || undefined,
      multipart: file.size > 50 * 1024 * 1024,
      onUploadProgress: ({ percentage }) => onProgress?.(percentage),
    });
    return blob.url;
  }

  // Local: stream the raw file; XHR (not fetch) so we get upload progress.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/admin/upload?name=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.((e.loaded / e.total) * 100);
    xhr.onload = () => {
      let body: { url?: string; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && body.url) resolve(body.url);
      else reject(new Error(body.error || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

/** Natural pixel size of an image or video file, for auto-filling ratio / reel-vs-wide. */
export function probe(file: File): Promise<{ width: number; height: number } | null> {
  const url = URL.createObjectURL(file);
  const done = <T,>(v: T) => {
    URL.revokeObjectURL(url);
    return v;
  };
  return new Promise((resolve) => {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () => resolve(done({ width: img.naturalWidth, height: img.naturalHeight }));
      img.onerror = () => resolve(done(null));
      img.src = url;
    } else if (file.type.startsWith("video/")) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => resolve(done({ width: v.videoWidth, height: v.videoHeight }));
      v.onerror = () => resolve(done(null));
      v.src = url;
    } else {
      resolve(done(null));
    }
  });
}

export const kindOf = (file: File) => (file.type.startsWith("video/") ? "video" : "image");

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

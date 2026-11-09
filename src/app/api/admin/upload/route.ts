import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { isAuthenticated } from "@/lib/cms/auth";
import { LOCAL_UPLOADS, isReadOnly, storageMode, uploadName } from "@/lib/cms/store";

const ALLOWED = ["image/", "video/", "audio/"];
const MAX_BYTES = 1024 * 1024 * 1024; // 1 GB

/**
 * Media uploads.
 *
 * Blob mode: the browser uploads straight to Vercel Blob (bypassing the 4.5 MB
 * function body limit); this route only issues the short-lived upload token,
 * after checking the admin session.
 *
 * Local mode: the raw file body is streamed into public/uploads.
 */
export async function POST(request: Request): Promise<Response> {
  if (storageMode() === "blob") {
    const { handleUpload } = await import("@vercel/blob/client");
    try {
      const body = await request.json();
      const result = await handleUpload({
        request,
        body,
        onBeforeGenerateToken: async (pathname) => {
          if (!(await isAuthenticated())) throw new Error("Unauthorized");
          if (!pathname.startsWith("uploads/")) throw new Error("Invalid upload path");
          return {
            allowedContentTypes: ["image/*", "video/*", "audio/*"],
            maximumSizeInBytes: MAX_BYTES,
            addRandomSuffix: true,
          };
        },
      });
      return Response.json(result);
    } catch (err) {
      return Response.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 400 });
    }
  }

  if (!(await isAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (isReadOnly()) return Response.json({ error: "Storage isn't configured for this deployment." }, { status: 503 });

  const name = new URL(request.url).searchParams.get("name") ?? "file";
  const type = request.headers.get("content-type") ?? "";
  if (!ALLOWED.some((p) => type.startsWith(p))) {
    return Response.json({ error: "Only image, video and audio files can be uploaded." }, { status: 415 });
  }
  if (!request.body) return Response.json({ error: "Empty upload" }, { status: 400 });

  const file = uploadName(name);
  await fs.mkdir(LOCAL_UPLOADS, { recursive: true });
  const dest = path.join(LOCAL_UPLOADS, file);
  try {
    await pipeline(Readable.fromWeb(request.body as unknown as NodeReadableStream), createWriteStream(dest));
  } catch (err) {
    await fs.rm(dest, { force: true });
    throw err;
  }
  return Response.json({ url: `/uploads/${file}` });
}


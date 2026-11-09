"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, endSession, isAdminConfigured, requireAdmin, startSession } from "@/lib/cms/auth";
import * as store from "@/lib/cms/store";
import type { SiteContent } from "@/data/content";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const fail = (err: unknown): { ok: false; error: string } => ({
  ok: false,
  error: err instanceof Error ? err.message : "Something went wrong",
});

/* --------------------------------------------------------------------- auth */

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  if (!isAdminConfigured()) return { error: "Set ADMIN_PASSWORD in your environment to enable the admin." };

  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    // Slow down guessing a little.
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Incorrect password." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ content */

export async function publish(content: SiteContent): Promise<Result<SiteContent>> {
  try {
    await requireAdmin();
    const saved = await store.saveContent(content);
    // Every public page reads from the CMS through the (site) layout.
    revalidatePath("/", "layout");
    return { ok: true, data: saved };
  } catch (err) {
    return fail(err);
  }
}

export async function revisions(): Promise<Result<store.Revision[]>> {
  try {
    await requireAdmin();
    return { ok: true, data: await store.listRevisions() };
  } catch (err) {
    return fail(err);
  }
}

/** Loads an older save into the editor; it only goes live once published again. */
export async function loadRevision(url: string): Promise<Result<SiteContent>> {
  try {
    await requireAdmin();
    return { ok: true, data: await store.readRevision(url) };
  } catch (err) {
    return fail(err);
  }
}

/* -------------------------------------------------------------------- media */

export async function mediaFiles(): Promise<Result<store.MediaFile[]>> {
  try {
    await requireAdmin();
    return { ok: true, data: await store.listMedia() };
  } catch (err) {
    return fail(err);
  }
}

export async function removeMedia(url: string): Promise<Result<null>> {
  try {
    await requireAdmin();
    // Refuse to delete anything the live site still points at.
    const live = JSON.stringify(await store.getContent());
    if (live.includes(JSON.stringify(url).slice(1, -1))) {
      return { ok: false, error: "This file is used on the live site. Remove it from the content and publish first." };
    }
    await store.deleteMedia(url);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

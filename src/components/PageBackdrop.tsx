"use client";

import { usePathname } from "next/navigation";

/**
 * Full-bleed page backgrounds, rendered outside PageTransition's animated
 * wrapper — a finished CSS transform animation leaves Chromium's computed
 * transform as an identity matrix (not `none`), which makes the wrapper a
 * containing block for `fixed` descendants and breaks viewport-relative
 * positioning. Keeping backdrops here avoids that.
 *
 * Work/Editorial will get BackgroundVideo (see that component) once the
 * real background.m3u8 + segments are in place — wire it back in here.
 */
export default function PageBackdrop({ infoBackground }: { infoBackground: string }) {
  const pathname = usePathname();

  if (pathname === "/info" && infoBackground) {
    return (
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${JSON.stringify(infoBackground)})` }}
      />
    );
  }

  return null;
}

"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/** Image that degrades to a neutral placeholder until real assets are dropped into /public/media. */
export default function Media({ src, alt, className = "" }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-200 text-[11px] tracking-wide text-neutral-500 ${className}`}
      >
        {alt}
      </div>
    );
  }

  return (
    // Plain <img>: sizes come from the strip's aspect ratios, not next/image layout.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

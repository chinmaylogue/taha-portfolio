"use client";

import { usePathname } from "next/navigation";

/**
 * Replays the entrance animation on every route change by keying the wrapper
 * on the pathname — React remounts the subtree, so the CSS animation restarts.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-page-in h-full">
      {children}
    </div>
  );
}

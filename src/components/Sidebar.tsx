"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, site } from "@/data/content";
import SocialIcon from "./SocialIcon";

const NAV_ACTIVE_COLOR: Record<string, string> = {
  "/": "text-blue-600",
  "/editorial": "text-red-600",
  "/info": "text-green-600",
};

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onInfo = pathname === "/info";

  return (
    <>
      {/* Mobile: fixed top bar — wordmark left, hamburger right. */}
      <header
        className={`fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between px-6 md:hidden ${
          onInfo ? "bg-transparent text-white" : "bg-background"
        }`}
      >
        <Link href="/" onClick={() => setOpen(false)} className="text-lg font-bold tracking-tight">
          {site.name}
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="-mr-2 flex h-10 w-10 items-center justify-center"
        >
          <span className="relative block h-4 w-6">
            <span
              className={`absolute left-0 block h-px w-6 transition-transform duration-300 ${
                onInfo ? "bg-white" : "bg-foreground"
              } ${open ? "top-2 rotate-45" : "top-0.5"}`}
            />
            <span
              className={`absolute left-0 block h-px w-6 transition-transform duration-300 ${
                onInfo ? "bg-white" : "bg-foreground"
              } ${open ? "top-2 -rotate-45" : "top-3"}`}
            />
          </span>
        </button>
      </header>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-full flex-col px-6 pt-20 pb-6 transition-transform md:w-64 md:translate-x-0 md:px-6 md:pt-36 md:pb-10 ${
          onInfo ? "bg-transparent text-white" : "bg-background"
        } ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div>
          {/* Desktop wordmark; the mobile one lives in the top bar. */}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="hidden text-2xl font-bold tracking-tight md:block"
          >
            {site.name}
          </Link>

          <nav className="flex flex-col gap-0.5 text-[13px] leading-tight md:mt-10">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={
                    active
                      ? NAV_ACTIVE_COLOR[item.href]
                      : onInfo
                        ? "text-white hover:text-white/70"
                        : "text-foreground hover:text-muted"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={`pt-12 text-xs ${onInfo ? "text-white/70" : "text-muted"}`}>
          <p className="max-w-[14rem] leading-relaxed">{site.copyright}</p>
          <ul className={`mt-4 flex gap-4 ${onInfo ? "text-white" : "text-foreground"}`}>
            {site.socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className={`block ${onInfo ? "hover:text-white/70" : "hover:text-muted"}`}
                >
                  <SocialIcon name={s.icon} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}

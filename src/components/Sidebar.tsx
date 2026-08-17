"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, site } from "@/data/content";

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: fixed top bar — wordmark left, hamburger right. */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-background px-6 md:hidden">
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
              className={`absolute left-0 block h-px w-6 bg-foreground transition-transform duration-300 ${
                open ? "top-2 rotate-45" : "top-0.5"
              }`}
            />
            <span
              className={`absolute left-0 block h-px w-6 bg-foreground transition-transform duration-300 ${
                open ? "top-2 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
      </header>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-full flex-col bg-background px-6 pt-20 pb-6 transition-transform md:w-64 md:translate-x-0 md:px-10 md:pt-20 md:pb-10 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Desktop wordmark; the mobile one lives in the top bar. */}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="hidden text-xl font-bold tracking-tight md:block"
          >
            {site.name}
          </Link>

          <nav className="flex flex-col gap-1 text-[15px] md:mt-10">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={active ? "text-accent" : "hover:text-muted"}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-12 text-xs text-muted">
          <p className="max-w-[14rem] leading-relaxed">{site.copyright}</p>
          <ul className="mt-4 flex gap-4 text-foreground">
            {site.socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="hover:text-muted"
                >
                  {s.short}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}

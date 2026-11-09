import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taha Malak — Photographer & Director",
  description: "Selected photography and film work by Taha Malak.",
};

/** Bare document shell — the public site chrome lives in (site)/layout, the CMS in admin/layout. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}

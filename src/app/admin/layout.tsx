import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CMS",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-full overflow-y-auto bg-neutral-50 font-sans">{children}</div>;
}

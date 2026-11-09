import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import PageTransition from "@/components/PageTransition";
import PageBackdrop from "@/components/PageBackdrop";
import BackgroundMusic from "@/components/BackgroundMusic";
import CursorPreview from "@/components/CursorPreview";
import NegativeCursor from "@/components/NegativeCursor";
import { getContent } from "@/lib/cms/store";

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getContent();
  return { title: site.seoTitle, description: site.seoDescription };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { site } = await getContent();

  return (
    <BackgroundMusic src={site.music}>
      <PageBackdrop infoBackground={site.infoBackground} />
      <Sidebar site={site} />
      <main className="h-full md:pl-64">
        <PageTransition>{children}</PageTransition>
      </main>
      <CursorPreview />
      <NegativeCursor />
    </BackgroundMusic>
  );
}

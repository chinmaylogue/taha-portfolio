import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "Taha Malak — Photographer & Director",
  description: "Selected photography and film work by Taha Malak.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <Sidebar />
        <main className="h-full md:pl-64">
          <PageTransition>{children}</PageTransition>
        </main>
      </body>
    </html>
  );
}

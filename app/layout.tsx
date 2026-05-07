import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { SiteFooter } from "@/components/nav/SiteFooter";
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Caz Alumni Connect",
  description:
    "Stay connected with the Cazadero Performing Arts Camp community — find old friends, share memories, and join upcoming alumni events.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <SiteHeader profile={profile} />
        <main className="min-h-[calc(100vh-220px)]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

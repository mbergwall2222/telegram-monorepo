import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/lib/providers";
import { cn } from "@/lib/utils";
import { CookiesProvider } from "next-client-cookies/server";
import { GeistSans } from "geist/font/sans";
import { Navigation } from "@/components/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { PostHogClient } from "./posthog-client";
import { TailwindIndicator } from "@/components/tailwind-indicator";

const lightClerkyTheme = {
  colorPrimary: "",
};
export const metadata: Metadata = {
  title: "X21 - Dashboard",
  description:
    "The X21 Analysis Suite offers advanced data examination capabilities for organizational and analytical teams. It features a dynamic and intuitive interface for a thorough analysis of communication trends and patterns.",
  keywords:
    "Data Analysis, Communication Review, Advanced Analytics, Secure Data Handling, Operational Efficiency, Team Collaboration Interface",
  authors: [{ name: "Matthew Bergwall", url: "https://mattbergwall.com" }],
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full w-full">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={cn("h-full w-full flex flex-col", GeistSans.className)}>
        <CookiesProvider>
          <Providers>
            <PostHogClient />
            <Navigation />
            <main className="w-full flex-1 overflow-auto ">{children}</main>
            <TailwindIndicator />
            <Toaster richColors />
          </Providers>
        </CookiesProvider>
      </body>
    </html>
  );
}

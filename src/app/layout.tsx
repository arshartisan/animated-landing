import type { Metadata } from "next";
import { Geist_Mono, Manrope, Source_Serif_4 } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { ThemeScript } from "@/components/providers/theme";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ONO — Inputs in, approved documents out",
  description: "Automate document intake, review, and approvals end to end.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${serif.variable} ${geistMono.variable} h-full antialiased`}
      // The inline theme script adds `.dark` before hydration.
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}

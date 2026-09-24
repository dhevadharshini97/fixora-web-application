import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "FIXORA — Report. Track. Verify.",
  description:
    "FIXORA is an AI-powered civic intelligence platform. Report civic problems with one photo, AI routes them to the right department, and citizens verify the fix.",
};

export const viewport: Viewport = {
  themeColor: "#1d64f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${space.variable} font-sans bg-[#f4f8fd] text-slate-900 antialiased`}
      >
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}

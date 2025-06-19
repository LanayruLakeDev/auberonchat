import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Auberon Chat - Advanced AI with Consensus Intelligence",
  description: "Revolutionary AI chat platform featuring multi-model consensus, advanced deep thinking capabilities, and intelligent file processing across 20+ cutting-edge AI models.",
  keywords: "AI chat, consensus mode, multi-model AI, artificial intelligence, deep thinking, GPT, Claude, Gemini",
  openGraph: {
    title: "Auberon Chat - Advanced AI with Consensus Intelligence",
    description: "Revolutionary AI chat platform featuring multi-model consensus, advanced deep thinking capabilities, and intelligent file processing across 20+ cutting-edge AI models.",
    type: "website",
    siteName: "Auberon Chat",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auberon Chat - Advanced AI with Consensus Intelligence",
    description: "Revolutionary AI chat platform featuring multi-model consensus, advanced deep thinking capabilities, and intelligent file processing across 20+ cutting-edge AI models.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://cdn.lordicon.com/lordicon.js"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black min-h-screen`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}

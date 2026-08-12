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
  metadataBase: new URL("https://playfantasytcg.com"),

  title: "Fantasy TCG",

  description:
    "Fantasy leagues for competitive Pokémon TCG. Draft real players, set Regional lineups, and earn points based on real tournament results.",

  openGraph: {
    title: "Fantasy TCG",
    description:
      "Draft real competitive Pokémon TCG players and compete against friends based on real tournament results.",
    url: "https://playfantasytcg.com",
    siteName: "Fantasy TCG",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fantasy TCG — Fantasy leagues for competitive Pokémon TCG",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Fantasy TCG",
    description:
      "Draft real competitive Pokémon TCG players and compete based on real tournament results.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
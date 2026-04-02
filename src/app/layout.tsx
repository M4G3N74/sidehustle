import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NextAuthProvider } from "@/components/providers";
import { ToastProvider } from "@/components/ToastContext";



export const metadata: Metadata = {
  title: "streethustler - Track Your Side Hustle Income",
  description: "Track all your side hustle income in one place. Set financial goals, monitor progress, and grow your wealth with beautiful analytics and PDF reports.",
  keywords: ["side hustle tracker", "income tracker", "freelance income", "passive income", "financial goals", "money management", "Zambia income tracker"],
  authors: [{ name: "Purple Unlocker" }],
  metadataBase: new URL('https://streethustler.vercel.app'),
  openGraph: {
    title: "streethustler - Track Your Side Hustle Income",
    description: "Track all your side hustle income in one place. Set financial goals, monitor progress, and grow your wealth.",
    url: "https://streethustler.com",
    siteName: "streethustler",
    locale: "en_ZM",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "streethustler - Side Hustle Income Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "streethustler - Track Your Side Hustle Income",
    description: "Track all your side hustle income in one place. Set goals, monitor progress, grow wealth.",
    images: ["/logo.png"],
    creator: "@purpleunlocker",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/fav.svg",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f0c29",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/fav.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen antialiased font-sans">
        <NextAuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}

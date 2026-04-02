import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NextAuthProvider } from "@/components/providers";
import { ToastProvider } from "@/components/ToastContext";



export const metadata: Metadata = {
  title: "streethustler - Side Hustle Income Tracker",
  description: "Track your side hustle income, set goals, and watch your wealth grow. Beautiful analytics and PDF reports.",
  keywords: ["income tracker", "side hustle", "finance", "money management", "goals"],
  authors: [{ name: "streethustler" }],
  openGraph: {
    title: "streethustler - Side Hustle Income Tracker",
    description: "Track your side hustle income, set goals, and watch your wealth grow.",
    type: "website",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
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

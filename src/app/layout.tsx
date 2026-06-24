import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitAI",
  description: "Registra y analiza tus entrenamientos con inteligencia artificial",
  applicationName: "FitAI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitAI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${geist.className} bg-zinc-950 antialiased`}>{children}</body>
    </html>
  );
}

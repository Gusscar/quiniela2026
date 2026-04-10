import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Header from "@/components/header";
import { AuthListener } from "@/components/auth-listener";
import { PWAInstallPrompt } from "@/components/pwa-install";
import { FloatingAssistant } from "@/components/floating-assistant";
import { BottomNav } from "@/components/bottom-nav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Quiniela Mundial 2026",
  description: "Participa en la quiniela del Mundial de fútbol y compite por el primer lugar",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quiniela ⚽",
  },
  icons: {
    apple: "/icon-192.png",
    icon: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <AuthListener />
          <PWAInstallPrompt />
          <Header />
          <main className="flex-1 pb-14 md:pb-0">{children}</main>
          <BottomNav />
          <FloatingAssistant />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Digital Bleaching Process Log (RF-FR-003, Rev 03)",
  description: "Refinery Department - Lam Soon Edible Oils Sdn Bhd / Nisshin Process Log",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors duration-200 overflow-x-hidden">
        {/* 3D Ambient Background System */}
        <div className="ambient-orb-1" style={{ top: '-10%', left: '-5%' }} aria-hidden="true" />
        <div className="ambient-orb-2" style={{ bottom: '-10%', right: '-5%' }} aria-hidden="true" />
        <div className="grid-mesh-bg" aria-hidden="true" />
        {/* Main Content Layer */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { DemoBanner } from "@/components/DemoBanner";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";
import { config } from "@/lib/config";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["SOFT", "opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://leads.js80.studio"),
  title: {
    default: "JS80 · Tablero de leads",
    template: "%s · JS80",
  },
  description: "Demo pública de gestión de leads de JS80.",
  openGraph: {
    title: "JS80 · Tablero de leads",
    description: "Demo pública de gestión de leads de JS80.",
    url: "https://leads.js80.studio",
    siteName: "JS80",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JS80 · Tablero de leads",
    description: "Demo pública de gestión de leads de JS80.",
  },
  // Demo: noindex hasta que decidamos abrir a buscadores.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0E0E12",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <GlobalShortcuts />
        {config.showDemoBanner && <DemoBanner />}
        {children}
        <Toaster
          position="bottom-right"
          closeButton
          richColors={false}
          toastOptions={{
            classNames: {
              toast:
                "!font-body !text-[12.5px] !bg-panel !text-ink !border !border-line !rounded-lg !shadow-[0_8px_24px_rgba(14,14,18,0.08)]",
              description: "!text-muted !text-[11.5px]",
            },
          }}
        />
      </body>
    </html>
  );
}

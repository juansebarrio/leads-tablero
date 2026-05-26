import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JS80 · Tablero de leads",
  description: "Demo pública de gestión de leads de JS80.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode; // texto plano o JSX (usamos JSX para itálica violeta)
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  // Ancho en desktop. Default 480px (matchea drawers.html).
  widthPx?: number;
}

// Shell genérico para los drawers de la app.
// - Slide-in lateral en desktop (≥768px), full-screen en mobile.
// - Escape cierra.
// - Click en backdrop cierra.
// - Lock de scroll del body mientras está abierto.
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  widthPx = 480,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 bg-[rgba(14,14,18,0.4)] z-[80] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer overlay desde la derecha. Mismo formato en todos los
          breakpoints (no hay agenda sticky en xl, todo es overlay). */}
      <aside
        role="dialog"
        aria-modal
        className={`
          fixed top-0 right-0 h-screen bg-panel z-[81] flex flex-col overflow-hidden
          shadow-[-8px_0_32px_rgba(14,14,18,0.12)]
          transition-transform duration-250 ease-in-out
          w-full md:w-[var(--drawer-w)] md:max-w-full
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
        style={{ ["--drawer-w" as string]: `${widthPx}px` }}
      >
        <header className="px-[18px] py-4 md:px-6 md:pt-[22px] md:pb-[18px] border-b border-line flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div
              className="font-display font-medium text-[19px] md:text-[22px] -tracking-[0.02em] leading-[1.15] text-ink mb-1"
              style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
            >
              {title}
            </div>
            {subtitle && <div className="text-[12px] text-muted">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 border border-line rounded-md flex items-center justify-center text-muted hover:text-ink hover:border-ink cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-[18px] py-[18px] md:px-6 md:py-[22px] flex flex-col gap-4 md:gap-[18px]">
          {children}
        </div>

        {footer && (
          <footer className="px-[18px] py-3.5 md:px-6 md:py-4 border-t border-line bg-panel-2 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-2.5 md:gap-3">
            {footer}
          </footer>
        )}
      </aside>
    </>
  );
}

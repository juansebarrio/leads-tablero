"use client";

import { HelpCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface KPITooltipProps {
  text: string;
  label?: string;
}

// Tooltip chico para aclarar el criterio de un KPI cuando dos vistas miden
// cosas distintas (ej: "Valor cerrado" en /conversion vs /cerrados). Aparece
// al hover (desktop) o tap (mobile/touch). Click fuera o Escape lo cierra.
export function KPITooltip({ text, label = "Cómo se calcula" }: KPITooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="text-muted hover:text-ink-2 transition cursor-help inline-flex items-center justify-center"
      >
        <HelpCircle className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute z-50 right-0 bottom-full mb-1.5 w-[240px] bg-panel border border-line rounded-md shadow-[0_4px_16px_rgba(14,14,18,0.08)] px-3 py-2.5 text-[12px] text-ink-2 leading-[1.45] text-left font-normal normal-case tracking-normal"
        >
          {text}
        </div>
      )}
    </div>
  );
}

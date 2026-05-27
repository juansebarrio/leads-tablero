"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface Props {
  title: React.ReactNode;     // ej: "Lo <em>ganado</em>"
  count: string;              // ej: "11 leads · USD 76.400"
  summary?: React.ReactNode;  // ej: "Mejor cierre: Sofía con USD 28.500"
  defaultOpen?: boolean;
  children: React.ReactNode;
}

// Acordeón cliente: header siempre visible (con summary y count), body
// se colapsa con un toggle. CSS-only animación con max-height.
export function SeccionAcordeon({
  title,
  count,
  summary,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="bg-panel border border-line rounded-[12px] mb-4 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full px-5 py-[22px] md:px-[26px] flex flex-col md:flex-row md:items-baseline justify-between gap-3 md:gap-[14px] cursor-pointer hover:bg-panel-2 transition text-left"
      >
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <h2
            className="font-display font-medium text-[18px] md:text-[22px] -tracking-[0.02em] leading-none text-ink"
            style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
          >
            {title}
          </h2>
          <span className="text-[11.5px] text-muted font-medium">{count}</span>
        </div>
        <div className="flex items-center gap-3 md:gap-[12px] w-full md:w-auto justify-between md:justify-end">
          {summary && (
            <div className="text-[12.5px] text-muted">{summary}</div>
          )}
          <ChevronDown
            className={`w-4 h-4 text-muted transition-transform shrink-0 ${
              open ? "rotate-180" : ""
            }`}
            strokeWidth={2}
          />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-[24px] md:px-[26px] border-t border-line-2">
          {children}
        </div>
      )}
    </section>
  );
}

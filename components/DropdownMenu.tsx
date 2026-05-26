"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

export type DropdownItem =
  | { type: "separator" }
  | {
      type?: "item";
      label: string;
      icon?: LucideIcon;
      onSelect: () => void;
      variant?: "default" | "danger" | "success";
      disabled?: boolean;
    };

interface DropdownMenuProps {
  trigger: (props: {
    open: boolean;
    onClick: () => void;
    ref: React.RefObject<HTMLButtonElement | null>;
  }) => React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

// Dropdown menu simple, sin Radix. Posicionamiento absoluto debajo del
// trigger. Click fuera y Escape cierran.
export function DropdownMenu({
  trigger,
  items,
  align = "right",
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onItemClick = (onSelect: () => void) => {
    setOpen(false);
    // Pequeño delay para que el visual del item registre el click antes
    // de que cierre el menú (más natural).
    setTimeout(onSelect, 0);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      {trigger({
        open,
        onClick: () => setOpen((v) => !v),
        ref: triggerRef,
      })}
      {open && (
        <div
          role="menu"
          className={`absolute top-[calc(100%+4px)] ${
            align === "right" ? "right-0" : "left-0"
          } min-w-[200px] bg-panel border border-line rounded-md shadow-[0_8px_24px_rgba(14,14,18,0.12)] py-1 z-[60]`}
        >
          {items.map((item, i) => {
            if (item.type === "separator") {
              return (
                <div
                  key={`sep-${i}`}
                  className="h-px bg-line-2 my-1"
                  role="separator"
                />
              );
            }
            const Icon = item.icon;
            const colorClass =
              item.variant === "danger"
                ? "text-rojo hover:bg-rojo-soft"
                : item.variant === "success"
                  ? "text-verde hover:bg-verde-soft"
                  : "text-ink-2 hover:bg-panel-2 hover:text-ink";
            return (
              <button
                key={`${item.label}-${i}`}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => onItemClick(item.onSelect)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-left cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed ${colorClass}`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2} />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

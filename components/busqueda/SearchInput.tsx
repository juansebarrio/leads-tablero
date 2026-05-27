"use client";

import { Search } from "lucide-react";
import { forwardRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onEscape: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, Props>(
  function SearchInput({ value, onChange, onEscape }, ref) {
    return (
      <div className="flex items-center gap-3 px-[18px] py-3.5 border-b border-line-2">
        <Search className="w-[18px] h-[18px] text-muted-2 shrink-0" strokeWidth={2} />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onEscape();
            }
          }}
          placeholder="Buscar leads, acciones, comerciales..."
          className="flex-1 bg-transparent border-none outline-none font-body text-[15px] text-ink placeholder:text-muted-2"
          autoFocus
        />
        <span className="bg-panel-2 border border-line px-2 py-[3px] rounded-[4px] font-mono text-[10.5px] text-muted shrink-0">
          esc
        </span>
      </div>
    );
  },
);

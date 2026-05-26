"use client";

import { useDrawers } from "@/components/drawer-context";

export function Backdrop() {
  const { active, closeAll } = useDrawers();
  if (!active) return null;

  return (
    <div
      onClick={closeAll}
      className="fixed inset-0 bg-[rgba(14,14,18,0.4)] z-[80]"
      aria-hidden
    />
  );
}

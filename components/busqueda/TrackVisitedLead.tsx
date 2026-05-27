"use client";

import { useEffect } from "react";
import { useCommandPalette } from "@/components/busqueda/command-palette-context";

// Suma el lead actual al stack de "recientes" del command palette.
// Lo montamos en la ficha del lead.
export function TrackVisitedLead({ leadId }: { leadId: string }) {
  const { pushRecent } = useCommandPalette();
  useEffect(() => {
    if (leadId) pushRecent(leadId);
  }, [leadId, pushRecent]);
  return null;
}

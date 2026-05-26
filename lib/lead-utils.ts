// Helpers compartidos por la ficha de lead.

import type { Estado } from "@/lib/types";

export const ORDEN_ESTADOS: Estado[] = [
  "nuevo",
  "conversacion",
  "propuesta",
  "cierre",
  "ganado",
];

export const ESTADO_LABEL: Record<Estado, string> = {
  nuevo: "Nuevo",
  conversacion: "Conversación",
  propuesta: "Propuesta",
  cierre: "Cierre",
  ganado: "Ganado",
};

export function estadoSiguiente(
  estado: Estado,
): { estado: Estado; label: string } | null {
  const idx = ORDEN_ESTADOS.indexOf(estado);
  if (idx === -1 || idx === ORDEN_ESTADOS.length - 1) return null;
  const next = ORDEN_ESTADOS[idx + 1];
  return { estado: next, label: ESTADO_LABEL[next] };
}

// "ritmo" basado en contactos por día desde la creación del lead.
export type Ritmo = {
  label: string;
  // Token usable en className (text-amarillo / text-muted / text-verde).
  colorClass: string;
};

export function calcularRitmo(
  diasEnPipeline: number,
  cantidadContactos: number,
): Ritmo {
  if (diasEnPipeline <= 0) {
    return { label: "ritmo bueno", colorClass: "text-muted" };
  }
  const ratio = cantidadContactos / diasEnPipeline;
  if (ratio < 0.1) return { label: "ritmo lento", colorClass: "text-amarillo" };
  if (ratio > 0.3) return { label: "ritmo alto", colorClass: "text-verde" };
  return { label: "ritmo bueno", colorClass: "text-muted" };
}

// "28 días" / "1 día"
export function calcularDiasEnPipeline(fechaCreacion: string): number {
  const ms = Date.now() - new Date(fechaCreacion).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

// "hace 10 días" / "hace 1 día" / "hoy"
export function formatFechaRelativa(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (dias <= 0) return "hoy";
  if (dias === 1) return "hace 1 día";
  return `hace ${dias} días`;
}

// "28 de abril" — usa mes corto si el año cambió.
export function formatFechaCorta(iso: string): string {
  const d = new Date(iso);
  const ahora = new Date();
  const mismoAnio = d.getFullYear() === ahora.getFullYear();
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: mismoAnio ? "long" : "short",
    ...(mismoAnio ? {} : { year: "numeric" }),
  });
}

// Slug visible del id: "f174ffa1" (primeros 8 chars del uuid).
export function shortId(uuid: string): string {
  return uuid.replace(/-/g, "").slice(0, 8);
}

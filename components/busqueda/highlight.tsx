import { Fragment, type ReactNode } from "react";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Wrappea las coincidencias del query en un <mark> (estilo amarillo).
// Caso-insensible, conservando el casing original del texto.
export function highlight(text: string, query: string): ReactNode {
  if (!query) return text;
  const q = query.trim();
  if (!q) return text;
  const regex = new RegExp(`(${escapeRegex(q)})`, "ig");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={i}
        className="bg-amarillo-soft text-amarillo px-px rounded-[2px] font-bold"
      >
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

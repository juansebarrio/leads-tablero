import Link from "next/link";
import type { LeadAfectado } from "@/lib/types";

interface Props {
  label: string;
  afectados: LeadAfectado[];
}

// Lista expandible de leads afectados, dentro de la card del patrón.
export function PatronAfectados({ label, afectados }: Props) {
  if (afectados.length === 0) return null;
  return (
    <div className="border-t border-line-2 px-[18px] md:px-[22px] py-[18px] bg-panel-2">
      <div className="text-[10.5px] font-bold tracking-[0.06em] uppercase text-muted mb-2.5">
        {label}
      </div>
      <div className="flex flex-col gap-1.5">
        {afectados.map((a) => (
          <Link
            key={a.id}
            href={`/lead/${a.id}`}
            className="bg-panel border border-line rounded-lg px-3.5 py-2.5 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center text-ink no-underline hover:border-ink-2 hover:translate-x-[2px] transition"
          >
            <div className="font-semibold text-[13px] text-ink truncate">
              {a.nombre}
            </div>
            <div className="hidden md:block text-[11.5px] text-muted">
              {a.meta}
            </div>
            <div className="font-display font-semibold text-[13.5px] -tracking-[0.01em] text-ink text-right">
              USD {a.valor.toLocaleString("es-AR")}
            </div>
            {a.comercial ? (
              <span
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 hidden md:flex"
                style={{ background: a.comercial.avatar_gradient }}
              >
                {a.comercial.iniciales}
              </span>
            ) : (
              <span className="w-[22px] h-[22px] rounded-full bg-line text-muted text-[9px] font-bold shrink-0 border border-dashed border-muted-2 hidden md:flex items-center justify-center">
                ?
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

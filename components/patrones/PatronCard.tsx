import { Check } from "lucide-react";
import Link from "next/link";
import type { LeadAfectado, Patron } from "@/lib/types";
import { MarcarResueltoButton } from "@/components/patrones/MarcarResueltoButton";
import { MiniChart } from "@/components/patrones/MiniChart";
import { PatronAfectados } from "@/components/patrones/PatronAfectados";
import { TIPO_ICONO, TIPO_LABEL, TIPO_STYLE } from "@/components/patrones/iconos";

interface Props {
  patron: Patron;
  afectados: LeadAfectado[];
}

function formatRelativo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (dias <= 0) return "hoy";
  if (dias === 1) return "hace 1 día";
  return `hace ${dias} días`;
}

export function PatronCard({ patron, afectados }: Props) {
  const Icon = TIPO_ICONO[patron.tipo];
  const style = TIPO_STYLE[patron.tipo];
  const resuelto = patron.resuelto_en != null;
  const chart = patron.metadata?.chart;
  const labelCount = patron.metadata?.label_count ?? "Leads afectados";

  // Cuando un patrón está resuelto, el rail izquierdo se pinta de verde
  // (independiente del tipo), todo el card baja opacity y el título
  // se tacha. El icono mantiene su tipo original con tinte verde.
  const railColor = resuelto ? "var(--color-verde)" : style.accent;

  return (
    <article
      className={`relative bg-panel border border-line rounded-xl overflow-hidden transition ${
        resuelto ? "opacity-65" : "hover:border-ink-2 hover:shadow-[0_8px_24px_rgba(14,14,18,0.04)]"
      }`}
    >
      <span
        aria-hidden
        className="absolute top-0 left-0 bottom-0 w-[3px]"
        style={{ background: railColor }}
      />

      <div className="grid grid-cols-[40px_1fr] md:grid-cols-[40px_1fr_auto] gap-3.5 items-start p-[18px] md:px-[22px] md:py-[18px]">
        <div
          className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${
            resuelto ? "bg-verde-soft text-verde" : `${style.iconBg} ${style.iconText}`
          }`}
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>

        <div className="min-w-0">
          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span
              className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-[2px] rounded-full ${
                resuelto ? "bg-verde-soft text-verde" : `${style.chipBg} ${style.chipText}`
              }`}
            >
              {TIPO_LABEL[patron.tipo]}
            </span>
            {resuelto && (
              <span className="inline-flex items-center gap-1 bg-verde-soft text-verde text-[10.5px] font-bold tracking-[0.05em] uppercase px-2 py-[2px] rounded-full">
                <Check className="w-2.5 h-2.5" strokeWidth={3} /> Resuelto
              </span>
            )}
            <span className="text-[11px] text-muted">
              {resuelto
                ? `resuelto ${formatRelativo(patron.resuelto_en!)}${
                    patron.resuelto_por_nombre
                      ? ` por ${patron.resuelto_por_nombre.split(" ")[0]}`
                      : ""
                  }`
                : `detectado ${formatRelativo(patron.detectado_en)}`}
            </span>
          </div>

          {/* Title — admite <strong> */}
          <h3
            className={`font-display font-medium text-[17px] -tracking-[0.015em] leading-[1.25] text-ink mb-1.5 ${
              resuelto ? "line-through decoration-muted-2" : ""
            }`}
            style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
            dangerouslySetInnerHTML={{ __html: patron.titulo }}
          />

          {/* Explainer — admite <strong> */}
          <p
            className="text-[13px] text-ink-2 leading-[1.5] [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: patron.explainer }}
          />

          {/* Chart inline (solo si el patrón lo trae) */}
          {chart && <MiniChart chart={chart} />}
        </div>

        {/* Acciones */}
        <div className="md:flex flex-col gap-1.5 items-end shrink-0 col-span-2 md:col-span-1 mt-3 md:mt-0 grid grid-cols-[1fr_auto] md:grid-cols-1 gap-x-2">
          {patron.accion_label && patron.accion_href && (
            <Link
              href={patron.accion_href}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-[12.5px] font-medium border transition cursor-pointer whitespace-nowrap ${
                resuelto
                  ? "bg-panel border-line text-ink-2 hover:border-ink-2"
                  : "bg-ink border-ink text-white hover:bg-violeta hover:border-violeta"
              }`}
            >
              {patron.accion_label}
            </Link>
          )}
          {!resuelto && <MarcarResueltoButton patronId={patron.id} />}
        </div>
      </div>

      {/* Lista de leads afectados (solo si los hay) */}
      <PatronAfectados label={labelCount} afectados={afectados} />
    </article>
  );
}

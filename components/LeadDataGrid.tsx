import { ChevronRight } from "lucide-react";
import { formatUSD } from "@/lib/format";
import {
  ESTADO_LABEL,
  ORDEN_ESTADOS,
  calcularDiasEnPipeline,
  calcularRitmo,
  estadoSiguiente,
} from "@/lib/lead-utils";
import type { LeadDetalle, TipoNegocio } from "@/lib/types";

interface LeadDataGridProps {
  lead: LeadDetalle;
}

const TIPO_LABEL: Record<TipoNegocio, string> = {
  recurrente: "Recurrente",
  proyecto: "Proyecto",
};

export function LeadDataGrid({ lead }: LeadDataGridProps) {
  const dias = calcularDiasEnPipeline(lead.fecha_creacion);
  const cantidadContactos = lead.contactos.length;
  const ritmo = calcularRitmo(dias, cantidadContactos);
  const siguiente = estadoSiguiente(lead.estado);
  const idxActual = ORDEN_ESTADOS.indexOf(lead.estado);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5 md:gap-3 mb-9">
      {/* Valor estimado */}
      <Card>
        <CardLabel>Valor estimado</CardLabel>
        <CardValue>{formatUSD(lead.valor_estimado)}</CardValue>
        <CardSub>
          {TIPO_LABEL[lead.tipo_negocio]}
          {lead.tipo_negocio === "recurrente" && lead.meses_compromiso && (
            <>
              {" · "}
              <strong className="text-ink-2 font-semibold">
                {lead.meses_compromiso} meses
              </strong>
            </>
          )}
        </CardSub>
      </Card>

      {/* Estado */}
      <Card>
        <CardLabel>Estado</CardLabel>
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-base text-ink">
            {ESTADO_LABEL[lead.estado]}
          </span>
          {siguiente && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-muted-2" strokeWidth={2} />
              <span className="text-[11.5px] text-muted bg-panel-2 px-2 py-0.5 rounded-full border border-line">
                {siguiente.label}
              </span>
            </>
          )}
        </div>
        <div className="flex gap-[3px] mt-3">
          {ORDEN_ESTADOS.map((_, i) => {
            const isCurrent = i === idxActual;
            const isDone = i < idxActual;
            return (
              <span
                key={i}
                className={`flex-1 h-1 rounded-sm ${
                  isCurrent
                    ? "bg-violeta shadow-[0_0_0_2px_var(--color-violeta-soft)]"
                    : isDone
                      ? "bg-violeta"
                      : "bg-line"
                }`}
              />
            );
          })}
        </div>
      </Card>

      {/* En el pipeline */}
      <Card>
        <CardLabel>En el pipeline</CardLabel>
        <CardValue>
          {dias} {dias === 1 ? "día" : "días"}
        </CardValue>
        <CardSub>
          <strong className="text-ink-2 font-semibold">
            {cantidadContactos}{" "}
            {cantidadContactos === 1 ? "contacto" : "contactos"}
          </strong>{" "}
          · <span className={ritmo.colorClass}>{ritmo.label}</span>
        </CardSub>
      </Card>

      {/* Responsable */}
      <Card>
        <CardLabel>Responsable</CardLabel>
        {lead.comerciales ? (
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-[12px] shrink-0"
              style={{ background: lead.comerciales.avatar_gradient }}
            >
              {lead.comerciales.iniciales}
            </div>
            <div className="min-w-0">
              <div
                className="font-display font-semibold text-[17px] leading-tight -tracking-[0.01em] truncate"
                style={{ fontVariationSettings: '"opsz" 144' }}
              >
                {lead.comerciales.nombre}
              </div>
              <div className="text-[11px] text-muted mt-0.5 truncate">
                {lead.comerciales.email}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-line border border-dashed border-muted-2 text-muted flex items-center justify-center font-semibold text-[12px] shrink-0">
              ?
            </div>
            <div
              className="font-display font-semibold text-[17px] leading-tight -tracking-[0.01em] text-ink-2"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              Sin asignar
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-panel border border-line rounded-lg p-4 md:p-[18px] md:px-5 min-w-0">
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] text-muted font-semibold tracking-[0.06em] uppercase mb-2.5">
      {children}
    </div>
  );
}

function CardValue({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-display font-semibold text-[19px] md:text-[22px] -tracking-[0.015em] text-ink leading-[1.15] mb-1"
      style={{ fontVariationSettings: '"opsz" 144' }}
    >
      {children}
    </div>
  );
}

function CardSub({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] text-muted mt-0.5">{children}</div>;
}

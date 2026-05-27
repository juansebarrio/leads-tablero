import type { MotivoPerdida, MotivoPerdidaAgg } from "@/lib/types";

interface Props {
  motivos: MotivoPerdidaAgg[];
}

const MOTIVO_LABEL: Record<MotivoPerdida, string> = {
  precio: "Precio",
  timing: "Timing",
  competencia: "Competencia",
  no_respondio: "No respondió",
  cambio_necesidad: "Cambio de necesidad",
  otro: "Otro",
};

// Color del fill por motivo. Reusa el sistema; los semánticos hablan solos
// (rojo precio, amarillo timing, azul competencia).
const MOTIVO_FILL: Record<MotivoPerdida, string> = {
  precio: "var(--color-rojo)",
  timing: "var(--color-amarillo)",
  competencia: "var(--color-azul)",
  no_respondio: "var(--color-muted)",
  cambio_necesidad: "var(--color-violeta)",
  otro: "var(--color-muted-2)",
};

// Banda fija de 3 slots: si hay menos motivos, llenamos con placeholder.
export function MotivosStrip({ motivos }: Props) {
  const top3 = motivos.slice(0, 3);
  // Slots restantes con un placeholder neutro.
  const placeholders = Array.from({ length: Math.max(0, 3 - top3.length) });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 py-5">
      {top3.map((m, i) => (
        <MotivoCard key={m.motivo} motivo={m} posicion={i + 1} />
      ))}
      {placeholders.map((_, i) => (
        <PlaceholderCard key={`ph-${i}`} posicion={top3.length + i + 1} />
      ))}
    </div>
  );
}

function MotivoCard({
  motivo,
  posicion,
}: {
  motivo: MotivoPerdidaAgg;
  posicion: number;
}) {
  return (
    <div className="bg-panel-2 border border-line rounded-[10px] p-[16px] px-[18px]">
      <div
        className="font-display font-semibold text-[13px] text-muted mb-1.5"
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        {posicion}º motivo
      </div>
      <div
        className="font-display font-medium text-[17px] text-ink -tracking-[0.01em] leading-tight mb-2"
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        {MOTIVO_LABEL[motivo.motivo]}
      </div>
      <div className="h-[5px] bg-line rounded-[3px] overflow-hidden mb-1.5">
        <div
          className="h-full rounded-[3px]"
          style={{
            width: `${motivo.porcentaje}%`,
            background: MOTIVO_FILL[motivo.motivo],
          }}
        />
      </div>
      <div className="flex justify-between text-[11.5px] text-muted">
        <span>
          <strong className="font-display font-semibold text-ink">
            {motivo.cantidad}
          </strong>{" "}
          {motivo.cantidad === 1 ? "lead" : "leads"}
        </span>
        <span>
          {motivo.porcentaje}% · USD {motivo.valor_total.toLocaleString("es-AR")}
        </span>
      </div>
    </div>
  );
}

function PlaceholderCard({ posicion }: { posicion: number }) {
  return (
    <div className="bg-panel-2 border border-line border-dashed rounded-[10px] p-[16px] px-[18px] opacity-50">
      <div
        className="font-display font-semibold text-[13px] text-muted mb-1.5"
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        {posicion}º motivo
      </div>
      <div className="font-display font-medium text-[17px] text-muted-2 -tracking-[0.01em] leading-tight mb-2">
        —
      </div>
      <div className="h-[5px] bg-line rounded-[3px] mb-1.5" />
      <div className="flex justify-between text-[11.5px] text-muted-2">
        <span>0 leads</span>
        <span>—</span>
      </div>
    </div>
  );
}

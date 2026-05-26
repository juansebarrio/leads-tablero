import { Plus } from "lucide-react";
import { ExportarTrigger } from "@/components/ExportarTrigger";
import { formatEyebrowFecha, saludoSegunHora } from "@/lib/format";

interface DashboardHeroProps {
  nombreComercial: string;
  cantidadFrios: number;
  cantidadReuniones: number;
  // Slots para botones de acción del hero. El orden visual de izq a der:
  // agenda → exportar → nuevo lead.
  agendaTrigger?: React.ReactNode;
  nuevoLeadTrigger?: React.ReactNode;
}

export function DashboardHero({
  nombreComercial,
  cantidadFrios,
  cantidadReuniones,
  agendaTrigger,
  nuevoLeadTrigger,
}: DashboardHeroProps) {
  const ahora = new Date();

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-6 mb-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted mb-2">
          {formatEyebrowFecha(ahora)}
        </div>
        <h1
          className="font-display text-[26px] md:text-4xl xl:text-[36px] font-medium tracking-tight text-ink leading-[1.1] text-balance"
          style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
        >
          Hola {nombreComercial},{" "}
          <em className="italic text-violeta font-medium">
            {saludoSegunHora(ahora)}
          </em>
          .
        </h1>
        <p className="text-[13.5px] text-muted mt-2 max-w-[480px] text-pretty">
          Tenés{" "}
          <strong className="text-ink-2 font-semibold">
            {cantidadFrios} leads
          </strong>{" "}
          que pidieron seguimiento y{" "}
          <strong className="text-ink-2 font-semibold">
            {cantidadReuniones} reuniones
          </strong>{" "}
          en agenda. Empezamos por lo que se enfría.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0 md:mt-6 flex-wrap">
        {agendaTrigger}
        <ExportarTrigger />
        {nuevoLeadTrigger ?? (
          <button
            type="button"
            className="flex-1 md:flex-none border border-ink bg-ink text-white px-3.5 py-2 rounded-md font-medium text-[12.5px] hover:bg-violeta hover:border-violeta inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
            Nuevo lead
          </button>
        )}
      </div>
    </div>
  );
}

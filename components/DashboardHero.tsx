import { Download, Plus } from "lucide-react";
import { formatEyebrowFecha, saludoSegunHora } from "@/lib/format";

interface DashboardHeroProps {
  nombreComercial: string;
  cantidadFrios: number;
  cantidadReuniones: number;
  // Slot para el botón "Tu día" que aparece en mobile/tablet y abre el drawer.
  agendaTrigger?: React.ReactNode;
  // Slot para el botón "Nuevo lead" que abre el drawer correspondiente.
  // Si no se pasa, se muestra un botón estático (modo demo sin acciones).
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
          className="font-display text-[26px] md:text-4xl xl:text-[36px] font-medium tracking-tight text-ink leading-[1.1]"
          style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
        >
          Hola {nombreComercial},{" "}
          <em className="italic text-violeta font-medium">
            {saludoSegunHora(ahora)}
          </em>
          .
        </h1>
        <p className="text-[13.5px] text-muted mt-2 max-w-[480px]">
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
        <button
          type="button"
          className="flex-1 md:flex-none border border-line bg-panel text-ink-2 px-3.5 py-2 rounded-md font-medium text-[12.5px] hover:border-ink-2 inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" strokeWidth={2} />
          Exportar
        </button>
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

import { Nucleus } from "@/components/Nucleus";
import type { PatronIa } from "@/lib/types";

interface AIInsightProps {
  pattern: PatronIa;
}

// Por ahora solo manejamos el patrón "asignacion_pendiente".
// Cuando sumemos más patrones, este componente decide qué copy mostrar.
export function AIInsight({ pattern }: AIInsightProps) {
  if (pattern.patron !== "asignacion_pendiente") return null;

  const desde = new Date(pattern.desde).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  });
  const hasta = new Date(pattern.hasta).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  });

  return (
    <div
      className="border rounded-lg p-4 md:p-5 mb-8 grid gap-3 md:grid-cols-[auto_1fr_auto] md:gap-4 items-center"
      style={{
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #F7F4FF 100%)",
        borderColor: "#E0D5FF",
      }}
    >
      <Nucleus size={34} />
      <div className="text-[13px] text-ink-2 leading-relaxed">
        <span className="block text-[10.5px] text-violeta font-bold tracking-[0.08em] uppercase mb-1">
          Patrón detectado
        </span>
        {pattern.cantidad} leads del formulario web entre el {desde} y {hasta}{" "}
        siguen sin asignar comercial. El cuello no es de seguimiento, es de{" "}
        <strong className="font-semibold text-ink">
          asignación automática
        </strong>
        .
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <button
          type="button"
          className="flex-1 md:flex-none bg-panel border border-line text-ink-2 px-3 py-2 rounded-md font-medium text-[12px] hover:border-violeta hover:text-violeta transition cursor-pointer whitespace-nowrap"
        >
          Ver los {pattern.cantidad}
        </button>
        <button
          type="button"
          className="flex-1 md:flex-none bg-violeta border border-violeta text-white px-3 py-2 rounded-md font-medium text-[12px] hover:opacity-90 transition cursor-pointer whitespace-nowrap"
        >
          Revisar regla
        </button>
      </div>
    </div>
  );
}

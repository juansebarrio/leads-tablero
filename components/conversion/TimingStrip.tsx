import type { CuelloEtapa } from "@/lib/insights";
import type { TimingItem } from "@/lib/types";

interface TimingStripProps {
  timing: TimingItem[];
  cuello: CuelloEtapa | null;
}

// Las 4 transiciones esperadas, en orden. Si no hay data, mostramos "—".
const TRANSICIONES: Array<{
  cuello: CuelloEtapa;
  label: string;
  sub: string;
  from: string;
  to: string;
}> = [
  {
    cuello: "nuevo_a_conv",
    label: "Nuevos → Conv.",
    sub: "desde el ingreso",
    from: "inicio",
    to: "conversacion",
  },
  {
    cuello: "conv_a_prop",
    label: "Conv. → Prop.",
    sub: "de discovery",
    from: "conversacion",
    to: "propuesta",
  },
  {
    cuello: "prop_a_cierre",
    label: "Prop. → Cierre",
    sub: "tiempo en propuesta",
    from: "propuesta",
    to: "cierre",
  },
  {
    cuello: "cierre_a_ganado",
    label: "Cierre → Ganado",
    sub: "para firmar",
    from: "cierre",
    to: "ganado",
  },
];

export function TimingStrip({ timing, cuello }: TimingStripProps) {
  const totalDias = TRANSICIONES.reduce((acc, t) => {
    const item = timing.find(
      (x) => x.estado_from === t.from && x.estado_to === t.to,
    );
    return acc + (item?.dias_promedio ?? 0);
  }, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3.5">
      {TRANSICIONES.map((t) => {
        const item = timing.find(
          (x) => x.estado_from === t.from && x.estado_to === t.to,
        );
        const dias = item?.dias_promedio ?? null;
        const isCuello = cuello === t.cuello;
        return (
          <Item
            key={t.cuello}
            label={t.label}
            value={dias === null ? "—" : `${dias} ${dias === 1 ? "día" : "días"}`}
            sub={isCuello ? "aquí se atascan" : t.sub}
            cuello={isCuello}
          />
        );
      })}
      <Item
        label="Total promedio"
        value={`${totalDias} días`}
        sub="de cierre completo"
      />
    </div>
  );
}

function Item({
  label,
  value,
  sub,
  cuello = false,
}: {
  label: string;
  value: string;
  sub: string;
  cuello?: boolean;
}) {
  return (
    <div
      className={`text-center p-3 md:p-3.5 border rounded-lg ${
        cuello
          ? "bg-amarillo-soft border-[#EBD9A1]"
          : "bg-panel-2 border-line-2"
      }`}
    >
      <div
        className={`text-[10.5px] font-semibold tracking-[0.04em] uppercase mb-1.5 ${cuello ? "text-amarillo" : "text-muted"}`}
      >
        {label}
      </div>
      <div
        className={`font-display font-semibold text-[18px] md:text-[20px] xl:text-[22px] -tracking-[0.015em] leading-none ${cuello ? "text-amarillo" : "text-ink"}`}
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted mt-1.5">{sub}</div>
    </div>
  );
}

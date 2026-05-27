import type { PatronesStats as Stats } from "@/lib/types";

interface Props {
  stats: Stats;
}

// Banda de 3 stats arriba de la pantalla /patrones.
export function PatronesStats({ stats }: Props) {
  const items: { kind: "detectados" | "resueltos" | "juego"; label: string; valor: React.ReactNode; sub: string }[] = [
    {
      kind: "detectados",
      label: "Detectados",
      valor: (
        <>
          <strong className="text-violeta">{stats.detectados_mes}</strong>{" "}
          {stats.detectados_mes === 1 ? "patrón" : "patrones"}
        </>
      ),
      sub: "Activos este mes",
    },
    {
      kind: "resueltos",
      label: "Resueltos",
      valor: (
        <>
          <strong className="text-verde">{stats.resueltos_semana}</strong> esta
          semana
        </>
      ),
      sub: stats.resueltos_semana > 0
        ? "Atendiste los importantes"
        : "Aún no se resolvió ninguno",
    },
    {
      kind: "juego",
      label: "Valor en juego",
      valor: (
        <strong className="text-amarillo">
          USD {Math.round(stats.valor_en_juego).toLocaleString("es-AR")}
        </strong>
      ),
      sub: "Suma de leads afectados",
    },
  ];

  const accentColor: Record<typeof items[number]["kind"], string> = {
    detectados: "var(--color-violeta)",
    resueltos: "var(--color-verde)",
    juego: "var(--color-amarillo)",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-[22px]">
      {items.map((s) => (
        <div
          key={s.kind}
          className="relative bg-panel border border-line rounded-[10px] px-5 py-[18px] overflow-hidden"
        >
          <span
            aria-hidden
            className="absolute top-0 left-5 right-5 h-[3px] rounded-b-sm"
            style={{ background: accentColor[s.kind] }}
          />
          <div className="text-[11px] font-semibold text-muted tracking-[0.04em] uppercase mb-2">
            {s.label}
          </div>
          <div
            className="font-display font-semibold text-[26px] -tracking-[0.018em] leading-none text-ink mb-1"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            {s.valor}
          </div>
          <div className="text-[11.5px] text-muted">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

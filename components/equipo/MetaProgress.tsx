import { formatUSD } from "@/lib/format";

interface MetaProgressProps {
  ganado: number;
  meta: number;
  // Días que quedan en el mes (para el sub-label).
  diasRestantes: number;
}

type Tier = "ahead" | "on-track" | "behind";

function tier(porcentaje: number): Tier {
  if (porcentaje >= 100) return "ahead";
  if (porcentaje >= 70) return "on-track";
  return "behind";
}

const FILL_BG: Record<Tier, string> = {
  ahead: "linear-gradient(90deg, var(--color-verde), #5BAE7A)",
  "on-track": "linear-gradient(90deg, var(--color-violeta), var(--color-azul))",
  behind: "linear-gradient(90deg, var(--color-amarillo), #E6A52B)",
};

const TIER_COLOR: Record<Tier, string> = {
  ahead: "text-verde",
  "on-track": "text-violeta",
  behind: "text-amarillo",
};

export function MetaProgress({ ganado, meta, diasRestantes }: MetaProgressProps) {
  const porcentaje = meta > 0 ? (ganado / meta) * 100 : 0;
  const t = tier(porcentaje);
  const widthPct = Math.min(porcentaje, 100);

  const subDerecho =
    t === "ahead"
      ? "meta superada"
      : diasRestantes === 1
        ? "falta 1 día"
        : `faltan ${diasRestantes} días`;

  return (
    <div className="bg-panel-2 border border-line-2 rounded-lg px-3.5 py-3">
      <div className="flex justify-between items-baseline gap-2 mb-2">
        <span className="text-[10.5px] text-muted font-semibold tracking-[0.05em] uppercase">
          Meta del mes
        </span>
        <span className="text-[12.5px] text-ink-2">
          {formatUSD(ganado)} /{" "}
          <strong
            className="text-ink font-semibold font-display"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            {formatUSD(meta).replace("USD ", "")}
          </strong>
        </span>
      </div>
      <div className="h-1.5 bg-line rounded-sm overflow-hidden">
        <div
          className="h-full rounded-sm transition-[width] duration-500"
          style={{ width: `${widthPct}%`, background: FILL_BG[t] }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className={`text-[11px] font-semibold ${TIER_COLOR[t]}`}>
          {Math.round(porcentaje)}%
        </span>
        <span className="text-[11px] text-muted font-medium">{subDerecho}</span>
      </div>
    </div>
  );
}

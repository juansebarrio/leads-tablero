import type { RankingComercial } from "@/lib/types";

interface Props {
  ranking: RankingComercial[];
}

// Podio top 3 de comerciales por valor ganado en el mes. Si hay menos de
// 3 comerciales con datos, igual mostramos los slots (puede no haber medalla
// para los 0).
export function RankingComerciales({ ranking }: Props) {
  if (ranking.length === 0) {
    return (
      <div className="py-6 text-[13px] text-muted text-center">
        Aún no hay cierres este mes para armar un ranking.
      </div>
    );
  }
  const top3 = ranking.slice(0, 3);
  const medallas: ("gold" | "silver" | "bronze")[] = ["gold", "silver", "bronze"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 py-5">
      {top3.map((c, i) => (
        <RankCard key={c.id} comercial={c} posicion={i + 1} medalla={medallas[i]} />
      ))}
    </div>
  );
}

const MEDAL_STYLES: Record<
  "gold" | "silver" | "bronze",
  { bg: string; border: string; medal: string }
> = {
  gold: {
    bg: "linear-gradient(180deg, #FBF6E8 0%, #F5EDD3 100%)",
    border: "#E8D593",
    medal: "#C9A227",
  },
  silver: {
    bg: "linear-gradient(180deg, #F5F6F8 0%, #EBEDF1 100%)",
    border: "#C8CCD3",
    medal: "#8B92A3",
  },
  bronze: {
    bg: "linear-gradient(180deg, #FAF1E8 0%, #F2E2CF 100%)",
    border: "#DBB68C",
    medal: "#A0673A",
  },
};

function RankCard({
  comercial,
  posicion,
  medalla,
}: {
  comercial: RankingComercial;
  posicion: number;
  medalla: "gold" | "silver" | "bronze";
}) {
  const style = MEDAL_STYLES[medalla];
  return (
    <div
      className="relative border rounded-[10px] p-[18px] pt-[16px] flex flex-col gap-3 overflow-hidden"
      style={{ background: style.bg, borderColor: style.border }}
    >
      <span
        className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-white font-display font-bold text-[13px]"
        style={{
          background: style.medal,
          fontVariationSettings: '"opsz" 144',
        }}
      >
        {posicion}
      </span>
      <div className="flex items-center gap-2.5">
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
          style={{ background: comercial.avatar_gradient }}
        >
          {comercial.iniciales}
        </span>
        <div className="min-w-0 pr-9">
          <div
            className="font-display font-medium text-[15px] text-ink leading-tight -tracking-[0.005em]"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            {comercial.nombre}
          </div>
          <div className="text-[11px] text-muted">Comercial</div>
        </div>
      </div>
      <div>
        <div
          className="font-display font-semibold text-[22px] -tracking-[0.015em] text-ink leading-none"
          style={{ fontVariationSettings: '"opsz" 144' }}
        >
          USD {comercial.valor_total.toLocaleString("es-AR")}
        </div>
        <div className="text-[11.5px] text-muted mt-1.5">
          <strong className="font-semibold text-ink-2">
            {comercial.leads_ganados}{" "}
            {comercial.leads_ganados === 1 ? "lead" : "leads"}
          </strong>{" "}
          · ratio {comercial.ratio_cierre}%
        </div>
      </div>
    </div>
  );
}

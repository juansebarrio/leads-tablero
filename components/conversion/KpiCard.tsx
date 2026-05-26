import { ChevronDown, ChevronUp } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  // Diff respecto al período anterior. Si null → no se muestra delta.
  delta?: {
    value: string; // ej: "+18%" o "+0.6 pp"
    direction: "up" | "down" | "neutral";
  } | null;
  sub?: string; // ej: "vs abril (67)"
}

export function KpiCard({ label, value, delta, sub }: KpiCardProps) {
  return (
    <div className="bg-panel border border-line rounded-[10px] p-5 md:p-[18px] xl:p-[20px] xl:px-[22px]">
      <div className="text-[10.5px] text-muted font-semibold tracking-[0.05em] uppercase mb-2.5">
        {label}
      </div>
      <div
        className="font-display font-semibold text-[22px] md:text-[26px] xl:text-[30px] -tracking-[0.02em] leading-none text-ink mb-2"
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        {value}
      </div>
      {delta && (
        <div className="flex items-baseline gap-1.5">
          <DeltaPill direction={delta.direction}>{delta.value}</DeltaPill>
          {sub && <span className="text-[11.5px] text-muted">{sub}</span>}
        </div>
      )}
      {!delta && sub && (
        <span className="text-[11.5px] text-muted">{sub}</span>
      )}
    </div>
  );
}

function DeltaPill({
  direction,
  children,
}: {
  direction: "up" | "down" | "neutral";
  children: React.ReactNode;
}) {
  const styles = {
    up: "bg-verde-soft text-verde",
    down: "bg-rojo-soft text-rojo",
    neutral: "bg-line-2 text-muted",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${styles[direction]}`}
    >
      {direction === "up" && <ChevronUp className="w-2.5 h-2.5" strokeWidth={3} />}
      {direction === "down" && (
        <ChevronDown className="w-2.5 h-2.5" strokeWidth={3} />
      )}
      {children}
    </span>
  );
}

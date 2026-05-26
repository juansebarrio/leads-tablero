import { Layers } from "lucide-react";
import type { Insight } from "@/lib/insights";

interface InsightBannerProps {
  insight: Insight;
}

export function InsightBanner({ insight }: InsightBannerProps) {
  return (
    <div className="bg-[linear-gradient(135deg,var(--color-violeta-soft)_0%,#FAEEFF_100%)] border border-[#D6CAFF] rounded-[10px] p-4 md:p-5 md:px-[22px] mb-7 grid grid-cols-1 md:grid-cols-[44px_1fr_auto] gap-3 md:gap-4 items-center">
      <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-violeta text-white flex items-center justify-center shrink-0">
        <Layers className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold text-violeta tracking-[0.08em] uppercase mb-1">
          Insight del mes
        </div>
        <div className="text-[13.5px] md:text-[14px] text-ink leading-[1.45] text-pretty">
          {insight.texto}
        </div>
      </div>
    </div>
  );
}

import { AlertCircle } from "lucide-react";

interface StuckHintProps {
  count: number;
  diasUmbral?: number;
}

// Banner amarillo que aparece dentro de una columna cuando hay 2+ leads
// atascados hace más de N días.
export function StuckHint({ count, diasUmbral = 14 }: StuckHintProps) {
  return (
    <div className="bg-amarillo-soft border border-[#EBD9A1] rounded-md px-2.5 py-1.5 mx-3 mt-2.5 text-[11px] text-amarillo font-medium flex items-center gap-1.5">
      <AlertCircle className="w-[13px] h-[13px] shrink-0" strokeWidth={2} />
      {count} atascados hace +{diasUmbral} días
    </div>
  );
}

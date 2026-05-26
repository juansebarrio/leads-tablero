import { Check } from "lucide-react";

// Checkmark verde de la esquina superior derecha de las cards en Ganados.
export function WonCheckmark() {
  return (
    <span
      aria-hidden
      className="absolute top-3 right-3 w-[18px] h-[18px] rounded-full bg-verde text-white flex items-center justify-center shadow-[0_2px_6px_rgba(62,138,90,0.25)]"
    >
      <Check className="w-3 h-3" strokeWidth={3.5} />
    </span>
  );
}

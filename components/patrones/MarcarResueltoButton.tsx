"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { marcarPatronResuelto } from "@/app/actions/patrones";

interface Props {
  patronId: string;
}

export function MarcarResueltoButton({ patronId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const res = await marcarPatronResuelto(patronId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Patrón marcado como resuelto");
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="bg-transparent border border-transparent text-muted hover:text-ink-2 px-2 py-1 rounded-md text-[11.5px] font-medium cursor-pointer disabled:opacity-60"
    >
      {pending ? "Marcando..." : "Marcar resuelto"}
    </button>
  );
}

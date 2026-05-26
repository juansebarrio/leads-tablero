"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { marcarPerdido } from "@/app/actions/leads";
import { Drawer } from "@/components/Drawer";
import { useDrawers } from "@/components/drawer-context";
import {
  ErrorBanner,
  Field,
  FormFooter,
  FormTextarea,
  Kbd,
} from "@/components/form-fields";
import { ESTADO_LABEL } from "@/lib/lead-utils";
import type { Estado, MotivoPerdida } from "@/lib/types";

const MOTIVOS: { value: MotivoPerdida; label: string; desc: string }[] = [
  { value: "precio", label: "Precio", desc: "Le pareció caro · no tenía presupuesto" },
  { value: "timing", label: "Timing", desc: "No era el momento · quizás más adelante" },
  { value: "competencia", label: "Competencia", desc: "Eligió otra opción" },
  { value: "no_respondio", label: "No respondió", desc: "Lead frío que nunca contestó" },
  { value: "cambio_necesidad", label: "Cambio de necesidad", desc: "Al cliente le cambió el proyecto" },
  { value: "otro", label: "Otro", desc: "Especificá abajo en el detalle" },
];

export function MarcarPerdidoDrawer() {
  const { isOpen, leadActionData, closeAll } = useDrawers();
  return (
    <Form
      open={isOpen("marcar-perdido")}
      onClose={closeAll}
      data={leadActionData}
    />
  );
}

type LeadActionData = ReturnType<typeof useDrawers>["leadActionData"];

function Form({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: LeadActionData;
}) {
  const router = useRouter();
  const [motivo, setMotivo] = useState<MotivoPerdida | null>(null);
  const [detalle, setDetalle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setMotivo(null);
    setDetalle("");
    setError(null);
  }, [open]);

  const leadNombre = data?.leadNombre ?? "";
  const estadoActual = data?.estadoActual ?? "";
  const valor = data?.valor_estimado ?? 0;
  const responsable = data?.responsable_nombre ?? null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!data) return;
    if (!motivo) {
      setError("Elegí un motivo de pérdida");
      return;
    }

    startTransition(async () => {
      const res = await marcarPerdido({
        leadId: data.leadId,
        estadoActual,
        motivo,
        detalle: detalle || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Lead marcado como perdido");
      onClose();
      router.refresh();
    });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      (e.currentTarget as HTMLFormElement).requestSubmit();
    }
  };

  const estadoLabel = estadoActual
    ? ESTADO_LABEL[estadoActual as Estado] || estadoActual
    : "";

  return (
    <form onSubmit={onSubmit} onKeyDown={onKey}>
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <>
            Marcar como{" "}
            <em className="italic text-rojo font-medium">perdido</em>
          </>
        }
        subtitle={
          <>
            ¿Qué pasó con{" "}
            <strong className="text-ink-2 font-semibold">{leadNombre}</strong>?
          </>
        }
        footer={
          <FormFooter
            onCancel={onClose}
            submitLabel="Marcar como perdido"
            pendingLabel="Guardando..."
            pending={pending}
            variant="danger"
            hint={
              <>
                <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd> confirmar
              </>
            }
          />
        }
      >
        <ErrorBanner error={error} />

        {/* Resumen del lead */}
        <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 items-baseline bg-panel-2 border border-line rounded-lg p-3.5">
          <div className="font-display font-medium text-[14.5px] text-ink -tracking-[0.01em]">
            {leadNombre}
          </div>
          <div className="text-[12.5px] text-ink-2 font-semibold">
            USD {valor.toLocaleString("es-AR")}
          </div>
          <div className="text-[11.5px] text-muted">
            estado{" "}
            <span className="text-ink-2">{estadoLabel}</span>
          </div>
          <div className="text-[11.5px] text-muted text-right">
            {responsable ? `responsable: ${responsable.split(" ")[0]}` : "sin asignar"}
          </div>
        </div>

        {/* Motivo */}
        <Field label="¿Por qué se cayó?" hint="elegí lo que mejor describa">
          <div className="flex flex-col gap-1.5">
            {MOTIVOS.map((m) => {
              const selected = motivo === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMotivo(m.value)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border text-left transition cursor-pointer
                    ${
                      selected
                        ? "bg-rojo-soft border-rojo"
                        : "bg-panel border-line hover:border-ink-2 hover:bg-panel-2"
                    }
                  `}
                >
                  <span
                    className={`
                      w-[18px] h-[18px] rounded-full border-[1.5px] shrink-0 relative
                      ${selected ? "border-rojo bg-rojo" : "border-muted-2 bg-white"}
                    `}
                  >
                    {selected && (
                      <span className="absolute inset-1 bg-white rounded-full" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[13.5px] font-semibold leading-tight ${
                        selected ? "text-rojo" : "text-ink"
                      }`}
                    >
                      {m.label}
                    </div>
                    <div
                      className={`text-[11.5px] leading-tight mt-0.5 ${
                        selected ? "text-rojo opacity-85" : "text-muted"
                      }`}
                    >
                      {m.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Detalle */}
        <Field
          label="Detalle"
          hint="opcional, te va a servir para revisar después"
        >
          <FormTextarea
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder="Ej: Pidió bajar 30% el precio, no aceptaron contraoferta."
            minHeight="80px"
          />
        </Field>

        {/* Hint reapertura */}
        <div className="bg-violeta-soft border border-[#D6CAFF] rounded-md p-3 flex items-start gap-2 text-[11.5px] text-violeta leading-[1.45]">
          <RotateCcw className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
          <span>
            Si el cliente vuelve más adelante, vas a poder{" "}
            <strong className="font-bold">reabrir el lead</strong> desde la
            ficha.
          </span>
        </div>
      </Drawer>
    </form>
  );
}

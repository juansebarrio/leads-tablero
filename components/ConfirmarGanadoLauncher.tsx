"use client";

import { Check, TrendingDown, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { confirmarGanado } from "@/app/actions/leads";
import { Drawer } from "@/components/Drawer";
import { useDrawers } from "@/components/drawer-context";
import {
  ErrorBanner,
  Field,
  FormFooter,
  FormTextarea,
  Kbd,
} from "@/components/form-fields";
import type { TipoNegocio } from "@/lib/types";

export function ConfirmarGanadoDrawer() {
  const { isOpen, leadActionData, closeAll } = useDrawers();
  return (
    <Form
      open={isOpen("confirmar-ganado")}
      onClose={closeAll}
      data={leadActionData}
    />
  );
}

type LeadActionData = ReturnType<typeof useDrawers>["leadActionData"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function todayInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

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
  const [valorFinal, setValorFinal] = useState("");
  const [fechaCierre, setFechaCierre] = useState(todayInput);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !data) return;
    setValorFinal(
      data.valor_estimado != null ? String(data.valor_estimado) : "",
    );
    setFechaCierre(todayInput());
    setComentario("");
    setError(null);
  }, [open, data]);

  const leadNombre = data?.leadNombre ?? "";
  const valorEstimado = data?.valor_estimado ?? 0;
  const tipoNegocio = (data?.tipo_negocio as TipoNegocio) || "proyecto";
  const meses = data?.meses_compromiso ?? null;
  const responsable = data?.responsable_nombre ?? null;
  const origen = data?.origen ?? null;

  const valorNum = Number(valorFinal);
  const delta = Number.isFinite(valorNum) ? valorNum - valorEstimado : 0;
  const showDelta = Number.isFinite(valorNum) && valorEstimado > 0 && delta !== 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!data) return;

    startTransition(async () => {
      const res = await confirmarGanado({
        leadId: data.leadId,
        estadoActual: data.estadoActual,
        valor_final: valorNum,
        fecha_cierre: fechaCierre,
        comentario: comentario || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("¡Ganado! Lead confirmado");
      onClose();
      router.refresh();
    });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      (e.currentTarget as HTMLFormElement).requestSubmit();
    }
  };

  const tipoNegocioLabel = tipoNegocio === "recurrente" ? "Recurrente" : "Proyecto";
  const origenLabel = origen
    ? origen.charAt(0).toUpperCase() + origen.slice(1)
    : null;

  return (
    <form onSubmit={onSubmit} onKeyDown={onKey}>
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <>
            Cerrar el <em className="italic text-verde font-medium">ganado</em>
          </>
        }
        subtitle={
          <>
            Confirmá los detalles del cierre de{" "}
            <strong className="text-ink-2 font-semibold">{leadNombre}</strong>
          </>
        }
        footer={
          <FormFooter
            onCancel={onClose}
            submitLabel="Confirmar ganado"
            pendingLabel="Guardando..."
            pending={pending}
            variant="success"
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

        {/* Celebración */}
        <div className="bg-verde-soft border border-verde/30 rounded-lg p-4 md:p-[18px] flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-verde text-white flex items-center justify-center">
            <Check className="w-6 h-6" strokeWidth={3} />
          </div>
          <div
            className="font-display font-medium text-[22px] md:text-[24px] -tracking-[0.015em] leading-tight text-ink"
            style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
          >
            ¡Un <em className="italic text-verde font-medium">cierre más</em>{" "}
            para el mes!
          </div>
        </div>

        {/* Resumen del lead */}
        <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 items-baseline bg-panel-2 border border-line rounded-lg p-3.5">
          <div className="font-display font-medium text-[14.5px] text-ink -tracking-[0.01em]">
            {leadNombre}
          </div>
          <div className="text-[11.5px] text-muted text-right">
            {responsable ? `responsable: ${responsable.split(" ")[0]}` : "sin asignar"}
          </div>
          <div className="text-[11.5px] text-muted">
            {tipoNegocioLabel}
            {tipoNegocio === "recurrente" && meses
              ? ` · ${meses} meses`
              : ""}
            {origenLabel ? ` · ${origenLabel}` : ""}
          </div>
          <div className="text-[11.5px] text-muted text-right">
            estimado: USD {valorEstimado.toLocaleString("es-AR")}
          </div>
        </div>

        {/* Valor final */}
        <Field label="¿Por cuánto cerraste?" hint="a veces difiere del estimado">
          <div className="grid grid-cols-[auto_1fr] items-stretch border border-line rounded-md overflow-hidden bg-panel focus-within:border-verde focus-within:shadow-[0_0_0_3px_var(--color-verde-soft)]">
            <span className="bg-panel-2 border-r border-line px-3 py-2.5 text-[12.5px] text-muted font-semibold flex items-center">
              USD
            </span>
            <input
              type="number"
              value={valorFinal}
              onChange={(e) => setValorFinal(e.target.value)}
              min={0}
              step="0.01"
              required
              autoFocus
              className="bg-panel px-3 py-2.5 font-body text-[13.5px] text-ink w-full focus:outline-none placeholder:text-muted-2"
              placeholder="0"
            />
          </div>
          {showDelta && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-[3px] rounded-full mt-1.5 w-fit ${
                delta > 0
                  ? "bg-verde-soft text-verde"
                  : "bg-rojo-soft text-rojo"
              }`}
            >
              {delta > 0 ? (
                <TrendingUp className="w-2.5 h-2.5" strokeWidth={2.5} />
              ) : (
                <TrendingDown className="w-2.5 h-2.5" strokeWidth={2.5} />
              )}
              {delta > 0 ? "+" : "-"}USD{" "}
              {Math.abs(delta).toLocaleString("es-AR")} vs estimado
            </span>
          )}
        </Field>

        {/* Fecha */}
        <Field label="Fecha de cierre">
          <input
            type="date"
            value={fechaCierre}
            onChange={(e) => setFechaCierre(e.target.value)}
            required
            className="bg-panel-2 border border-line rounded-md px-3 py-2.5 font-body text-[13.5px] text-ink w-full focus:outline-none focus:border-verde focus:shadow-[0_0_0_3px_var(--color-verde-soft)] placeholder:text-muted-2"
          />
        </Field>

        {/* Comentario */}
        <Field
          label="Comentario del cierre"
          hint="opcional, te ayuda a recordar"
        >
          <FormTextarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Ej: Cerramos con descuento del 15% por pago anticipado."
            minHeight="80px"
          />
        </Field>
      </Drawer>
    </form>
  );
}

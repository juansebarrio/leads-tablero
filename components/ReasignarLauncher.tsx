"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { reasignarLead } from "@/app/actions/leads";
import { Drawer } from "@/components/Drawer";
import { useDrawers } from "@/components/drawer-context";
import {
  ErrorBanner,
  Field,
  FormFooter,
  FormTextarea,
  Kbd,
} from "@/components/form-fields";
import type { ComercialConMetricas } from "@/lib/types";

interface ReasignarDrawerProps {
  comerciales: ComercialConMetricas[];
}

// Server-injected list (los datos vienen del Server Component).
// El Form se renderiza siempre montado para que el slide-in/out anime bien.
export function ReasignarDrawer({ comerciales }: ReasignarDrawerProps) {
  const { isOpen, leadActionData, closeAll } = useDrawers();
  return (
    <Form
      open={isOpen("reasignar")}
      onClose={closeAll}
      data={leadActionData}
      comerciales={comerciales}
    />
  );
}

type LeadActionData = ReturnType<typeof useDrawers>["leadActionData"];

// Carga humana — heurística simple basada en leads_activos vs media del equipo.
function cargaLabel(
  activos: number,
  promedio: number,
): { label: string; color: string } {
  if (promedio === 0) return { label: "sin métrica", color: "text-muted" };
  if (activos > promedio * 1.3) {
    return { label: "sobrecargado", color: "text-rojo" };
  }
  if (activos < promedio * 0.7) {
    return { label: "menos cargado", color: "text-verde" };
  }
  return { label: "carga pareja", color: "text-ink-2" };
}

function avatarStyle(gradient: string | null | undefined): React.CSSProperties {
  return gradient ? { background: gradient } : { background: "var(--color-line)" };
}

function Form({
  open,
  onClose,
  data,
  comerciales,
}: {
  open: boolean;
  onClose: () => void;
  data: LeadActionData;
  comerciales: ComercialConMetricas[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setSelected("");
    setMotivo("");
    setError(null);
  }, [open]);

  const leadNombre = data?.leadNombre ?? "";
  const responsableActualId = data?.responsable_id ?? null;
  const responsableActualNombre = data?.responsable_nombre ?? null;

  const actual = comerciales.find((c) => c.id === responsableActualId) ?? null;
  const promedio =
    comerciales.length > 0
      ? comerciales.reduce((acc, c) => acc + c.leads_activos, 0) /
        comerciales.length
      : 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!data) return;
    if (!selected) {
      setError("Elegí un nuevo responsable");
      return;
    }
    if (selected === responsableActualId) {
      setError("Es el mismo responsable actual");
      return;
    }
    const nuevo = comerciales.find((c) => c.id === selected);
    if (!nuevo) {
      setError("No encontramos al comercial seleccionado");
      return;
    }

    startTransition(async () => {
      const res = await reasignarLead({
        leadId: data.leadId,
        comercialId: selected,
        comercialNombre: nuevo.nombre,
        comercialAnteriorNombre: responsableActualNombre,
        motivo: motivo || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(`Lead reasignado a ${nuevo.nombre.split(" ")[0]}`);
      onClose();
      router.refresh();
    });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      (e.currentTarget as HTMLFormElement).requestSubmit();
    }
  };

  const nuevoNombre = comerciales.find((c) => c.id === selected)?.nombre.split(" ")[0];

  return (
    <form onSubmit={onSubmit} onKeyDown={onKey}>
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <>
            Reasignar{" "}
            <em className="italic text-violeta font-medium">responsable</em>
          </>
        }
        subtitle={
          <>
            Movés{" "}
            <strong className="text-ink-2 font-semibold">{leadNombre}</strong>{" "}
            a otro comercial
          </>
        }
        footer={
          <FormFooter
            onCancel={onClose}
            submitLabel={
              nuevoNombre ? `Reasignar a ${nuevoNombre}` : "Reasignar"
            }
            pendingLabel="Reasignando..."
            pending={pending}
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

        {/* Estado actual */}
        <div className="flex flex-col gap-2">
          <div className="text-[10.5px] font-bold tracking-[0.06em] uppercase text-muted">
            Actualmente lo lleva
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-panel-2 border border-line rounded-md">
            {actual ? (
              <>
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={avatarStyle(actual.avatar_gradient)}
                >
                  {actual.iniciales}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-ink">
                    {actual.nombre}
                  </div>
                  <div className="text-[11.5px] text-muted">
                    {actual.leads_activos} leads activos
                  </div>
                </div>
              </>
            ) : (
              <div className="text-[13px] text-muted-2 italic">
                Sin asignar
              </div>
            )}
          </div>
        </div>

        {/* Selector */}
        <Field label="¿A quién lo pasamos?">
          <div className="flex flex-col gap-1.5">
            {comerciales.map((c) => {
              const isCurrent = c.id === responsableActualId;
              const isSelected = c.id === selected;
              const carga = cargaLabel(c.leads_activos, promedio);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => !isCurrent && setSelected(c.id)}
                  disabled={isCurrent}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border text-left transition
                    ${
                      isCurrent
                        ? "bg-panel border-line opacity-50 cursor-not-allowed"
                        : isSelected
                          ? "bg-violeta-soft border-violeta cursor-pointer"
                          : "bg-panel border-line hover:border-ink-2 hover:bg-panel-2 cursor-pointer"
                    }
                  `}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={avatarStyle(c.avatar_gradient)}
                  >
                    {c.iniciales}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[13.5px] font-semibold leading-tight ${
                        isSelected ? "text-violeta" : "text-ink"
                      }`}
                    >
                      {c.nombre}
                    </div>
                    <div
                      className={`text-[11.5px] leading-tight mt-0.5 ${
                        isSelected ? "text-violeta opacity-85" : "text-muted"
                      }`}
                    >
                      {c.leads_activos} leads ·{" "}
                      <strong className={isSelected ? "" : carga.color}>
                        {carga.label}
                      </strong>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold tracking-[0.04em] uppercase text-muted bg-line-2 px-2 py-0.5 rounded-full">
                      Actual
                    </span>
                  )}
                  {isSelected && (
                    <Check
                      className="w-4 h-4 text-violeta shrink-0"
                      strokeWidth={2.5}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Nota opcional */}
        <Field label="¿Por qué lo reasignás?" hint="opcional · queda en el historial">
          <FormTextarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Sofía tiene experiencia con clínicas y Mariana está sobrecargada"
            minHeight="70px"
          />
        </Field>
      </Drawer>
    </form>
  );
}

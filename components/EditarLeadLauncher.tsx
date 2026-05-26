"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { actualizarLead } from "@/app/actions/leads";
import { Drawer } from "@/components/Drawer";
import { useDrawers } from "@/components/drawer-context";
import {
  Chips,
  ErrorBanner,
  Field,
  FormFooter,
  FormInput,
  Kbd,
  SectionLabel,
} from "@/components/form-fields";
import type { Origen, TipoNegocio } from "@/lib/types";

const ORIGENES: { value: Origen; label: string }[] = [
  { value: "formulario", label: "Formulario web" },
  { value: "referido", label: "Referido" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "whatsapp", label: "WhatsApp" },
];

const TIPOS: { value: TipoNegocio; label: string }[] = [
  { value: "recurrente", label: "Recurrente" },
  { value: "proyecto", label: "Proyecto único" },
];

// Drawer global. Lee del context los datos del lead a editar.
export function EditarLeadDrawer() {
  const { isOpen, leadActionData, closeAll } = useDrawers();
  return (
    <Form
      open={isOpen("editar-lead")}
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
  const [nombre, setNombre] = useState("");
  const [origen, setOrigen] = useState<Origen>("formulario");
  const [origenDetalle, setOrigenDetalle] = useState("");
  const [valorEstimado, setValorEstimado] = useState("");
  const [tipoNegocio, setTipoNegocio] = useState<TipoNegocio>("proyecto");
  const [mesesCompromiso, setMesesCompromiso] = useState("");
  const [proximoPaso, setProximoPaso] = useState("");
  const [proximoFecha, setProximoFecha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Prefill desde el snapshot cuando se reabre.
  useEffect(() => {
    if (!open || !data) return;
    setNombre(data.leadNombre);
    setOrigen((data.origen as Origen) || "formulario");
    setOrigenDetalle(data.origen_detalle || "");
    setValorEstimado(
      data.valor_estimado != null ? String(data.valor_estimado) : "",
    );
    setTipoNegocio((data.tipo_negocio as TipoNegocio) || "proyecto");
    setMesesCompromiso(
      data.meses_compromiso != null ? String(data.meses_compromiso) : "",
    );
    setProximoPaso(data.proximo_paso || "");
    // proximo_paso_fecha viene como ISO; recortamos a YYYY-MM-DD para el input.
    setProximoFecha(
      data.proximo_paso_fecha ? data.proximo_paso_fecha.slice(0, 10) : "",
    );
    setError(null);
  }, [open, data]);

  const leadNombre = data?.leadNombre ?? "";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!data) return;

    const valorParsed = Number(valorEstimado);
    const mesesParsed = mesesCompromiso ? Number(mesesCompromiso) : null;

    startTransition(async () => {
      const res = await actualizarLead({
        leadId: data.leadId,
        nombre,
        origen,
        origen_detalle: origenDetalle || null,
        valor_estimado: valorParsed,
        tipo_negocio: tipoNegocio,
        meses_compromiso: mesesParsed,
        proximo_paso: proximoPaso || null,
        proximo_paso_fecha: proximoFecha || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Lead actualizado");
      onClose();
      router.refresh();
    });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      (e.currentTarget as HTMLFormElement).requestSubmit();
    }
  };

  return (
    <form onSubmit={onSubmit} onKeyDown={onKey}>
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <>
            Editar <em className="italic text-violeta font-medium">lead</em>
          </>
        }
        subtitle={
          <>
            Modificá los datos de{" "}
            <strong className="text-ink-2 font-semibold">{leadNombre}</strong>
          </>
        }
        footer={
          <FormFooter
            onCancel={onClose}
            submitLabel="Guardar cambios"
            pendingLabel="Guardando..."
            pending={pending}
            hint={
              <>
                <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd> guardar cambios
              </>
            }
          />
        }
      >
        <ErrorBanner error={error} />

        <SectionLabel>Información básica</SectionLabel>

        <Field label="Nombre">
          <FormInput
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            filled
          />
        </Field>

        <Field label="¿Por dónde llegó?">
          <Chips options={ORIGENES} value={origen} onChange={setOrigen} />
        </Field>

        <Field label="Detalle del origen" hint="opcional">
          <FormInput
            type="text"
            value={origenDetalle}
            onChange={(e) => setOrigenDetalle(e.target.value)}
            placeholder="Ej: Pidió presupuesto reforma oficinas"
            filled
          />
        </Field>

        <div className="border-t border-line-2 pt-[18px] mt-1 flex flex-col gap-4 md:gap-[18px]">
          <SectionLabel>El negocio</SectionLabel>

          <Field label="Valor estimado">
            <div className="grid grid-cols-[auto_1fr] items-stretch border border-line rounded-md overflow-hidden bg-panel focus-within:border-violeta focus-within:shadow-[0_0_0_3px_var(--color-violeta-soft)]">
              <span className="bg-panel-2 border-r border-line px-3 py-2.5 text-[12.5px] text-muted font-semibold flex items-center">
                USD
              </span>
              <input
                type="number"
                value={valorEstimado}
                onChange={(e) => setValorEstimado(e.target.value)}
                min={0}
                step="0.01"
                required
                className="bg-panel-2 px-3 py-2.5 font-body text-[13.5px] text-ink w-full focus:outline-none placeholder:text-muted-2"
                placeholder="0"
              />
            </div>
          </Field>

          <Field label="Tipo de negocio">
            <Chips options={TIPOS} value={tipoNegocio} onChange={setTipoNegocio} />
          </Field>

          {tipoNegocio === "recurrente" && (
            <Field label="Meses de compromiso" hint="solo si es recurrente">
              <FormInput
                type="number"
                value={mesesCompromiso}
                onChange={(e) => setMesesCompromiso(e.target.value)}
                min={1}
                step="1"
                required
                filled
              />
            </Field>
          )}
        </div>

        <div className="border-t border-line-2 pt-[18px] mt-1 flex flex-col gap-4 md:gap-[18px]">
          <SectionLabel>El próximo paso</SectionLabel>

          <Field label="¿Qué hay que hacer?" hint="opcional">
            <FormInput
              type="text"
              value={proximoPaso}
              onChange={(e) => setProximoPaso(e.target.value)}
              placeholder="Ej: Llamar para confirmar arranque"
              filled
            />
          </Field>

          <Field label="¿Cuándo?" hint="opcional">
            <FormInput
              type="date"
              value={proximoFecha}
              onChange={(e) => setProximoFecha(e.target.value)}
              filled
            />
          </Field>
        </div>
      </Drawer>
    </form>
  );
}

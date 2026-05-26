"use client";

import { Info, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { crearLead } from "@/app/actions/leads";
import { Drawer } from "@/components/Drawer";
import { useDrawers } from "@/components/drawer-context";
import type { Origen } from "@/lib/types";

interface NuevoLeadTriggerProps {
  className?: string;
}

const ORIGENES: { value: Origen; label: string }[] = [
  { value: "formulario", label: "Formulario web" },
  { value: "referido", label: "Referido" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "whatsapp", label: "WhatsApp" },
];

const DEFAULT_BTN =
  "flex-1 md:flex-none border border-ink bg-ink text-white px-3.5 py-2 rounded-md font-medium text-[12.5px] hover:bg-violeta hover:border-violeta inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap";

// Trigger: solo el botón. Se monta donde necesite el caller (ej: hero).
// El drawer se monta una sola vez en el DashboardLayout (NuevoLeadDrawer).
export function NuevoLeadTrigger({
  className = DEFAULT_BTN,
}: NuevoLeadTriggerProps) {
  const { openNuevoLead } = useDrawers();
  return (
    <button type="button" onClick={openNuevoLead} className={className}>
      <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
      Nuevo lead
    </button>
  );
}

// Drawer global. Una sola instancia en DashboardLayout. Lee del context.
// El Form se mantiene montado siempre (necesario para que el transform
// del Drawer pueda animar slide-in/out). El estado interno se resetea
// dentro del Form cuando `open` cambia de false a true.
export function NuevoLeadDrawer() {
  const { isOpen, closeAll } = useDrawers();
  return <Form open={isOpen("nuevo-lead")} onClose={closeAll} />;
}

function Form({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [origen, setOrigen] = useState<Origen>("formulario");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Reset cada vez que se reabre el drawer.
  useEffect(() => {
    if (open) {
      setNombre("");
      setOrigen("formulario");
      setError(null);
    }
  }, [open]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await crearLead({ nombre, origen });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onClose();
      router.push(`/lead/${res.data.id}`);
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
            Nuevo <em className="italic text-violeta font-medium">lead</em>
          </>
        }
        subtitle="Después podés completar el resto desde la ficha"
        footer={
          <>
            <span className="hidden md:inline-flex items-center gap-1 text-[11.5px] text-muted">
              <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd> crear y abrir ficha
            </span>
            <div className="grid grid-cols-[1fr_2fr] md:flex md:gap-2.5 gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="border border-line bg-panel text-ink-2 rounded-md font-medium text-[13px] px-4 py-2.5 md:py-2 hover:border-ink-2 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="bg-ink text-white border border-ink rounded-md font-medium text-[13px] px-4 py-2.5 md:py-2 hover:bg-violeta hover:border-violeta cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              >
                {pending ? "Creando..." : "Crear lead"}
              </button>
            </div>
          </>
        }
      >
        {error && (
          <div className="bg-rojo-soft border border-rojo/20 text-rojo text-[12.5px] rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2.5">
            <span className="text-[11.5px] font-semibold text-ink-2">
              ¿Quién es?
            </span>
            <span className="text-[11px] text-muted-2">Persona o empresa</span>
          </div>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            minLength={1}
            maxLength={200}
            autoFocus
            placeholder="Ej: Constructora Aliaga"
            className="bg-panel border border-line rounded-md px-3 py-2.5 font-body text-[13.5px] text-ink w-full focus:outline-none focus:border-violeta focus:shadow-[0_0_0_3px_var(--color-violeta-soft)] placeholder:text-muted-2"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11.5px] font-semibold text-ink-2">
            ¿Por dónde llegó?
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ORIGENES.map((o) => {
              const selected = origen === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOrigen(o.value)}
                  className={`
                    px-3.5 py-1.5 rounded-full font-medium text-[12.5px] cursor-pointer border transition
                    ${selected ? "bg-ink text-white border-ink" : "bg-panel text-ink-2 border-line hover:border-ink-2"}
                  `}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-panel-2 border border-line rounded-lg p-4 flex gap-3 items-start mt-1">
          <div className="w-6 h-6 rounded-full bg-violeta-soft text-violeta flex items-center justify-center shrink-0">
            <Info className="w-3 h-3" strokeWidth={2.2} />
          </div>
          <div className="text-[12.5px] text-ink-2 leading-[1.55]">
            Lo cargás ahora rápido para no perderlo.{" "}
            <strong className="font-semibold text-ink">
              Cuando lo retomes
            </strong>{" "}
            completás el resto: valor estimado, responsable, próximo paso.
          </div>
        </div>
      </Drawer>
    </form>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="font-body text-[10.5px] bg-white border border-line px-1.5 py-px rounded-sm text-muted mx-px">
      {children}
    </kbd>
  );
}

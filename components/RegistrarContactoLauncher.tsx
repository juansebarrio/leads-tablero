"use client";

import {
  Linkedin,
  Mail,
  MessageCircle,
  Phone,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { registrarContacto } from "@/app/actions/contactos";
import { Drawer } from "@/components/Drawer";
import type { CanalContacto } from "@/lib/types";

interface RegistrarContactoLauncherProps {
  leadId: string;
  leadNombre: string;
  // Opcional: override del className del botón.
  className?: string;
}

const DEFAULT_BTN =
  "inline-flex items-center gap-1.5 bg-ink text-white border border-ink px-3.5 py-2 rounded-md font-medium text-[12px] md:text-[12.5px] cursor-pointer hover:bg-violeta hover:border-violeta transition whitespace-nowrap";

const CANALES: { value: CanalContacto; label: string; icon: LucideIcon }[] = [
  { value: "mail", label: "Mail", icon: Mail },
  { value: "llamado", label: "Llamado", icon: Phone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "reunion", label: "Reunión", icon: Users },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function todayDateInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowTimeInput(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function RegistrarContactoLauncher({
  leadId,
  leadNombre,
  className = DEFAULT_BTN,
}: RegistrarContactoLauncherProps) {
  const [open, setOpen] = useState(false);
  // Cambia cada vez que se abre para re-montar el form (estado fresco).
  const [mountKey, setMountKey] = useState(0);

  const onOpen = () => {
    setMountKey((k) => k + 1);
    setOpen(true);
  };
  const onClose = () => setOpen(false);

  return (
    <>
      <button type="button" onClick={onOpen} className={className}>
        <MessageCircle
          className="w-3 h-3 md:w-3.5 md:h-3.5"
          strokeWidth={2}
        />
        Registrar contacto
      </button>
      <Form
        key={mountKey}
        open={open}
        onClose={onClose}
        leadId={leadId}
        leadNombre={leadNombre}
      />
    </>
  );
}

function Form({
  open,
  onClose,
  leadId,
  leadNombre,
}: {
  open: boolean;
  onClose: () => void;
  leadId: string;
  leadNombre: string;
}) {
  const router = useRouter();
  const [canal, setCanal] = useState<CanalContacto>("llamado");
  const [fecha, setFecha] = useState(todayDateInput);
  const [hora, setHora] = useState(nowTimeInput);
  const [nota, setNota] = useState("");
  const [proximoPaso, setProximoPaso] = useState("");
  const [proximoFecha, setProximoFecha] = useState("");
  const [proximoHora, setProximoHora] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fechaIso = new Date(`${fecha}T${hora}`).toISOString();
    const proxIso =
      proximoPaso && proximoFecha
        ? new Date(`${proximoFecha}T${proximoHora || "10:00"}`).toISOString()
        : null;

    startTransition(async () => {
      const res = await registrarContacto({
        leadId,
        canal,
        fecha: fechaIso,
        nota,
        proximoPaso: proximoPaso || null,
        proximoPasoFecha: proxIso,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
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
            Registrar{" "}
            <em className="italic text-violeta font-medium">contacto</em>
          </>
        }
        subtitle={
          <>
            con{" "}
            <strong className="text-ink-2 font-semibold">{leadNombre}</strong>
          </>
        }
        footer={
          <>
            <span className="hidden md:inline-flex items-center gap-1 text-[11.5px] text-muted">
              <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd> guardar
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
                {pending ? "Guardando..." : "Guardar contacto"}
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

        {/* Canal */}
        <Field label="¿Por dónde lo contactaste?">
          <div className="grid grid-cols-5 gap-1.5">
            {CANALES.map((c) => {
              const Icon = c.icon;
              const selected = c.value === canal;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCanal(c.value)}
                  className={`
                    flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-md border cursor-pointer transition
                    ${selected ? "bg-violeta-soft border-violeta" : "bg-panel border-line hover:border-ink-2 hover:bg-panel-2"}
                  `}
                >
                  <span
                    className={`
                      w-[22px] h-[22px] rounded-full flex items-center justify-center
                      ${selected ? "bg-violeta text-white" : "bg-line-2 text-muted"}
                    `}
                  >
                    <Icon className="w-[11px] h-[11px]" strokeWidth={2} />
                  </span>
                  <span
                    className={`text-[10.5px] ${selected ? "text-violeta font-semibold" : "text-muted font-medium"}`}
                  >
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Fecha y hora */}
        <Field label="¿Cuándo?">
          <div className="grid grid-cols-2 gap-2.5">
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              filled
              required
            />
            <Input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              filled
              required
            />
          </div>
        </Field>

        {/* Nota */}
        <Field
          label="¿Qué pasó?"
          hint="Lo escribís vos, no se va a olvidar"
        >
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            required
            minLength={1}
            maxLength={2000}
            placeholder="Hablé con Carlos. Confirmó arranque en junio. Pidió cotización detallada por unidades. Me la pasa por mail mañana."
            className="bg-panel-2 border border-line rounded-md px-3 py-2.5 font-body text-[13.5px] text-ink min-h-[90px] resize-y leading-[1.5] focus:outline-none focus:border-violeta focus:shadow-[0_0_0_3px_var(--color-violeta-soft)] placeholder:text-muted-2"
          />
        </Field>

        {/* Lo siguiente */}
        <div className="bg-violeta-soft border border-[#D6CAFF] rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-[22px] h-[22px] rounded-full bg-violeta text-white flex items-center justify-center">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </div>
            <span className="text-[12px] font-bold text-violeta tracking-[0.06em] uppercase">
              Lo siguiente
            </span>
          </div>
          <Field label="¿Qué hay que hacer después?" labelColor="ink-2">
            <Input
              type="text"
              value={proximoPaso}
              onChange={(e) => setProximoPaso(e.target.value)}
              placeholder="Ej: Mandar cotización detallada por mail"
              variant="onLilac"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Cuándo" labelColor="ink-2">
              <Input
                type="date"
                value={proximoFecha}
                onChange={(e) => setProximoFecha(e.target.value)}
                variant="onLilac"
              />
            </Field>
            <Field label="Hora" labelColor="ink-2">
              <Input
                type="time"
                value={proximoHora}
                onChange={(e) => setProximoHora(e.target.value)}
                variant="onLilac"
              />
            </Field>
          </div>
        </div>
      </Drawer>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
  labelColor = "ink-2",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  labelColor?: "ink-2";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2.5">
        <span
          className={`text-[11.5px] font-semibold ${labelColor === "ink-2" ? "text-ink-2" : "text-ink"}`}
        >
          {label}
        </span>
        {hint && <span className="text-[11px] text-muted-2">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Input({
  type,
  value,
  onChange,
  placeholder,
  required,
  filled,
  variant = "default",
}: {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  filled?: boolean;
  variant?: "default" | "onLilac";
}) {
  const base =
    "border rounded-md px-3 py-2.5 font-body text-[13.5px] text-ink w-full focus:outline-none focus:border-violeta focus:shadow-[0_0_0_3px_var(--color-violeta-soft)] placeholder:text-muted-2";
  const bg =
    variant === "onLilac"
      ? "bg-white border-[#D6CAFF]"
      : filled
        ? "bg-panel-2 border-line"
        : "bg-panel border-line";
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`${base} ${bg}`}
    />
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="font-body text-[10.5px] bg-white border border-line px-1.5 py-px rounded-sm text-muted mx-px">
      {children}
    </kbd>
  );
}

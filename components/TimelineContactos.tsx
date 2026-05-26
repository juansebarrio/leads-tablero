import {
  Linkedin,
  Mail,
  MessageCircle,
  Phone,
  Users,
  type LucideIcon,
} from "lucide-react";
import { formatFechaCorta, formatFechaRelativa } from "@/lib/lead-utils";
import type { CanalContacto, Comercial, Contacto } from "@/lib/types";

interface TimelineContactosProps {
  contactos: Contacto[];
  responsable: Comercial | null;
}

const CANAL_ICON: Record<CanalContacto, LucideIcon> = {
  mail: Mail,
  llamado: Phone,
  whatsapp: MessageCircle,
  reunion: Users,
  linkedin: Linkedin,
};

// Mapeo a tokens del sistema (no a hex hardcodeado).
const CANAL_STYLE: Record<
  CanalContacto,
  { bg: string; border: string; text: string }
> = {
  mail: {
    bg: "bg-azul-soft",
    border: "border-[#D6DEFF]",
    text: "text-azul",
  },
  llamado: {
    bg: "bg-violeta-soft",
    border: "border-[#DCD0FF]",
    text: "text-violeta",
  },
  whatsapp: {
    bg: "bg-verde-soft",
    border: "border-[#C9E2D2]",
    text: "text-verde",
  },
  reunion: {
    bg: "bg-amarillo-soft",
    border: "border-[#EBD9A1]",
    text: "text-amarillo",
  },
  linkedin: {
    bg: "bg-turquesa-soft",
    border: "border-[#BDDDE7]",
    text: "text-[#2E8FA8]",
  },
};

const CANAL_LABEL: Record<CanalContacto, string> = {
  mail: "Mail enviado",
  llamado: "Llamado",
  whatsapp: "WhatsApp",
  reunion: "Reunión",
  linkedin: "LinkedIn",
};

export function TimelineContactos({
  contactos,
  responsable,
}: TimelineContactosProps) {
  if (contactos.length === 0) {
    return (
      <div className="bg-panel border border-line rounded-lg px-5 py-6 text-[13px] text-muted">
        Todavía no hay contactos registrados con este lead.
      </div>
    );
  }

  // El último de la lista es el primero cronológicamente (la query ya ordena
  // desc), así que marcamos el último visible como "Primer contacto".
  const indicePrimero = contactos.length - 1;

  return (
    <div className="bg-panel border border-line rounded-lg px-4 md:px-6 py-2 relative">
      {/* Línea vertical continua detrás de los íconos */}
      <span
        aria-hidden
        className="absolute w-[1.5px] bg-line left-[29px] md:left-[37px] top-8 bottom-8"
      />

      {contactos.map((c, i) => {
        const Icon = CANAL_ICON[c.canal];
        const style = CANAL_STYLE[c.canal];
        const esPrimer = i === indicePrimero;
        const label = esPrimer
          ? `Primer contacto · ${humanizarCanal(c.canal)}`
          : CANAL_LABEL[c.canal];

        return (
          <div
            key={c.id}
            className={`relative py-3.5 md:py-[18px] pl-9 md:pl-11 ${i < contactos.length - 1 ? "border-b border-line-2" : ""}`}
          >
            <div
              className={`absolute left-0 top-3.5 md:top-[14px] w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center border-[1.5px] z-[1] ${style.bg} ${style.border} ${style.text}`}
            >
              <Icon className="w-3 h-3 md:w-[13px] md:h-[13px]" strokeWidth={2} />
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-0.5 md:gap-2.5 mb-1">
              <span className="text-[13px] md:text-[13.5px] font-semibold text-ink">
                {label}
              </span>
              <span className="text-[11px] md:text-[11.5px] text-muted whitespace-nowrap">
                {formatFechaCorta(c.fecha)}
                <span className="text-muted-2 ml-1">
                  · {formatFechaRelativa(c.fecha)}
                </span>
              </span>
            </div>
            {c.nota && (
              <div className="text-[12px] md:text-[12.5px] text-ink-2 leading-[1.55]">
                {c.nota}
              </div>
            )}
            {responsable && (
              <div className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] text-muted">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold text-[8.5px]"
                  style={{ background: responsable.avatar_gradient }}
                >
                  {responsable.iniciales}
                </span>
                {responsable.nombre}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function humanizarCanal(canal: CanalContacto): string {
  switch (canal) {
    case "mail":
      return "Mail";
    case "llamado":
      return "Llamado";
    case "whatsapp":
      return "WhatsApp";
    case "reunion":
      return "Reunión";
    case "linkedin":
      return "LinkedIn";
  }
}

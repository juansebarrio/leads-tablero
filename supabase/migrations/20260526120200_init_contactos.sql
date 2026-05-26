-- Contactos: historial de interacciones por lead.
create table contactos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  fecha timestamptz not null default now(),
  canal text not null check (canal in ('mail', 'llamado', 'whatsapp', 'reunion', 'linkedin')),
  nota text
);

create index contactos_lead_id_idx on contactos (lead_id);
create index contactos_fecha_idx on contactos (fecha desc);

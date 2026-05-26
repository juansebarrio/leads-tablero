-- Agenda: eventos / reuniones del día.
create table agenda (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete set null,
  fecha timestamptz not null,
  duracion_min int not null default 30,
  titulo text not null,
  modalidad text not null check (modalidad in ('meet', 'zoom', 'whatsapp', 'presencial')),
  tag text check (tag in ('cierre_semana', 'referido', 'propuesta', 'definitiva'))
);

create index agenda_fecha_idx on agenda (fecha);
create index agenda_lead_id_idx on agenda (lead_id);

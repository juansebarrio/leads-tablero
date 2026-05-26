-- RLS: la demo es pública. Anon puede leer/insertar/actualizar todas las tablas
-- demo, pero NO puede borrar. El DELETE queda reservado a service_role
-- (usado solo por el endpoint de reset diario).

alter table comerciales enable row level security;
alter table leads enable row level security;
alter table contactos enable row level security;
alter table agenda enable row level security;

-- Comerciales (solo lectura para anon; las altas las hace el seed/reset).
create policy "anon lee comerciales"
  on comerciales for select to anon using (true);

-- Leads
create policy "anon lee leads"
  on leads for select to anon using (true);

create policy "anon inserta leads"
  on leads for insert to anon with check (true);

create policy "anon actualiza leads"
  on leads for update to anon using (true) with check (true);

-- Contactos
create policy "anon lee contactos"
  on contactos for select to anon using (true);

create policy "anon inserta contactos"
  on contactos for insert to anon with check (true);

-- Agenda
create policy "anon lee agenda"
  on agenda for select to anon using (true);

create policy "anon inserta agenda"
  on agenda for insert to anon with check (true);

create policy "anon actualiza agenda"
  on agenda for update to anon using (true) with check (true);

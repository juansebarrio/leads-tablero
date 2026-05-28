-- Multi-tenancy · Sprint 2 (RLS).
--
-- Sprint 1 dejó organizacion_id en cada tabla y los DEFAULT apuntando a
-- la org demo. Ahora cerramos las policies para que:
--   - anon  → solo orgs con modo='demo' (la vitrina pública)
--   - auth  → solo orgs donde el usuario es miembro
--
-- Forma A: helper SQL current_org_id() / es_miembro_de_org(uuid) que
-- hace lookup en usuarios_organizaciones via auth.uid(). Sin JWT claims
-- por ahora (cuando los sumemos, se reescriben solo los helpers).
--
-- Las views ya están con security_invoker=true desde Sprint 1, así que
-- respetan estas policies automáticamente — no se tocan.
--
-- Los DEFAULT de organizacion_id se mantienen hasta Sprint 6 (refactor
-- de INSERTs en lib/seed.ts + app/api/reset).

-- ────────────────────────────────────────────────────────────────────
-- 1) Helpers SQL.
--
--    SECURITY DEFINER: el lookup en usuarios_organizaciones se hace con
--    privilegios del owner (postgres), bypaseando la RLS de esa tabla.
--    Eso evita una recursión infinita ("para chequear si sos miembro,
--    chequeo si sos miembro").
--
--    SET search_path = public, auth: la función ve los dos schemas
--    (auth.uid() vive en auth, usuarios_organizaciones en public).
-- ────────────────────────────────────────────────────────────────────

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select organizacion_id
  from usuarios_organizaciones
  where usuario_id = auth.uid()
  limit 1;
$$;

create or replace function public.es_miembro_de_org(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from usuarios_organizaciones
    where usuario_id = auth.uid()
      and organizacion_id = org_id
  );
$$;

-- ────────────────────────────────────────────────────────────────────
-- 2) DROP de TODAS las policies viejas (anon abierto · Sprint 0).
--    Listado vía:  select tablename, policyname from pg_policies
--                  where schemaname='public' order by tablename;
-- ────────────────────────────────────────────────────────────────────

drop policy if exists "anon lee comerciales"    on comerciales;

drop policy if exists "anon lee leads"          on leads;
drop policy if exists "anon inserta leads"      on leads;
drop policy if exists "anon actualiza leads"    on leads;

drop policy if exists "anon lee contactos"      on contactos;
drop policy if exists "anon inserta contactos"  on contactos;

drop policy if exists "anon lee agenda"         on agenda;
drop policy if exists "anon inserta agenda"     on agenda;
drop policy if exists "anon actualiza agenda"   on agenda;

drop policy if exists "anon lee patrones"       on patrones;
drop policy if exists "anon inserta patrones"   on patrones;
drop policy if exists "anon actualiza patrones" on patrones;
drop policy if exists "anon borra patrones"     on patrones;

-- ────────────────────────────────────────────────────────────────────
-- 3) Enable RLS en organizaciones + usuarios_organizaciones
--    (Sprint 1 las dejó sin RLS porque no las usaba la app).
-- ────────────────────────────────────────────────────────────────────

alter table organizaciones          enable row level security;
alter table usuarios_organizaciones enable row level security;

-- ────────────────────────────────────────────────────────────────────
-- 4) Policies de organizaciones.
--    Solo SELECT: nadie crea/modifica/borra orgs desde la app (se hace
--    por SQL desde Supabase Studio).
-- ────────────────────────────────────────────────────────────────────

create policy "anon_select_demo_orgs"
  on organizaciones for select to anon
  using (modo = 'demo');

create policy "auth_select_member_orgs"
  on organizaciones for select to authenticated
  using (es_miembro_de_org(id));

-- ────────────────────────────────────────────────────────────────────
-- 5) Policies de usuarios_organizaciones.
--    Solo SELECT y solo las membresías del propio usuario. Las altas
--    se gestionan desde Supabase Studio (no desde la app).
-- ────────────────────────────────────────────────────────────────────

create policy "auth_select_own_memberships"
  on usuarios_organizaciones for select to authenticated
  using (usuario_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────
-- 6) Policies de tablas de negocio (8 × 5 = 40 policies).
--
--    Patrón por tabla:
--      anon  · SELECT/INSERT/UPDATE/DELETE solo si organizacion_id es
--              de una org con modo='demo'.
--      auth  · SELECT/INSERT/UPDATE/DELETE solo si el usuario es
--              miembro de la org dueña del registro.
-- ────────────────────────────────────────────────────────────────────

-- ┌─ LEADS ───────────────────────────────────────────────────────────
create policy "anon_select_demo_leads"
  on leads for select to anon
  using (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_insert_demo_leads"
  on leads for insert to anon
  with check (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_update_demo_leads"
  on leads for update to anon
  using      (organizacion_id in (select id from organizaciones where modo = 'demo'))
  with check (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_delete_demo_leads"
  on leads for delete to anon
  using (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "auth_select_own_leads"
  on leads for select to authenticated
  using (es_miembro_de_org(organizacion_id));

create policy "auth_insert_own_leads"
  on leads for insert to authenticated
  with check (es_miembro_de_org(organizacion_id));

create policy "auth_update_own_leads"
  on leads for update to authenticated
  using      (es_miembro_de_org(organizacion_id))
  with check (es_miembro_de_org(organizacion_id));

create policy "auth_delete_own_leads"
  on leads for delete to authenticated
  using (es_miembro_de_org(organizacion_id));

-- ┌─ COMERCIALES ─────────────────────────────────────────────────────
create policy "anon_select_demo_comerciales"
  on comerciales for select to anon
  using (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_insert_demo_comerciales"
  on comerciales for insert to anon
  with check (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_update_demo_comerciales"
  on comerciales for update to anon
  using      (organizacion_id in (select id from organizaciones where modo = 'demo'))
  with check (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_delete_demo_comerciales"
  on comerciales for delete to anon
  using (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "auth_select_own_comerciales"
  on comerciales for select to authenticated
  using (es_miembro_de_org(organizacion_id));

create policy "auth_insert_own_comerciales"
  on comerciales for insert to authenticated
  with check (es_miembro_de_org(organizacion_id));

create policy "auth_update_own_comerciales"
  on comerciales for update to authenticated
  using      (es_miembro_de_org(organizacion_id))
  with check (es_miembro_de_org(organizacion_id));

create policy "auth_delete_own_comerciales"
  on comerciales for delete to authenticated
  using (es_miembro_de_org(organizacion_id));

-- ┌─ CONTACTOS ───────────────────────────────────────────────────────
create policy "anon_select_demo_contactos"
  on contactos for select to anon
  using (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_insert_demo_contactos"
  on contactos for insert to anon
  with check (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_update_demo_contactos"
  on contactos for update to anon
  using      (organizacion_id in (select id from organizaciones where modo = 'demo'))
  with check (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_delete_demo_contactos"
  on contactos for delete to anon
  using (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "auth_select_own_contactos"
  on contactos for select to authenticated
  using (es_miembro_de_org(organizacion_id));

create policy "auth_insert_own_contactos"
  on contactos for insert to authenticated
  with check (es_miembro_de_org(organizacion_id));

create policy "auth_update_own_contactos"
  on contactos for update to authenticated
  using      (es_miembro_de_org(organizacion_id))
  with check (es_miembro_de_org(organizacion_id));

create policy "auth_delete_own_contactos"
  on contactos for delete to authenticated
  using (es_miembro_de_org(organizacion_id));

-- ┌─ AGENDA ──────────────────────────────────────────────────────────
create policy "anon_select_demo_agenda"
  on agenda for select to anon
  using (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_insert_demo_agenda"
  on agenda for insert to anon
  with check (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_update_demo_agenda"
  on agenda for update to anon
  using      (organizacion_id in (select id from organizaciones where modo = 'demo'))
  with check (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_delete_demo_agenda"
  on agenda for delete to anon
  using (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "auth_select_own_agenda"
  on agenda for select to authenticated
  using (es_miembro_de_org(organizacion_id));

create policy "auth_insert_own_agenda"
  on agenda for insert to authenticated
  with check (es_miembro_de_org(organizacion_id));

create policy "auth_update_own_agenda"
  on agenda for update to authenticated
  using      (es_miembro_de_org(organizacion_id))
  with check (es_miembro_de_org(organizacion_id));

create policy "auth_delete_own_agenda"
  on agenda for delete to authenticated
  using (es_miembro_de_org(organizacion_id));

-- ┌─ PATRONES ────────────────────────────────────────────────────────
create policy "anon_select_demo_patrones"
  on patrones for select to anon
  using (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_insert_demo_patrones"
  on patrones for insert to anon
  with check (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_update_demo_patrones"
  on patrones for update to anon
  using      (organizacion_id in (select id from organizaciones where modo = 'demo'))
  with check (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "anon_delete_demo_patrones"
  on patrones for delete to anon
  using (organizacion_id in (select id from organizaciones where modo = 'demo'));

create policy "auth_select_own_patrones"
  on patrones for select to authenticated
  using (es_miembro_de_org(organizacion_id));

create policy "auth_insert_own_patrones"
  on patrones for insert to authenticated
  with check (es_miembro_de_org(organizacion_id));

create policy "auth_update_own_patrones"
  on patrones for update to authenticated
  using      (es_miembro_de_org(organizacion_id))
  with check (es_miembro_de_org(organizacion_id));

create policy "auth_delete_own_patrones"
  on patrones for delete to authenticated
  using (es_miembro_de_org(organizacion_id));

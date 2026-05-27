-- Pantalla /patrones · detección de patrones del producto.
-- Reemplaza la view v_patrones_ia (que solo manejaba un patrón hardcoded)
-- por una tabla real con varios detectores que escriben filas.

-- 1) Tipo enum de patrones.
do $$ begin
  create type patron_tipo as enum (
    'operativo',
    'atasco',
    'oportunidad',
    'tendencia',
    'sugerencia'
  );
exception when duplicate_object then null; end $$;

-- 2) Tabla de patrones detectados.
create table if not exists patrones (
  id uuid primary key default gen_random_uuid(),
  tipo patron_tipo not null,
  -- Clave única por detector + ventana de tiempo. Permite UPSERT idempotente:
  -- si el detector corre 2 veces para la misma semana, actualiza en vez de
  -- duplicar.
  clave_unica text not null unique,
  -- Title/explainer pueden contener <strong>...</strong> (HTML restringido).
  -- El contenido viene de detectores internos, no de input del usuario.
  titulo text not null,
  explainer text not null,
  detectado_en timestamptz not null default now(),
  resuelto_en timestamptz,
  resuelto_por uuid references comerciales(id),
  leads_afectados uuid[] not null default '{}',
  valor_en_juego numeric(10, 2) not null default 0,
  -- metadata.chart : ChartData opcional (para tipo='oportunidad').
  -- metadata.label_count : texto del label de "leads afectados".
  metadata jsonb not null default '{}'::jsonb,
  accion_label text,   -- texto del CTA principal ("Revisar regla", "Ver en pipeline").
  accion_href text,    -- destino del CTA (URL relativa).
  organizacion_id text default 'demo-org'
);

-- Índice del path crítico: leer activos ordenados por detección reciente.
create index if not exists idx_patrones_activos
  on patrones (detectado_en desc)
  where resuelto_en is null;

-- 3) RLS — demo pública anon. Mismo modelo que el resto de tablas.
alter table patrones enable row level security;

drop policy if exists "anon lee patrones" on patrones;
create policy "anon lee patrones" on patrones
  for select to anon using (true);

drop policy if exists "anon inserta patrones" on patrones;
create policy "anon inserta patrones" on patrones
  for insert to anon with check (true);

drop policy if exists "anon actualiza patrones" on patrones;
create policy "anon actualiza patrones" on patrones
  for update to anon using (true) with check (true);

drop policy if exists "anon borra patrones" on patrones;
create policy "anon borra patrones" on patrones
  for delete to anon using (true);

-- 4) Dropear la view vieja. La query getPrimerPatronIa pasa a leer
-- directamente de la tabla nueva.
drop view if exists v_patrones_ia;

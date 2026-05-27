-- Multi-tenancy · Sprint 1 (solo estructura, sin RLS nuevo).
--
-- Crea la tabla `organizaciones`, la pivot `usuarios_organizaciones`, y
-- agrega `organizacion_id` a TODAS las tablas de negocio (leads,
-- comerciales, contactos, agenda, patrones).
--
-- Mantiene la app funcionando exactamente igual: las policies RLS
-- existentes (anon abierto) no se modifican; los DEFAULT apuntan a la org
-- demo así el seed actual (que no pasa organizacion_id) sigue
-- insertando sin tocar TypeScript.
--
-- FIXME Sprint 6 (refactor INSERTs en lib/seed.ts, app/api/reset, y
-- todas las queries que crean filas) — quitar los DEFAULT de cada
-- organizacion_id. Hasta que todos los INSERT pasen org explícito, el
-- DEFAULT es la red de seguridad. Si lo sacás antes (ej. Sprint 2 con
-- RLS), no rompe nada visible — la RLS no exige columna en el INSERT,
-- solo el NOT NULL — pero la app queda dependiendo del DEFAULT para
-- todo, frágil.
--
-- Sprint 2 (RLS) tiene su propio TODO separado: reescribir las
-- policies de cada tabla para filtrar por
-- organizacion_id = current_org_id() y actualizar lib/auth.ts.
--
-- Orden de operaciones (importa):
--   a) Crear organizaciones + usuarios_organizaciones.
--   b) DROP de TODAS las views que tocan leads/comerciales/contactos —
--      porque varias hacen `SELECT l.*` y romperían el CREATE OR
--      REPLACE al cambiar el shape.
--   c) DROP de la columna patrones.organizacion_id (era TEXT
--      'demo-org', migración 20260526121100). La nueva es UUID FK.
--   d) ADD COLUMN organizacion_id nullable en cada tabla.
--   e) Backfill via subquery por slug (no UUID hardcodeado).
--   f) SET DEFAULT + SET NOT NULL.
--   g) Índices compuestos.
--   h) RECREATE de las views con security_invoker = true (para Sprint 2).

-- ────────────────────────────────────────────────────────────────────
-- 1) Tabla organizaciones + seed inicial.
-- ────────────────────────────────────────────────────────────────────

create table organizaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text unique not null,
  creada_en timestamptz not null default now(),
  config jsonb not null default '{}'::jsonb,
  modo text not null default 'production' check (modo in ('demo', 'production'))
);

insert into organizaciones (id, nombre, slug, modo)
values ('00000000-0000-0000-0000-000000000001', 'Demo pública', 'demo', 'demo')
on conflict (slug) do nothing;

insert into organizaciones (nombre, slug, modo)
values ('JS80', 'js80', 'production')
on conflict (slug) do nothing;

-- ────────────────────────────────────────────────────────────────────
-- 2) Pivot usuarios ↔ organizaciones (roles).
--    CHECK alineado con el set definido en Sprint 1: owner / admin /
--    comercial / lector. lib/auth.ts NO se toca acá; se ajusta en Sprint 3.
-- ────────────────────────────────────────────────────────────────────

create table usuarios_organizaciones (
  usuario_id uuid not null references auth.users(id) on delete cascade,
  organizacion_id uuid not null references organizaciones(id) on delete restrict,
  rol text not null check (rol in ('owner', 'admin', 'comercial', 'lector')),
  creado_en timestamptz not null default now(),
  primary key (usuario_id, organizacion_id)
);

-- Índice inverso para "qué usuarios tiene esta org".
create index idx_usuarios_organizaciones_org
  on usuarios_organizaciones (organizacion_id);

-- ────────────────────────────────────────────────────────────────────
-- 3) DROP de TODAS las views que dependen de leads/comerciales/contactos.
--    Se recrean al final con security_invoker = true.
-- ────────────────────────────────────────────────────────────────────

drop view if exists v_pipeline_resumen;
drop view if exists v_leads_frios;
drop view if exists v_oportunidades_dia;
drop view if exists v_leads_kanban;
drop view if exists v_comerciales_metricas;
drop view if exists v_trend_mensual;
drop view if exists v_tiempo_por_etapa;
drop view if exists v_ganados_mes;
drop view if exists v_perdidos_mes;
drop view if exists v_ranking_cierres_mes;
drop view if exists v_motivos_perdida_mes;

-- ────────────────────────────────────────────────────────────────────
-- 4) Eliminar la columna patrones.organizacion_id TEXT vieja
--    (era `text default 'demo-org'`, migración 20260526121100).
--    Se recrea como UUID FK en el paso 5.
-- ────────────────────────────────────────────────────────────────────

alter table patrones drop column if exists organizacion_id;

-- ────────────────────────────────────────────────────────────────────
-- 5) Agregar organizacion_id (nullable) en todas las tablas de negocio.
--    FK con ON DELETE RESTRICT: borrar una org con datos cargados es
--    irrecuperable, requerimos limpieza explícita.
-- ────────────────────────────────────────────────────────────────────

alter table leads
  add column organizacion_id uuid
  references organizaciones(id) on delete restrict;

alter table comerciales
  add column organizacion_id uuid
  references organizaciones(id) on delete restrict;

alter table contactos
  add column organizacion_id uuid
  references organizaciones(id) on delete restrict;

alter table agenda
  add column organizacion_id uuid
  references organizaciones(id) on delete restrict;

alter table patrones
  add column organizacion_id uuid
  references organizaciones(id) on delete restrict;

-- ────────────────────────────────────────────────────────────────────
-- 6) Backfill — toda la data actual se asigna a la org demo.
--    Vía subquery por slug, no UUID hardcodeado (portable entre envs).
-- ────────────────────────────────────────────────────────────────────

update leads
  set organizacion_id = (select id from organizaciones where slug = 'demo')
  where organizacion_id is null;

update comerciales
  set organizacion_id = (select id from organizaciones where slug = 'demo')
  where organizacion_id is null;

update contactos
  set organizacion_id = (select id from organizaciones where slug = 'demo')
  where organizacion_id is null;

update agenda
  set organizacion_id = (select id from organizaciones where slug = 'demo')
  where organizacion_id is null;

update patrones
  set organizacion_id = (select id from organizaciones where slug = 'demo')
  where organizacion_id is null;

-- ────────────────────────────────────────────────────────────────────
-- 7) DEFAULT apuntando a la org demo + NOT NULL.
--
--    FIXME Sprint 6 (refactor INSERTs en lib/seed.ts, app/api/reset, y
--    todas las queries que crean filas): eliminá estos DEFAULT cuando
--    todos los INSERT pasen organizacion_id explícito. Hasta entonces
--    los DEFAULT son la red de seguridad — sacarlos antes (ej. en
--    Sprint 2 con RLS) no rompe nada visible pero deja la app
--    dependiendo del DEFAULT para todo, frágil.
--
--    Usamos DO/EXECUTE porque DEFAULT no acepta subqueries — hay que
--    materializar el UUID en una variable y formatearlo en el SQL.
-- ────────────────────────────────────────────────────────────────────

do $$
declare
  v_demo_id uuid;
begin
  select id into v_demo_id from organizaciones where slug = 'demo';
  if v_demo_id is null then
    raise exception 'No se encontró la organización con slug=demo. Revisar inserts del paso 1.';
  end if;

  execute format('alter table leads        alter column organizacion_id set default %L', v_demo_id);
  execute format('alter table comerciales  alter column organizacion_id set default %L', v_demo_id);
  execute format('alter table contactos    alter column organizacion_id set default %L', v_demo_id);
  execute format('alter table agenda       alter column organizacion_id set default %L', v_demo_id);
  execute format('alter table patrones     alter column organizacion_id set default %L', v_demo_id);
end $$;

alter table leads        alter column organizacion_id set not null;
alter table comerciales  alter column organizacion_id set not null;
alter table contactos    alter column organizacion_id set not null;
alter table agenda       alter column organizacion_id set not null;
alter table patrones     alter column organizacion_id set not null;

-- ────────────────────────────────────────────────────────────────────
-- 8) Índices compuestos.
--    Toda query post-multi-tenant va a ser `WHERE organizacion_id = X
--    AND <algo>`. Los compuestos sirven mejor que un index simple por
--    org_id.
-- ────────────────────────────────────────────────────────────────────

create index idx_leads_org_estado          on leads (organizacion_id, estado);
create index idx_leads_org_responsable     on leads (organizacion_id, responsable_id);
create index idx_contactos_org_fecha       on contactos (organizacion_id, fecha desc);
create index idx_agenda_org_fecha          on agenda (organizacion_id, fecha);
create index idx_comerciales_org           on comerciales (organizacion_id);

-- patrones: filtro hot es "activos (resuelto_en IS NULL) ordenados por
-- detección reciente". Partial index, mejor que el ya existente
-- idx_patrones_activos cuando entre el filtro por org.
create index idx_patrones_org_activos
  on patrones (organizacion_id, detectado_en desc)
  where resuelto_en is null;

-- ────────────────────────────────────────────────────────────────────
-- 9) RECREATE de todas las views con security_invoker = true.
--    Cuando RLS entre en Sprint 2, las views van a respetar las
--    policies de las tablas base (Postgres 15+).
--
--    Shape idéntico al original para que la app siga funcionando.
--    Las views que hacen `SELECT l.*` heredan organizacion_id
--    automáticamente.
-- ────────────────────────────────────────────────────────────────────

-- 9.1) v_pipeline_resumen
create view v_pipeline_resumen
  with (security_invoker = true) as
select
  estado,
  count(*)::int as cantidad,
  coalesce(sum(valor_estimado), 0)::numeric(12, 2) as valor_total
from leads
where estado <> 'ganado' or fecha_creacion > now() - interval '30 days'
group by estado;

-- 9.2) v_leads_frios
create view v_leads_frios
  with (security_invoker = true) as
select
  l.*,
  c.nombre as comercial_nombre,
  c.iniciales as comercial_iniciales,
  c.avatar_gradient as comercial_avatar,
  case
    when l.fecha_ultimo_contacto is null
      then extract(day from now() - l.fecha_creacion)::int
    else extract(day from now() - l.fecha_ultimo_contacto)::int
  end as dias_frio
from leads l
left join comerciales c on c.id = l.responsable_id
where
  l.estado in ('nuevo', 'conversacion', 'propuesta')
  and (
    l.fecha_ultimo_contacto is null
    or l.fecha_ultimo_contacto < now() - interval '5 days'
  )
order by l.fecha_ultimo_contacto asc nulls first;

-- 9.3) v_oportunidades_dia
create view v_oportunidades_dia
  with (security_invoker = true) as
select
  l.*,
  c.nombre as comercial_nombre,
  c.iniciales as comercial_iniciales,
  c.avatar_gradient as comercial_avatar
from leads l
left join comerciales c on c.id = l.responsable_id
where
  l.estado in ('conversacion', 'propuesta', 'cierre')
  and l.proximo_paso_fecha is not null
  and l.proximo_paso_fecha::date <= current_date
order by l.proximo_paso_fecha asc;

-- 9.4) v_leads_kanban
create view v_leads_kanban
  with (security_invoker = true) as
select
  l.*,
  c.nombre as comercial_nombre,
  c.iniciales as comercial_iniciales,
  c.avatar_gradient as comercial_avatar,
  coalesce(
    (
      select extract(day from now() - max(fecha))::int
      from contactos
      where lead_id = l.id and canal = 'cambio_estado'
    ),
    extract(day from now() - l.fecha_creacion)::int
  ) as dias_en_estado
from leads l
left join comerciales c on c.id = l.responsable_id;

-- 9.5) v_comerciales_metricas
create view v_comerciales_metricas
  with (security_invoker = true) as
select
  c.id,
  c.nombre,
  c.iniciales,
  c.avatar_gradient,
  c.email,
  c.creado_en,
  c.meta_mensual,

  count(l.id) filter (where l.estado <> 'ganado')::int as leads_activos,

  coalesce(
    sum(l.valor_estimado) filter (where l.estado <> 'ganado'),
    0
  )::numeric(12, 2) as pipeline_valor,

  count(l.id) filter (
    where l.estado = 'ganado'
    and date_trunc('month', coalesce(l.fecha_ultimo_contacto, l.fecha_creacion))
        = date_trunc('month', now())
  )::int as ganados_mes_cantidad,

  coalesce(
    sum(l.valor_estimado) filter (
      where l.estado = 'ganado'
      and date_trunc('month', coalesce(l.fecha_ultimo_contacto, l.fecha_creacion))
          = date_trunc('month', now())
    ),
    0
  )::numeric(12, 2) as ganados_mes_valor,

  coalesce(
    (
      count(l.id) filter (
        where l.estado = 'ganado'
        and coalesce(l.fecha_ultimo_contacto, l.fecha_creacion) > now() - interval '90 days'
      )::numeric
      / nullif(
          count(l.id) filter (
            where l.fecha_creacion > now() - interval '90 days'
          ),
          0
        )
    ) * 100,
    0
  )::numeric(5, 2) as ratio_cierre,

  count(l.id) filter (
    where l.estado in ('nuevo', 'conversacion', 'propuesta')
    and (
      l.fecha_ultimo_contacto is null
      or l.fecha_ultimo_contacto < now() - interval '5 days'
    )
  )::int as leads_frios
from comerciales c
left join leads l on l.responsable_id = c.id
group by
  c.id, c.nombre, c.iniciales, c.avatar_gradient, c.email,
  c.creado_en, c.meta_mensual;

-- 9.6) v_trend_mensual
create view v_trend_mensual
  with (security_invoker = true) as
with meses as (
  select generate_series(0, 11) as meses_atras
), datos as (
  select
    m.meses_atras,
    date_trunc('month', now() - (m.meses_atras::text || ' months')::interval) as mes,
    (select count(*) from leads l
      where date_trunc('month', l.fecha_creacion)
          = date_trunc('month', now() - (m.meses_atras::text || ' months')::interval)
    )::int as creados,
    (select count(*) from leads l
      where l.estado = 'ganado'
        and date_trunc('month', coalesce(l.fecha_ultimo_contacto, l.fecha_creacion))
          = date_trunc('month', now() - (m.meses_atras::text || ' months')::interval)
    )::int as ganados
  from meses m
)
select meses_atras, mes, creados, ganados
from datos
order by mes desc;

-- 9.7) v_tiempo_por_etapa
create view v_tiempo_por_etapa
  with (security_invoker = true) as
with cambios as (
  select
    c.lead_id,
    c.fecha,
    c.metadata->>'from' as estado_from,
    c.metadata->>'to' as estado_to
  from contactos c
  where c.canal = 'cambio_estado'
    and c.metadata ? 'from' and c.metadata ? 'to'
),
ingresos as (
  select id as lead_id, fecha_creacion as fecha, 'inicio' as estado_to
  from leads
),
eventos as (
  select lead_id, fecha, estado_to from cambios
  union all
  select lead_id, fecha, estado_to from ingresos
),
con_anterior as (
  select
    lead_id,
    estado_to,
    fecha,
    lag(fecha) over (partition by lead_id order by fecha) as fecha_anterior,
    lag(estado_to) over (partition by lead_id order by fecha) as estado_anterior
  from eventos
)
select
  estado_anterior as estado_from,
  estado_to,
  count(*)::int as cantidad_transiciones,
  round(avg(extract(epoch from fecha - fecha_anterior) / 86400))::int as dias_promedio
from con_anterior
where fecha_anterior is not null
  and estado_anterior is not null
  and estado_to <> 'inicio'
group by estado_anterior, estado_to;

-- 9.8) v_ganados_mes
create view v_ganados_mes
  with (security_invoker = true) as
select
  l.id,
  l.nombre,
  l.origen,
  l.estado,
  l.valor_estimado,
  l.valor_final,
  coalesce(l.valor_final, l.valor_estimado) as valor_cerrado,
  l.tipo_negocio,
  l.meses_compromiso,
  l.responsable_id,
  l.fecha_creacion,
  coalesce(l.fecha_cierre, l.fecha_ultimo_contacto, l.fecha_creacion) as fecha_cierre_efectiva,
  l.comentario_cierre,
  c.nombre as responsable_nombre,
  c.iniciales as responsable_iniciales,
  c.avatar_gradient as responsable_avatar,
  greatest(
    0,
    (coalesce(l.fecha_cierre, l.fecha_ultimo_contacto, l.fecha_creacion)::date - l.fecha_creacion::date)::int
  ) as dias_cierre
from leads l
left join comerciales c on c.id = l.responsable_id
where l.estado = 'ganado'
  and coalesce(l.fecha_cierre, l.fecha_creacion) >= date_trunc('month', now())
  and coalesce(l.fecha_cierre, l.fecha_creacion) < date_trunc('month', now()) + interval '1 month'
order by coalesce(l.valor_final, l.valor_estimado) desc;

-- 9.9) v_perdidos_mes
create view v_perdidos_mes
  with (security_invoker = true) as
select
  l.id,
  l.nombre,
  l.origen,
  l.estado,
  l.valor_estimado,
  l.motivo_perdida,
  l.detalle_perdida,
  l.responsable_id,
  l.fecha_creacion,
  coalesce(l.fecha_cierre, l.fecha_ultimo_contacto, l.fecha_creacion) as fecha_cierre_efectiva,
  c.nombre as responsable_nombre,
  c.iniciales as responsable_iniciales,
  c.avatar_gradient as responsable_avatar,
  (
    select co.metadata->>'from'
    from contactos co
    where co.lead_id = l.id
      and co.canal = 'cambio_estado'
      and co.metadata->>'to' = 'perdido'
    order by co.fecha desc
    limit 1
  ) as estado_previo
from leads l
left join comerciales c on c.id = l.responsable_id
where l.estado = 'perdido'
  and coalesce(l.fecha_cierre, l.fecha_creacion) >= date_trunc('month', now())
  and coalesce(l.fecha_cierre, l.fecha_creacion) < date_trunc('month', now()) + interval '1 month'
order by l.valor_estimado desc;

-- 9.10) v_ranking_cierres_mes
create view v_ranking_cierres_mes
  with (security_invoker = true) as
select
  c.id,
  c.nombre,
  c.iniciales,
  c.avatar_gradient,
  coalesce(count(l.id) filter (where l.estado = 'ganado'), 0)::int as leads_ganados,
  coalesce(sum(coalesce(l.valor_final, l.valor_estimado))
    filter (where l.estado = 'ganado'), 0) as valor_total,
  coalesce(
    round(
      100.0 * count(l.id) filter (where l.estado = 'ganado')
      / nullif(
        (
          select count(*)
          from leads l2
          where l2.responsable_id = c.id
            and l2.fecha_creacion >= date_trunc('month', now())
            and l2.fecha_creacion < date_trunc('month', now()) + interval '1 month'
        ),
        0
      )
    )::int,
    0
  ) as ratio_cierre
from comerciales c
left join leads l on l.responsable_id = c.id
  and coalesce(l.fecha_cierre, l.fecha_creacion) >= date_trunc('month', now())
  and coalesce(l.fecha_cierre, l.fecha_creacion) < date_trunc('month', now()) + interval '1 month'
group by c.id, c.nombre, c.iniciales, c.avatar_gradient
order by valor_total desc, leads_ganados desc;

-- 9.11) v_motivos_perdida_mes
create view v_motivos_perdida_mes
  with (security_invoker = true) as
select
  motivo_perdida as motivo,
  count(*)::int as cantidad,
  coalesce(sum(valor_estimado), 0) as valor_total,
  round(100.0 * count(*) / sum(count(*)) over ())::int as porcentaje
from leads
where estado = 'perdido'
  and motivo_perdida is not null
  and coalesce(fecha_cierre, fecha_creacion) >= date_trunc('month', now())
  and coalesce(fecha_cierre, fecha_creacion) < date_trunc('month', now()) + interval '1 month'
group by motivo_perdida
order by cantidad desc, valor_total desc;

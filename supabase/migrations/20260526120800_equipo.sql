-- Equipo: meta mensual por comercial + view de métricas agregadas.

-- 1) Meta mensual por comercial (USD). Default 15k, ajustable por comercial.
alter table comerciales add column if not exists meta_mensual numeric(10, 2) not null default 15000;

-- 2) View que precalcula las métricas del equipo / por comercial.
--    Usamos FILTER (WHERE ...) en cada agregado para no traer joins
--    cruzados ni sub-queries por columna.
create or replace view v_comerciales_metricas as
select
  c.id,
  c.nombre,
  c.iniciales,
  c.avatar_gradient,
  c.email,
  c.creado_en,
  c.meta_mensual,

  -- Leads activos (todo menos ganado)
  count(l.id) filter (where l.estado <> 'ganado')::int as leads_activos,

  -- Valor del pipeline activo
  coalesce(
    sum(l.valor_estimado) filter (where l.estado <> 'ganado'),
    0
  )::numeric(12, 2) as pipeline_valor,

  -- Ganados del mes actual (usamos fecha_creacion como proxy de "cuando se
  -- registró el lead que después ganamos" — para la demo alcanza).
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

  -- Ratio de cierre últimos 90 días (porcentaje 0-100).
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

  -- Leads frío (activos sin contacto +5 días, o nunca contactados).
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

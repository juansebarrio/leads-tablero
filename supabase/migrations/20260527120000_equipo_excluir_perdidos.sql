-- D-3 · `/equipo` mostraba leads_activos y pipeline_valor incluyendo perdidos
-- porque el filter era `estado <> 'ganado'`. Acotamos a los estados activos
-- explícitos (los mismos que muestra el kanban menos ganado).

create or replace view v_comerciales_metricas as
select
  c.id,
  c.nombre,
  c.iniciales,
  c.avatar_gradient,
  c.email,
  c.creado_en,
  c.meta_mensual,

  count(l.id) filter (
    where l.estado in ('nuevo', 'conversacion', 'propuesta', 'cierre')
  )::int as leads_activos,

  coalesce(
    sum(l.valor_estimado) filter (
      where l.estado in ('nuevo', 'conversacion', 'propuesta', 'cierre')
    ),
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

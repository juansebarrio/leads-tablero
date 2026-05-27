-- Pantalla /cerrados · vistas agregadas del mes en curso.
-- 4 vistas: ganados, perdidos, ranking de comerciales, motivos de pérdida.
-- Todas usan COALESCE(fecha_cierre, fecha_creacion) como fallback porque
-- en el seed los leads ganados arrastrados no tienen fecha_cierre poblada
-- (esa columna solo se llena via el drawer "Confirmar ganado").

-- 1) Ganados del mes con responsable + días de cierre.
drop view if exists v_ganados_mes;
create view v_ganados_mes as
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

-- 2) Perdidos del mes con motivo + estado previo (deducido del último
-- cambio_estado anterior al perdido).
drop view if exists v_perdidos_mes;
create view v_perdidos_mes as
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
  -- Estado en el que estaba antes de perderse: lo deducimos del último
  -- registro cambio_estado.metadata.from. Si no hay, queda null.
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

-- 3) Ranking de comerciales por valor ganado en el mes.
-- Incluye todos los comerciales (LEFT JOIN); los que no ganaron quedan en
-- 0 y al ordenar por valor desc caen al final.
-- Ratio = ganados_del_mes / leads_creados_por_él_en_el_mes.
drop view if exists v_ranking_cierres_mes;
create view v_ranking_cierres_mes as
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

-- 4) Motivos de pérdida del mes ordenados por cantidad.
-- El porcentaje suma 100% sobre los perdidos del mes.
drop view if exists v_motivos_perdida_mes;
create view v_motivos_perdida_mes as
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

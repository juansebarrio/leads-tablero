-- Vistas derivadas que alimentan el tablero.

-- Resumen del pipeline: count y suma por estado.
create or replace view v_pipeline_resumen as
select
  estado,
  count(*)::int as cantidad,
  coalesce(sum(valor_estimado), 0)::numeric(12, 2) as valor_total
from leads
where estado <> 'ganado' or fecha_creacion > now() - interval '30 days'
group by estado;

-- Leads frios: sin contacto hace >5 días, ordenados por antigüedad.
create or replace view v_leads_frios as
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

-- Oportunidades del día: proximo paso hoy o vencido.
create or replace view v_oportunidades_dia as
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

-- Patrones de IA: detección simple (por ahora, solo asignación pendiente).
create or replace view v_patrones_ia as
select
  'asignacion_pendiente' as patron,
  count(*)::int as cantidad,
  array_agg(l.id) as lead_ids,
  min(l.fecha_creacion) as desde,
  max(l.fecha_creacion) as hasta
from leads l
where
  l.origen = 'formulario'
  and l.responsable_id is null
  and l.fecha_creacion > now() - interval '15 days'
having count(*) >= 3;

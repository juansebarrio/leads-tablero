-- Vistas para /conversion: funnel, tiempo por etapa, tendencia mensual.
-- También arregla el trigger para que los `cambio_estado` no pisen
-- `fecha_ultimo_contacto` (son cambios internos, no contactos con cliente).

create or replace function tg_actualizar_fecha_ultimo_contacto()
returns trigger language plpgsql as $$
begin
  -- Cambios de estado no son contactos con cliente; no afectan el "frío".
  if new.canal = 'cambio_estado' then
    return new;
  end if;
  update leads
    set fecha_ultimo_contacto = greatest(
      coalesce(fecha_ultimo_contacto, 'epoch'::timestamptz),
      new.fecha
    )
    where id = new.lead_id;
  return new;
end;
$$;


-- Helper: leads ingresados en un mes específico (offset desde now()).
-- Lo expresamos como funciones para parametrizar el período.
create or replace function funnel_para_mes(p_meses_atras int)
returns table(
  nuevos_total int,
  conversacion_acum int,
  propuesta_acum int,
  cierre_acum int,
  ganados int,
  valor_ganado numeric
)
language sql stable as $$
  select
    (count(*) filter (where l.estado in ('nuevo','conversacion','propuesta','cierre','ganado')))::int as nuevos_total,
    (count(*) filter (where l.estado in ('conversacion','propuesta','cierre','ganado')))::int as conversacion_acum,
    (count(*) filter (where l.estado in ('propuesta','cierre','ganado')))::int as propuesta_acum,
    (count(*) filter (where l.estado in ('cierre','ganado')))::int as cierre_acum,
    (count(*) filter (where l.estado = 'ganado'))::int as ganados,
    coalesce(sum(l.valor_estimado) filter (where l.estado = 'ganado'), 0)::numeric(12,2) as valor_ganado
  from leads l
  where date_trunc('month', l.fecha_creacion)
      = date_trunc('month', now() - (p_meses_atras::text || ' months')::interval);
$$;

-- Tendencia mensual: creados / ganados por mes durante N meses pasados.
-- Devuelve hasta 12 meses; el componente toma los últimos N.
create or replace view v_trend_mensual as
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

-- Tiempo promedio por transición entre etapas. Calculamos diff entre
-- cambios_estado consecutivos para cada lead, agrupado por transición
-- (ej: nuevo→conversacion, conversacion→propuesta, etc.).
create or replace view v_tiempo_por_etapa as
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
-- Para cada lead, el primer "from" es el estado inicial (cuando se creó);
-- usamos también la fecha de creación del lead como punto de partida.
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

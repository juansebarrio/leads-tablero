-- Cambios de estado de leads se registran como contactos especiales.
-- Esto da historial completo del pipeline sin sumar columnas a la tabla leads.

-- 1) Ampliar el CHECK de canal para aceptar 'cambio_estado'.
alter table contactos drop constraint if exists contactos_canal_check;
alter table contactos add constraint contactos_canal_check
  check (canal in ('mail', 'llamado', 'whatsapp', 'reunion', 'linkedin', 'cambio_estado'));

-- 2) Columna metadata para guardar { from, to } y futuras propiedades.
alter table contactos add column if not exists metadata jsonb not null default '{}'::jsonb;

-- 3) View que el kanban consume. Incluye comercial y dias_en_estado.
create or replace view v_leads_kanban as
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

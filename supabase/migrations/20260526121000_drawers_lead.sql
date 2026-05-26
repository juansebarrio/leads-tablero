-- Drawers de Editar / Reasignar / Marcar perdido / Confirmar ganado.
-- Suma estado 'perdido' + columnas para registrar el cierre del lead.

-- 1) Ampliar CHECK de leads.estado para aceptar 'perdido'.
alter table leads drop constraint if exists leads_estado_check;
alter table leads add constraint leads_estado_check
  check (estado in ('nuevo', 'conversacion', 'propuesta', 'cierre', 'ganado', 'perdido'));

-- 2) Columnas de cierre del lead. Todas nullable: solo se llenan cuando
--    se marca como ganado/perdido.
alter table leads add column if not exists motivo_perdida text
  check (motivo_perdida is null or motivo_perdida in
    ('precio','timing','competencia','no_respondio','cambio_necesidad','otro'));
alter table leads add column if not exists detalle_perdida text;
alter table leads add column if not exists valor_final numeric(10, 2);
alter table leads add column if not exists fecha_cierre timestamptz;
alter table leads add column if not exists comentario_cierre text;

-- 3) Ampliar el CHECK de contactos.canal para aceptar 'reasignacion'
--    (registra cambios de responsable en el historial sin afectar la
--    timeline de "contactos con cliente").
alter table contactos drop constraint if exists contactos_canal_check;
alter table contactos add constraint contactos_canal_check
  check (canal in (
    'mail', 'llamado', 'whatsapp', 'reunion', 'linkedin',
    'cambio_estado', 'reasignacion'
  ));

-- 4) Update del trigger: ignora reasignacion también (no es contacto con
--    cliente).
create or replace function tg_actualizar_fecha_ultimo_contacto()
returns trigger language plpgsql as $$
begin
  if new.canal in ('cambio_estado', 'reasignacion') then
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

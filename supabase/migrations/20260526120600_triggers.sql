-- Trigger: al insertar un contacto, actualizar la fecha de último contacto del lead.

create or replace function tg_actualizar_fecha_ultimo_contacto()
returns trigger
language plpgsql
as $$
begin
  update leads
    set fecha_ultimo_contacto = greatest(
      coalesce(fecha_ultimo_contacto, 'epoch'::timestamptz),
      new.fecha
    )
    where id = new.lead_id;
  return new;
end;
$$;

create trigger contactos_actualiza_lead
  after insert on contactos
  for each row
  execute function tg_actualizar_fecha_ultimo_contacto();

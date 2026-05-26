-- Leads: el core del tablero.
create table leads (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  origen text not null check (origen in ('formulario', 'referido', 'linkedin', 'whatsapp')),
  origen_detalle text,
  estado text not null default 'nuevo'
    check (estado in ('nuevo', 'conversacion', 'propuesta', 'cierre', 'ganado')),
  valor_estimado numeric(10, 2) not null,
  tipo_negocio text not null check (tipo_negocio in ('recurrente', 'proyecto')),
  meses_compromiso int
    check (
      (tipo_negocio = 'recurrente' and meses_compromiso is not null)
      or (tipo_negocio = 'proyecto' and meses_compromiso is null)
    ),
  responsable_id uuid references comerciales (id) on delete set null,
  fecha_creacion timestamptz not null default now(),
  fecha_ultimo_contacto timestamptz,
  proximo_paso text,
  proximo_paso_fecha timestamptz,
  temperatura text not null default 'cool'
    check (temperatura in ('hot', 'warm', 'med', 'cool')),
  estado_oportunidad text
    check (estado_oportunidad in ('caliente', 'esperando_firma', 'por_reactivar', 'sin_asignar'))
);

create index leads_estado_idx on leads (estado);
create index leads_responsable_idx on leads (responsable_id);
create index leads_fecha_ultimo_contacto_idx on leads (fecha_ultimo_contacto);
create index leads_proximo_paso_fecha_idx on leads (proximo_paso_fecha);

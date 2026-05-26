-- Comerciales: usuarios del estudio que llevan leads.
create extension if not exists "pgcrypto";

create table comerciales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  iniciales text not null check (char_length(iniciales) = 2),
  avatar_gradient text not null,
  email text not null unique,
  creado_en timestamptz not null default now()
);

create index comerciales_email_idx on comerciales (email);

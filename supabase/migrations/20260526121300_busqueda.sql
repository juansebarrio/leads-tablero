-- Búsqueda global (⌘K). pg_trgm + GIN para que ilike '%xxx%' use índice
-- en lugar de seq scan. Con el seed actual (~38 leads) no se nota, pero
-- mantiene la query barata cuando crece.

create extension if not exists pg_trgm;

create index if not exists idx_leads_nombre_trgm
  on leads using gin (nombre gin_trgm_ops);

create index if not exists idx_comerciales_nombre_trgm
  on comerciales using gin (nombre gin_trgm_ops);

create index if not exists idx_contactos_nota_trgm
  on contactos using gin (nota gin_trgm_ops);

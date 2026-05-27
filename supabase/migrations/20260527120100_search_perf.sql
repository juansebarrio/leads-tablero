-- A-4 · Búsqueda global con índices trigram para velocidad cuando el seed crece.
-- `ilike` en Postgres ya es case-insensitive; el índice gin_trgm_ops acelera
-- patrones con wildcards en ambos lados (`%texto%`) que de otra forma scanean
-- toda la tabla.

create extension if not exists pg_trgm;

create index if not exists idx_leads_nombre_trgm
  on leads using gin (nombre gin_trgm_ops);

create index if not exists idx_contactos_nota_trgm
  on contactos using gin (nota gin_trgm_ops);

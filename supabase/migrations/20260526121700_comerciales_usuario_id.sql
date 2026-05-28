-- Sprint 8.1 · Vincular comerciales con auth.users.
--
-- Hasta ahora, comerciales existía como tabla independiente sin relación
-- con la sesión real del usuario. Los comerciales demo (Mariana, Diego,
-- Sofía) no tienen cuenta auth — la app los identifica por email
-- hardcodeado en lib/auth.ts (modo demo).
--
-- En production, queremos que cada usuario logueado se asocie 1:1 con un
-- comercial de su organización (para escribir FKs correctas en
-- leads.responsable_id y patrones.resuelto_por). Esta migration agrega
-- la columna; las filas concretas (Juan Segundo, Julián) se insertan
-- manualmente en Supabase Studio remoto en Sprint 8.3.
--
-- Atributos de la columna:
--  - NULLABLE: los comerciales demo siguen existiendo sin auth user.
--  - UNIQUE: un auth user = a lo sumo un comercial (no múltiples
--    identidades del mismo login dentro de una org).
--  - ON DELETE SET NULL: si la cuenta auth se borra, el comercial queda
--    como histórico (no se borra la data del lead/contacto que lo
--    referencia, solo se desvincula).
--
-- Nota sobre UNIQUE con NULLs: en Postgres, por default NULL ≠ NULL en
-- una UNIQUE constraint — así que múltiples filas con usuario_id NULL
-- son válidas (es lo que necesitamos para Mariana/Diego/Sofía).
--
-- Rollback: ver al final del archivo (comentado).

alter table comerciales
  add column usuario_id uuid
  references auth.users(id) on delete set null
  unique;

-- ────────────────────────────────────────────────────────────────────
-- ROLLBACK (no ejecutar a menos que necesites volver atrás).
-- ALTER TABLE … DROP COLUMN cae en cascada con el UNIQUE constraint
-- y el índice asociado, así que un solo statement alcanza.
-- ────────────────────────────────────────────────────────────────────
--
-- alter table comerciales drop column usuario_id;

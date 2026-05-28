-- Sprint 6.6 · Quitar los DEFAULT de organizacion_id en las 5 tablas de
-- negocio. Cierre del refactor de multi-tenancy.
--
-- Contexto:
--  - Sprint 1 (migration 20260526121400) agregó DEFAULT
--    '00000000-0000-0000-0000-000000000001' (la org demo) en las 5 tablas
--    como red de seguridad mientras lib/seed.ts, app/api/reset y las
--    Server Actions seguían insertando sin organizacion_id explícito.
--  - Sprints 6.1 a 6.5 reescribieron TODO INSERT para pasar
--    organizacion_id explícito (seed → DEMO_ORG_ID, actions →
--    currentUser.organizacion_id, detectores → orgId param).
--  - Con el DEFAULT puesto, un INSERT olvidado se cuela silenciosamente
--    a la org demo. Sin DEFAULT, falla ruidoso con
--    "null value in column organizacion_id" — que es lo que queremos.
--
-- Riesgo del cambio:
--  - Si quedó algún INSERT no migrado, va a romper. Para detectarlo,
--    los Sprint 6.x corrieron build + smoke + db:seed + curl de
--    /api/search y /patrones. Pero las Server Actions no se ejercitaron
--    end-to-end con click real, así que un escenario manual previo a
--    aplicar esta migration en prod es recomendable.
--
-- Rollback: ver al final del archivo (comentado).

alter table leads        alter column organizacion_id drop default;
alter table comerciales  alter column organizacion_id drop default;
alter table contactos    alter column organizacion_id drop default;
alter table agenda       alter column organizacion_id drop default;
alter table patrones     alter column organizacion_id drop default;

-- ────────────────────────────────────────────────────────────────────
-- ROLLBACK (no ejecutar a menos que necesites volver atrás).
-- Restaura el DEFAULT exactamente como lo dejó migration
-- 20260526121400_organizaciones.sql en su paso 7.
--
-- Usa el patrón DO/EXECUTE porque DEFAULT no acepta subqueries —
-- resolvemos el UUID de la org demo por slug y lo formateamos en el SQL.
-- ────────────────────────────────────────────────────────────────────
--
-- do $$
-- declare
--   v_demo_id uuid;
-- begin
--   select id into v_demo_id from organizaciones where slug = 'demo';
--   if v_demo_id is null then
--     raise exception 'No se encontró la organización con slug=demo.';
--   end if;
--
--   execute format('alter table leads        alter column organizacion_id set default %L', v_demo_id);
--   execute format('alter table comerciales  alter column organizacion_id set default %L', v_demo_id);
--   execute format('alter table contactos    alter column organizacion_id set default %L', v_demo_id);
--   execute format('alter table agenda       alter column organizacion_id set default %L', v_demo_id);
--   execute format('alter table patrones     alter column organizacion_id set default %L', v_demo_id);
-- end $$;

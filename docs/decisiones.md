# Log de decisiones técnicas

> Documento vivo. Cada decisión técnica que tomamos queda registrada acá con fecha y razón.
> Si querés volver atrás de una decisión, dejá la entrada original y sumá una nueva con la actualización.

---

## 2026-05-26 · Stack base

**Decisión:** Next.js 15 App Router + TypeScript + Tailwind CSS v4 + Supabase + Vercel.

**Razón:** Mismo stack que Cantú Propiedades (otro proyecto del estudio). Coherencia para el equipo, código portable entre proyectos.

**Implicancias:**
- `pnpm` como package manager (no npm ni yarn)
- TypeScript estricto desde el día 1
- App Router (no Pages)

---

## 2026-05-26 · Demo pública sin auth

**Decisión:** La demo es pública, sin login. Todos los visitantes ven los mismos datos. Datos compartidos en una sola DB.

**Razón:** Bajar fricción para mostrar el producto. Un prospecto entra al link, ve el tablero, lo toca. No tiene que crearse cuenta ni pedir acceso.

**Implicancias:**
- RLS de Supabase configurada con políticas anon permisivas pero **acotadas a las tablas de demo**
- No exponer service_role en cliente
- Reset diario es crítico para que la demo no se ensucie

**Riesgo asumido:** alguien puede meter datos basura o lenguaje inapropiado. El reset diario mitiga. Si pasa a ser un problema, sumamos:
- Rate limiting a nivel API route
- Validación de longitud/contenido en server actions
- Una columna `borrado_por_moderacion` con cron de validación más frecuente

---

## 2026-05-26 · Reset diario a las 03:00 ART

**Decisión:** Cron de Vercel resetea los datos a la semilla original cada noche a las 03:00 ART (06:00 UTC).

**Razón:** La demo tiene que verse fresca cada día. Sin reset, los datos se degradan (todos los leads pasan a estado "ganado" o quedan vacíos).

**Implementación:**
- Endpoint `app/api/reset/route.ts`
- Autenticación via header `Authorization: Bearer ${CRON_SECRET}`
- `vercel.json` configura el cron con schedule `0 6 * * *` (UTC)
- El endpoint:
  1. Borra todas las filas de las tablas demo
  2. Recarga desde el seed en `supabase/seed/`
  3. Actualiza `fecha_creacion` y `fecha_ultimo_contacto` relativas a `now()` para que los "días frío" sean correctos cada día

---

## 2026-05-26 · Datos sector-agnósticos en el seed

**Decisión:** Los datos demo mezclan rubros (constructora, estudio contable, clínica, agencia) sin un sector dominante.

**Razón:** El target de JS80 es amplio (analog SMEs, profesionales). Si la demo se ve "muy de inmobiliaria" o "muy de estudio contable", limitamos la percepción de qué casos podemos resolver.

**Excepción:** una opción a futuro es tener variantes por rubro (`leads.js80.studio/?rubro=contable`) con seeds específicos. No ahora.

---

## 2026-05-26 · Tailwind v4 con `@theme` en CSS

**Decisión:** Usar Tailwind v4 (con `@theme` directive en `globals.css`), no v3 (con `tailwind.config.js`).

**Razón:** Es la versión actual y va a ser la que va a usar el equipo a futuro. Los tokens del sistema JS80 (Fraunces, paleta) se exponen directamente como CSS variables, sin un paso de config.

**Implicancia para el código:**
- No hay `tailwind.config.js` ni `tailwind.config.ts`
- Toda la config está en `app/globals.css` debajo del directive `@theme`
- Los colores semánticos se exponen como `--color-azul`, `--color-violeta`, etc.

---

## 2026-05-26 · `@supabase/ssr` para el cliente Supabase

**Decisión:** Usar `@supabase/ssr` (no el viejo `@supabase/auth-helpers-nextjs`).

**Razón:** Es el paquete actual y soportado. `auth-helpers-nextjs` está deprecated.

**Implicancia:**
- Dos clientes Supabase: `lib/supabase/server.ts` (Server Components, API routes) y `lib/supabase/client.ts` (Client Components que necesiten realtime)
- Como no hay auth, no hay manejo de sesión en cookies, pero igual conviene tener los dos clientes separados por convención

---

## 2026-05-26 · Kanban con @dnd-kit + framer-motion

**Decisión:** Para la vista `/pipeline` (kanban con drag & drop) usamos `@dnd-kit` para DnD y `framer-motion` para animaciones (counter, drop spring, stagger).

**Razón:**
- `@dnd-kit` tiene buen soporte mobile/touch nativo, accesibilidad (teclado), API moderna basada en hooks y un `<DragOverlay>` que evita reparents del DOM al arrastrar.
- `framer-motion` permite animar layout entre columnas con `layout` automático, counters con `useMotionValue` + `useTransform`, y `AnimatePresence` para enter/exit.
- Alternativas evaluadas: `react-beautiful-dnd` (deprecado), `react-dnd` (más bajo nivel y sin DragOverlay listo), CSS-only (no resuelve mobile bien).

**Implicancias:**
- Las cards y columnas viven en `components/pipeline/` y son todas Client (necesitan hooks de DnD y motion).
- El cambio de estado se persiste con un server action `cambiarEstado()` + insert de un contacto con `canal='cambio_estado'` (ver decisión de schema abajo).
- Optimistic UI con rollback si falla el server action.
- Para touch en mobile: `TouchSensor` con `activationConstraint: { delay: 250, tolerance: 5 }` para no chocar con el scroll horizontal del board.

---

## 2026-05-26 · Cambios de estado registrados como contactos

**Decisión:** Cuando un lead cambia de estado en el kanban, en vez de sumar columnas a `leads`, insertamos un contacto con `canal='cambio_estado'` y `metadata={ from, to }`.

**Razón:**
- Nos da historial completo de movimientos del pipeline sin schema extra.
- Permite calcular "días atascado en este estado" como `now() - MAX(fecha)` de ese tipo de contacto.
- Reusa la tabla existente — el trigger de `fecha_ultimo_contacto` no se ve afectado porque ese campo refleja "último contacto con el cliente", y un cambio interno de estado no lo es.

**Implicancias:**
- Nueva migration: amplía el CHECK de `contactos.canal` para aceptar `cambio_estado`, suma columna `metadata jsonb DEFAULT '{}'::jsonb`.
- Nueva view `v_leads_kanban` que precalcula `dias_en_estado` (desde el último cambio de estado, o desde `fecha_creacion` si nunca cambió).
- En la timeline de la ficha del lead, los contactos con `canal='cambio_estado'` se **filtran** (no se muestran como ítem de historial). Si en el futuro queremos mostrarlos como sub-items visuales diferentes, queda la `metadata` para renderizar "De propuesta a cierre".

---

## 2026-05-26 · Centralización de queries y abstracción de usuario

**Decisión:** Todas las queries de Supabase pasan por `lib/queries.ts`. El usuario actual se obtiene siempre vía `getCurrentUser()` en `lib/auth.ts`.

**Razón:** Cuando migremos a producción real (multi-tenant con Auth), el cambio se va a hacer en 2-3 archivos puntuales y no en toda la app.

**Implicancias:**
- Server Components nunca llaman `supabase.from(...)` directo para leer. Usan funciones de `lib/queries.ts`.
- Server Actions sí pueden mutar (`insert`/`update`/`delete`) directamente — son la frontera de escritura.
- Nadie hardcodea "Mariana" ni datos de comercial. Usan `getCurrentUser()`.
- `getCurrentOrgId()` existe como placeholder para multi-tenancy futuro; hoy devuelve `'demo-org'`.
- El día que sumemos Auth: cambia `lib/auth.ts` para leer la sesión real, y se suman filtros por `organizacion_id` en `lib/queries.ts`. Punto.

---

## 2026-05-27 · QA fixes (sprint de coherencia)

**Decisión:** Después del QA report del 27/05, alineamos las métricas para que
distintas vistas que parecen medir lo mismo den el mismo número, y aclaramos
con tooltips los casos donde el criterio difiere a propósito.

**Implicancias:**

- **`v_comerciales_metricas`** (nueva migration `20260527120000_equipo_excluir_perdidos.sql`):
  `leads_activos` y `pipeline_valor` excluyen `perdido`. Antes el filter era
  `estado <> 'ganado'`, lo que dejaba pasar perdidos. Ahora es
  `estado in ('nuevo','conversacion','propuesta','cierre')`.
- **Header del kanban en `/pipeline`** (`components/pipeline/PipelineBoard.tsx`):
  el conteo "X leads distribuidos" y "USD Y en oportunidades activas" se calculan
  sobre los leads que efectivamente se muestran en las 5 columnas. No se filtra
  en la view (`v_leads_kanban` sigue trayendo todos) — lo hacemos en el componente
  por si en algún momento agregamos una columna extra para perdidos.
- **`KPITooltip`** como componente reusable (`components/KPITooltip.tsx`): icono
  `?` chico al lado del valor de un KPI; hover/focus/tap muestra texto explicativo.
  Sirve para casos donde dos vistas miden cosas parecidas con definiciones
  distintas y no queremos forzar una sola lectura.
- **Funnel `/conversion`**: el SQL de `funnel_para_mes` ya cuenta acumulativamente
  por mes de creación (Option B). El bug del QA report ("122% conversión") era
  imposible matemáticamente con el SQL actual y se debía a DB deployed stale.
  Sumamos un chip "X perdidos del mes" en el header del funnel para no dejar
  los perdidos invisibles (no entran en ninguna barra del embudo).
- **PeriodSelector de `/conversion`**: "Mes anterior" y "Trimestre" quedan
  visualmente disabled hasta que se implementen — mismo patrón que ya tenía
  `PeriodSelectorCerrados`. El parsing del query param sigue en la page por
  si se vuelve a habilitar.
- **Botón Exportar del home**: eliminado del DOM (no `disabled`, eso sugiere
  "ya casi"). Cuando se implemente export real, se vuelve a sumar.
- **`focus-trap-react`** sumado como dependencia (~8 KB). Envuelve el `<aside>`
  del `<Drawer>`, así todos los drawers heredan el trap. Sin esta lib el foco
  se escapaba al fondo cuando se tabulaba dentro de un drawer.
- **Índices trigram en `leads.nombre` y `contactos.nota`** (nueva migration
  `20260527120100_search_perf.sql`): `pg_trgm` + GIN para acelerar `ilike '%...%'`
  cuando el seed crezca. `ilike` ya era case-insensitive (Postgres nativo); el
  índice resuelve el escenario de búsqueda lenta del QA, no un bug de comparación.

---

## Cuando agregues una decisión nueva

Plantilla:

```
## YYYY-MM-DD · Título corto

**Decisión:** Qué decidimos.

**Razón:** Por qué.

**Implicancias:** Qué cambia en el código o en el flujo de trabajo.
```

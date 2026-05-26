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

## Cuando agregues una decisión nueva

Plantilla:

```
## YYYY-MM-DD · Título corto

**Decisión:** Qué decidimos.

**Razón:** Por qué.

**Implicancias:** Qué cambia en el código o en el flujo de trabajo.
```

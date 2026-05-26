# Tablero de leads · Demo

> Sistema de gestión de leads diseñado por **JS80 · Estudio de soluciones digitales** como pieza de portfolio.
> Demo pública, sin login, con reset diario.

**URL en producción:** [leads.js80.studio](https://leads.js80.studio)

---

## Qué es

Un tablero de gestión de leads pensado para negocios donde el seguimiento es la diferencia entre cerrar y perder un cliente: estudios contables, consultorios, agencias, profesionales independientes, brokers, concesionarios.

Esta demo es **pública y abierta**: cualquiera puede entrar y tocar. Los datos son compartidos entre todos los visitantes y se resetean cada noche a las 03:00 ART.

## Qué muestra

- **Tablero principal** · Pipeline visual, leads que se enfrían, oportunidades del día, agenda
- **Insight de IA** · Patrones detectados sobre los datos (cuellos en asignación, leads que comparten origen)
- **Vista por lead** · Ficha individual con timeline de contactos y próximo paso
- **Responsive completo** · Desktop XL, Desktop, Tablet y Mobile

## Stack

- **App:** Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Backend:** Supabase (Postgres + RLS pública controlada)
- **Tipografía:** Fraunces + Inter via `next/font`
- **Iconos:** Lucide React
- **Hosting:** Vercel
- **Reset diario:** Cron de Vercel (03:00 ART)

## Estructura

```
app/             · Next.js App Router · pantallas y API routes
  layout.tsx     · Layout raíz con fuentes y metadata
  page.tsx       · Tablero principal
  lead/[id]/     · Vista por lead
  api/
    reset/       · Endpoint del cron de reset diario
components/      · UI reutilizable (Sidebar, Pipeline, AIInsight, LeadsTable, etc.)
lib/             · Lógica de negocio · cliente Supabase, queries, tipos
supabase/
  migrations/    · Schema versionado
  seed/          · Datos demo para el reset
scripts/         · Utilidades (poblar local, etc.)
design/          · HTML estático original + capturas responsive
docs/            · Documentación viva
```

## Arrancar en local

```bash
pnpm install
cp .env.example .env.local   # completar con credenciales locales
pnpm db:start                # arranca Supabase en Docker
pnpm db:migrate              # corre las migrations
pnpm db:seed                 # carga datos demo
pnpm dev                     # arranca Next en localhost:3000
```

## Documentación

- [`docs/decisiones.md`](docs/decisiones.md) · log de decisiones técnicas
- [`docs/modelo-datos.md`](docs/modelo-datos.md) · esquema de datos
- [`docs/sistema-diseno.md`](docs/sistema-diseno.md) · tokens, componentes, breakpoints
- [`docs/runbook.md`](docs/runbook.md) · operación: deploy, reset manual, backups

## Equipo

- **Juan Segundo Barrio** · diseño, desarrollo · contacto@js80.studio
- **Julián Sancholuz** · diseño, desarrollo

---

JS80 · *De la idea al negocio funcionando.*

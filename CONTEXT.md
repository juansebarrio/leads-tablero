# Contexto del proyecto · Tablero de leads JS80

> Este documento existe para que Claude Code (o cualquier dev nuevo) tenga TODO el contexto del proyecto en un solo lugar.
> Si vas a tocar el código, leelo entero antes de empezar.

---

## 1. Qué estamos haciendo

Construir un **tablero de gestión de leads** como demo pública de JS80. Va en `leads.js80.studio`. Es un caso de portfolio, no un producto para un cliente concreto — pero está pensado como si fuera real.

Mostrar que JS80 puede construir productos internos completos: arquitectura, diseño, base de datos, frontend, deploy, mantenimiento.

## 2. Qué NO es

- ❌ Un CRM completo. No tiene módulo de facturación, ni integraciones reales con WhatsApp/Gmail.
- ❌ Un producto con auth. La demo es **pública, sin login**, todos ven los mismos datos.
- ❌ Un SaaS para vender. Es una vitrina. Si un prospecto lo quiere, le construimos uno a medida desde cero.

## 3. Decisiones ya tomadas (no rediscutir sin razón)

### Producto

- **Sin login** · cualquiera entra a `leads.js80.studio` y ve el tablero
- **Datos compartidos** · todos los visitantes ven los mismos datos, los cambios son visibles entre sesiones
- **Reset diario** · cron de Vercel a las 03:00 ART resetea a la semilla original
- **Sector-agnóstico** · los datos dummy mezclan constructora, estudio contable, clínica, agencia
- **Foco: seguimiento** · la métrica clave es "días sin contacto" (días frío)

### Diseño

- Sistema visual de JS80 (Fraunces display + Inter body, paleta violeta/azul/coral, núcleo conic-gradient como sello de marca)
- 4 breakpoints definidos (ver sección 6)
- HTML estático de referencia en `design/tablero_leads.html` — ese es el norte visual

### Stack

- Next.js 15 App Router · TypeScript · Tailwind CSS v4
- Supabase (Postgres + RLS) — pero RLS configurada para permitir lectura/escritura anon controlada
- Vercel para hosting + cron
- pnpm como package manager

## 4. Stack en detalle

### Next.js 15

- App Router (no Pages Router)
- Server Components por default, Client Components solo donde se necesite (drawers, interacciones)
- `next/font` para Fraunces e Inter (no `<link>` a Google Fonts)
- Metadata via API de metadata (no `<head>` manual)

### Tailwind v4

- Config en `app/globals.css` con `@theme` (no `tailwind.config.js`)
- Tokens del sistema JS80 como CSS variables → expuestos a Tailwind
- **No usar utility classes para colores semánticos directamente.** Usar tokens: `bg-panel`, `text-ink`, `border-line`. Ver `docs/sistema-diseno.md`.

### Supabase

- Postgres local para dev (vía Supabase CLI)
- Cliente desde `@supabase/ssr` (no el viejo `@supabase/auth-helpers-nextjs`)
- **RLS activa en todas las tablas**, con políticas anon permisivas pero acotadas a la tabla de demo
- Migrations versionadas en `supabase/migrations/`

### Iconos

- **Lucide React** únicamente (los SVG del HTML original son de Lucide)
- Importar individualmente: `import { Search, Calendar } from 'lucide-react'`

## 5. Modelo de datos

Detallado en `docs/modelo-datos.md`. Resumen:

```
leads
  id (uuid, pk)
  nombre (text)
  origen (text · enum: 'formulario', 'referido', 'linkedin', 'whatsapp')
  origen_detalle (text · opcional)
  estado (text · enum: 'nuevo', 'conversacion', 'propuesta', 'cierre', 'ganado')
  valor_estimado (numeric)
  tipo_negocio (text · enum: 'recurrente', 'proyecto')
  meses_compromiso (int · opcional)
  responsable_id (uuid, fk → comerciales) | nullable
  fecha_creacion (timestamptz)
  fecha_ultimo_contacto (timestamptz · nullable)
  proximo_paso (text · nullable)
  proximo_paso_fecha (timestamptz · nullable)
  temperatura (text · enum: 'hot', 'warm', 'med', 'cool' · calculada o manual)
  estado_oportunidad (text · 'caliente', 'esperando_firma', 'por_reactivar', 'sin_asignar' · etiqueta visible)

comerciales
  id (uuid, pk)
  nombre (text)
  iniciales (text · 2 chars)
  avatar_gradient (text · gradient string para el avatar)
  email (text)

contactos
  id (uuid, pk)
  lead_id (uuid, fk → leads)
  fecha (timestamptz)
  canal (text · enum: 'mail', 'llamado', 'whatsapp', 'reunion', 'linkedin')
  nota (text · opcional)

agenda
  id (uuid, pk)
  lead_id (uuid, fk → leads) | nullable
  fecha (timestamptz)
  duracion_min (int)
  titulo (text)
  modalidad (text · 'meet', 'zoom', 'whatsapp', 'presencial')
  tag (text · 'cierre_semana', 'referido', 'propuesta', 'definitiva' · etiqueta visible)
```

### Vistas derivadas (Postgres views)

- `v_pipeline_resumen` · count y suma por estado
- `v_leads_frios` · leads con `fecha_ultimo_contacto` > 5 días, ordenados por antigüedad
- `v_oportunidades_dia` · leads con `proximo_paso_fecha` en el día actual o vencidos
- `v_patrones_ia` · detección simple: leads del formulario web sin responsable asignado

## 6. Sistema de diseño

### Tokens (CSS variables, expuestos a Tailwind)

**Neutros:**
- `--bg: #F7F6F2` (fondo de la app, crema)
- `--panel: #FFFFFF` (cards, sidebar)
- `--panel-2: #FBFAF6` (hover de tabla)
- `--ink: #0E0E12` (texto principal)
- `--ink-2: #2A2A33` (texto secundario)
- `--muted: #6B6B75` (texto muteado)
- `--muted-2: #9A9AA3` (texto muy muteado)
- `--line: #E8E6DE` (divisores principales)
- `--line-2: #F0EEE6` (divisores suaves)

**Marca JS80:**
- `--azul: #6B8CFF` / `--azul-soft: #EDF1FF`
- `--violeta: #8B6FFF` / `--violeta-soft: #F1ECFF`
- `--turquesa: #5DC7E0` / `--turquesa-soft: #E5F4F9`
- `--coral: #FF8AA0` (solo dentro del núcleo, NUNCA como color de texto)

**Semánticos (datos críticos, NO marca):**
- `--rojo: #C8362E` / `--rojo-soft: #FBEAE7` (frío, caliente, urgencia)
- `--amarillo: #B8860B` / `--amarillo-soft: #FBF3DB` (warning, por reactivar)
- `--verde: #3E8A5A` / `--verde-soft: #E6F1EB` (ganado, ok)

### Tipografía

- **Display: Fraunces** (peso 500-600, opsz 144 para títulos grandes)
- **Body: Inter** (peso 400-500-600)
- Display SOFT=100 cuando es muy grande (h1)
- Las palabras clave de los títulos van en **Fraunces itálico violeta** (ej: "Leads que *se enfrían*")

### Breakpoints

| Nombre | Rango | Cambios |
|---|---|---|
| Desktop XL | ≥1280px | 3 columnas (sidebar + main + agenda) |
| Desktop | 1024–1279px | 2 columnas, agenda → drawer, botón "Tu día" en hero |
| Tablet | 768–1023px | 1 col, topbar móvil con hamburguesa + ícono agenda |
| Mobile | <768px | Tabla → cards apiladas, pipeline vertical, todo apilado |

### Componentes principales

Cada uno debe vivir en `components/` como archivo separado:

1. **Sidebar** · navegación principal · `<SidebarLeft>`
2. **TopbarMobile** · barra superior móvil con drawers · `<TopbarMobile>`
3. **Hero** · saludo + eyebrow + acciones · `<DashboardHero>`
4. **PipelineBar** · barra horizontal de estados · `<PipelineBar data={...}>`
5. **AIInsight** · card de patrón detectado · `<AIInsight pattern={...}>`
6. **LeadsTable** · tabla densa con timeline · `<LeadsTable leads={...}>`
7. **TimelineProgress** · barra simple con días frío · `<TimelineProgress days={...}>`
8. **OpportunityCard** · card de oportunidad del día · `<OpportunityCard opp={...}>`
9. **AgendaPanel** · panel/drawer derecho con eventos del día · `<AgendaPanel events={...}>`

## 7. Voz y copy

Reglas duras del estudio:

- **Rioplatense siempre** · "tenés", "vos", "querés". Nunca tutear.
- **Sin jerga técnica** · esto es UI del producto, pero los textos los lee un comercial no-tech. No usar "deploy", "pipeline" (en sentido técnico), "API", etc.
- **Acentos en violeta y itálica** · una palabra clave por título, en Fraunces itálico color violeta
- **Sin emojis** en el producto (sí en el copy de redes, pero acá no)
- **Mayúsculas: NO para énfasis** · solo en eyebrows ("PATRÓN DETECTADO", "LUNES 25 DE MAYO")

### Ejemplos de copy aprobado

- "Hola Mariana, *buen día*."
- "Tenés 14 leads que pidieron seguimiento y 4 reuniones en agenda. Empezamos por lo que se enfría."
- "Leads que *se enfrían*"
- "Oportunidades a *mover hoy*"
- "Cuatro leads del formulario web entre el 15 y 19 de mayo siguen sin asignar comercial. El cuello no es de seguimiento, es de **asignación automática**."

## 8. Cómo trabajar con Claude Code

### Cuando arrancás una sesión

1. Abrí este `CONTEXT.md` primero
2. Mirá `design/tablero_leads.html` (el norte visual)
3. Mirá `docs/decisiones.md` (decisiones técnicas previas)
4. Después sí, pedile a Claude Code que arme el componente que toque

### Cuando agregás un componente

- Lo nombrás con el nombre del sistema (`<PipelineBar>`, no `<PipelineComponent>`)
- Tipás props con un `interface` arriba del componente
- Si trae datos, los pedís via props (no fetch dentro del componente — eso vive en el page que lo usa)
- Server Component por default. Lo marcás `'use client'` solo si necesita estado o eventos.

### Cuando agregás una decisión técnica nueva

- La sumás a `docs/decisiones.md` con fecha
- La sumás a este `CONTEXT.md` si es estructural

## 9. Próximos pasos en orden

1. ✅ HTML estático de referencia (hecho, en `design/`)
2. ✅ CONTEXT.md + estructura de carpetas (este paso)
3. ⏳ `package.json` + dependencias + tooling base
4. ⏳ `app/globals.css` con tokens del sistema
5. ⏳ `app/layout.tsx` con fuentes via `next/font`
6. ⏳ Migrations de Supabase
7. ⏳ Seed data (datos demo)
8. ⏳ Cliente Supabase (`lib/supabase/`)
9. ⏳ Componentes UI uno por uno
10. ⏳ `app/page.tsx` armando el tablero completo
11. ⏳ Vista de lead (`app/lead/[id]/page.tsx`)
12. ⏳ API route de reset (`app/api/reset/route.ts`)
13. ⏳ Cron de Vercel configurado
14. ⏳ Deploy a `leads.js80.studio`

---

JS80 · *De la idea al negocio funcionando.*

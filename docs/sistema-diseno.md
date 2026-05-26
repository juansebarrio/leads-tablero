# Sistema de diseño

> Referencia técnica de cómo se implementa el sistema visual de JS80 en este proyecto.
> El norte visual es `design/tablero_leads.html`. Este documento traduce ese norte a Tailwind v4 + componentes React.

---

## Tokens en `app/globals.css`

```css
@import "tailwindcss";

@theme {
  /* Neutros */
  --color-bg: #F7F6F2;
  --color-panel: #FFFFFF;
  --color-panel-2: #FBFAF6;
  --color-ink: #0E0E12;
  --color-ink-2: #2A2A33;
  --color-muted: #6B6B75;
  --color-muted-2: #9A9AA3;
  --color-line: #E8E6DE;
  --color-line-2: #F0EEE6;

  /* Marca JS80 */
  --color-azul: #6B8CFF;
  --color-azul-soft: #EDF1FF;
  --color-violeta: #8B6FFF;
  --color-violeta-soft: #F1ECFF;
  --color-turquesa: #5DC7E0;
  --color-turquesa-soft: #E5F4F9;
  --color-coral: #FF8AA0;

  /* Semánticos */
  --color-rojo: #C8362E;
  --color-rojo-soft: #FBEAE7;
  --color-amarillo: #B8860B;
  --color-amarillo-soft: #FBF3DB;
  --color-verde: #3E8A5A;
  --color-verde-soft: #E6F1EB;

  /* Fuentes (cargadas via next/font en layout.tsx) */
  --font-display: var(--font-fraunces);
  --font-body: var(--font-inter);
}

@layer base {
  body {
    background: var(--color-bg);
    color: var(--color-ink);
    font-family: var(--font-body);
    font-size: 13px;
    -webkit-font-smoothing: antialiased;
  }
}
```

Después de esto, Tailwind expone:
- `bg-panel`, `bg-bg`, `bg-violeta-soft`, etc.
- `text-ink`, `text-muted`, `text-violeta`, etc.
- `border-line`, `border-line-2`
- `font-display` (Fraunces), `font-body` (Inter)

---

## Tipografía

### Carga via `next/font`

En `app/layout.tsx`:

```tsx
import { Fraunces, Inter } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'opsz'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### Cuándo usar cada una

- **Fraunces (display):** títulos h1, h2, números grandes (valores en USD, contadores), nombres de oportunidades. Usar `font-display` en Tailwind.
- **Inter (body):** todo el resto. Es el default del `body`, no hace falta especificar.

### Itálica violeta para acentos

El patrón típico de JS80 — UNA palabra en itálica violeta por título:

```tsx
<h2 className="font-display text-2xl font-medium tracking-tight">
  Leads que <em className="italic text-violeta font-medium">se enfrían</em>
</h2>
```

---

## Iconos · Lucide React

Importar individualmente para tree-shaking:

```tsx
import { Search, Calendar, Bell, ChevronRight } from 'lucide-react';

<Search className="w-3.5 h-3.5" strokeWidth={2} />
```

Iconos usados en el sistema (ver `design/tablero_leads.html`):

| Componente | Iconos |
|---|---|
| Sidebar items | `Target`, `Calendar`, `Clock`, `MessageSquare`, `FileText`, `CheckCircle`, `Layers`, `TrendingUp`, `Users` |
| Search | `Search` |
| Topbar mobile | `Menu`, `Calendar` |
| Hero actions | `Download`, `Plus` |
| Tabla lead | `MessageCircle` (WhatsApp) |
| Oportunidades | `ArrowRight` |

---

## Núcleo de marca (conic gradient)

El núcleo es el sello visual de JS80. Vive como un componente reutilizable:

```tsx
// components/Nucleus.tsx
interface NucleusProps {
  size?: number;
  className?: string;
}

export function Nucleus({ size = 30, className = '' }: NucleusProps) {
  return (
    <div
      className={`rounded-full shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'conic-gradient(from 200deg, #FF8AA0 0deg, #FFB088 60deg, #6B8CFF 160deg, #8B6FFF 230deg, #5DC7E0 310deg, #FF8AA0 360deg)',
      }}
    />
  );
}
```

Usos: sidebar (brand), AI insight badge (más grande), avatar de Mariana (versión simplificada con linear-gradient).

---

## Breakpoints en Tailwind

Tailwind v4 ya tiene los breakpoints estándar (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`). Mapeo al sistema JS80:

| JS80 | Tailwind | px |
|---|---|---|
| Mobile | base (sin prefijo) | <640 |
| Tablet | `md:` | ≥768 |
| Desktop | `lg:` | ≥1024 |
| Desktop XL | `xl:` | ≥1280 |

### Patrón típico

Ocultar la agenda lateral en <1280:

```tsx
<aside className="hidden xl:block w-[280px] bg-panel border-l border-line">
  {/* contenido de agenda */}
</aside>
```

Mostrar la topbar móvil en <1024:

```tsx
<header className="flex lg:hidden sticky top-0 z-50 bg-panel border-b border-line p-4">
  {/* topbar */}
</header>
```

### Drawers

Sidebar y agenda son **drawers** en mobile/tablet. Usan `translate-x`:

```tsx
<aside className={clsx(
  'fixed top-0 left-0 h-screen w-[260px] z-70 bg-panel transition-transform duration-250',
  isOpen ? 'translate-x-0' : '-translate-x-full',
  'lg:static lg:translate-x-0 lg:w-[220px]'
)}>
  {/* sidebar */}
</aside>
```

---

## Componentes principales

Cada componente vive en `components/` como archivo separado. Convención: **un archivo por componente**, exportación nombrada.

### Server vs Client Components

- **Server por default.** No marcar `'use client'` si no hace falta.
- **Client solo si:** usa `useState`, `useEffect`, event handlers, refs, hooks de Next del cliente.

Componentes que SÍ son Client:
- `SidebarMobile` (drawer, necesita estado de open/close)
- `AgendaPanel` (idem)
- `TopbarMobile` (botones que abren drawers)

Componentes que son Server:
- `DashboardHero`
- `PipelineBar` (recibe data de un Server Component padre)
- `AIInsight`
- `LeadsTable` (la tabla en sí; los botones de acción pueden ser Client wrappers chiquitos)
- `OpportunityCard`

### Patrón: Server Component que renderiza data + Client wrapper interactivo

```tsx
// app/page.tsx (Server)
import { LeadsTable } from '@/components/LeadsTable';
import { getLeadsFrios } from '@/lib/queries';

export default async function Page() {
  const leads = await getLeadsFrios();
  return <LeadsTable leads={leads} />;
}

// components/LeadsTable.tsx (Server)
export function LeadsTable({ leads }) {
  return (
    <table>
      {/* render */}
      {leads.map(l => (
        <tr key={l.id}>
          {/* ... */}
          <td><RetomarButton leadId={l.id} /></td>
        </tr>
      ))}
    </table>
  );
}

// components/RetomarButton.tsx (Client)
'use client';
export function RetomarButton({ leadId }) {
  // estado, onClick, etc.
}
```

---

## Cosas que el HTML estático tiene mal o se pueden mejorar al portar a React

1. **Avatares**: ahora son gradientes hardcodeados (`av-ml`, `av-dt`, `av-na`). Al portar, el `avatar_gradient` viene de la tabla `comerciales` y se aplica via style inline.
2. **Timeline cold fill**: el width está hardcodeado por fila (95%, 85%, etc.). En React, calcular `Math.min(dias_frio * 8, 100)` o similar.
3. **Pipeline segments**: los flex values están hardcodeados. Al portar, calcular proporciones desde `v_pipeline_resumen`.
4. **Las clases `.av-ml`, `.av-dt`, `.av-na`** desaparecen — los gradientes vienen de DB.

---

## Cómo testear visualmente

Para confirmar que un componente nuevo respeta el sistema, comparar contra `design/tablero_leads.html` abriéndolo al lado en otro navegador. Si hay diferencias visuales no intencionales, el HTML estático manda.

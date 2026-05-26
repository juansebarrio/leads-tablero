# Design · referencia visual

> Esta carpeta tiene el HTML estático original del tablero, las capturas responsive y cualquier asset de diseño.
> El HTML estático es **el norte visual** del proyecto. Si hay duda de cómo se ve algo, abrilo y mirá.

## Archivos

- `tablero_leads.html` · HTML estático completo, self-contained, listo para abrir en el navegador
- `preview_1_desktop_xl.png` · captura a 1440px (3 columnas)
- `preview_2_desktop.png` · captura a 1180px (sidebar visible, agenda como drawer)
- `preview_3_tablet.png` · captura a 900px (topbar móvil, oportunidades en 1 col)
- `preview_4_mobile.png` · captura a 390px (cards apiladas, pipeline vertical)
- `preview_5_mobile_sidebar.png` · sidebar abierta en mobile
- `preview_6_mobile_agenda.png` · drawer de agenda abierto en mobile

## Cómo usar este HTML al desarrollar

1. Abrilo en el navegador (`open tablero_leads.html` en Mac)
2. Usá las DevTools para ver clases CSS, medidas, paleta
3. Al portar a React, mantené las clases con los mismos nombres conceptuales (`.pipeline`, `.ai-insight`, `.opp`, etc.)
4. Si necesitás variar algo del diseño, **primero modificá el HTML estático**, validá visualmente, y después portalo al componente

## El HTML no es el código de producción

El HTML estático tiene:
- Datos hardcodeados (los reemplazamos por queries Supabase)
- CSS inline en un solo archivo (lo dividimos en Tailwind + tokens en `globals.css`)
- JS mínimo para drawers (lo portamos a `useState` en componentes Client)

Pero **el resultado visual final tiene que ser indistinguible** del HTML estático.

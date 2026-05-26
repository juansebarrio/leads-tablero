# Modelo de datos

> Esquema de Postgres / Supabase para el tablero de leads.
> Cambios al modelo se hacen via migration nueva en `supabase/migrations/`, nunca editando una vieja.

---

## Tablas

### `comerciales`

| Columna | Tipo | Default | Constraint |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `nombre` | text | — | NOT NULL |
| `iniciales` | text | — | NOT NULL, 2 chars |
| `avatar_gradient` | text | — | gradient CSS para el avatar |
| `email` | text | — | NOT NULL, UNIQUE |
| `creado_en` | timestamptz | `now()` | |

Seed: 3 comerciales (Mariana López, Diego Tovar, sin asignar).

### `leads`

| Columna | Tipo | Default | Constraint / Notas |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `nombre` | text | — | NOT NULL |
| `origen` | text | — | enum: `formulario`, `referido`, `linkedin`, `whatsapp` |
| `origen_detalle` | text | NULL | descripción libre (ej: "pidió presupuesto") |
| `estado` | text | `'nuevo'` | enum: `nuevo`, `conversacion`, `propuesta`, `cierre`, `ganado` |
| `valor_estimado` | numeric(10,2) | — | en USD |
| `tipo_negocio` | text | — | enum: `recurrente`, `proyecto` |
| `meses_compromiso` | int | NULL | solo si `tipo_negocio = 'recurrente'` |
| `responsable_id` | uuid | NULL | FK → `comerciales(id)` ON DELETE SET NULL |
| `fecha_creacion` | timestamptz | `now()` | |
| `fecha_ultimo_contacto` | timestamptz | NULL | actualizada por trigger al insertar en `contactos` |
| `proximo_paso` | text | NULL | descripción del próximo paso |
| `proximo_paso_fecha` | timestamptz | NULL | cuándo es el próximo paso |
| `temperatura` | text | `'cool'` | enum: `hot`, `warm`, `med`, `cool` |
| `estado_oportunidad` | text | NULL | etiqueta visible: `caliente`, `esperando_firma`, `por_reactivar`, `sin_asignar` |

### `contactos`

| Columna | Tipo | Default | Constraint / Notas |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `lead_id` | uuid | — | FK → `leads(id)` ON DELETE CASCADE, NOT NULL |
| `fecha` | timestamptz | `now()` | |
| `canal` | text | — | enum: `mail`, `llamado`, `whatsapp`, `reunion`, `linkedin` |
| `nota` | text | NULL | descripción del contacto |

**Trigger:** al insertar en `contactos`, actualizar `leads.fecha_ultimo_contacto = NEW.fecha`.

### `agenda`

| Columna | Tipo | Default | Constraint / Notas |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `lead_id` | uuid | NULL | FK → `leads(id)` ON DELETE SET NULL |
| `fecha` | timestamptz | — | NOT NULL |
| `duracion_min` | int | `30` | NOT NULL |
| `titulo` | text | — | NOT NULL |
| `modalidad` | text | — | enum: `meet`, `zoom`, `whatsapp`, `presencial` |
| `tag` | text | NULL | etiqueta visible: `cierre_semana`, `referido`, `propuesta`, `definitiva` |

---

## Vistas

### `v_pipeline_resumen`

Devuelve un resumen del pipeline por estado:

```sql
SELECT
  estado,
  COUNT(*) as cantidad,
  SUM(valor_estimado) as valor_total
FROM leads
WHERE estado != 'ganado' OR fecha_creacion > now() - interval '30 days'
GROUP BY estado;
```

### `v_leads_frios`

Leads con `fecha_ultimo_contacto > 5 días`, ordenados por antigüedad:

```sql
SELECT
  l.*,
  c.nombre as comercial_nombre,
  c.iniciales as comercial_iniciales,
  c.avatar_gradient as comercial_avatar,
  EXTRACT(day FROM now() - l.fecha_ultimo_contacto)::int as dias_frio
FROM leads l
LEFT JOIN comerciales c ON c.id = l.responsable_id
WHERE
  l.estado IN ('nuevo', 'conversacion', 'propuesta')
  AND (
    l.fecha_ultimo_contacto IS NULL
    OR l.fecha_ultimo_contacto < now() - interval '5 days'
  )
ORDER BY l.fecha_ultimo_contacto ASC NULLS FIRST;
```

### `v_oportunidades_dia`

Leads con próximo paso hoy o vencido:

```sql
SELECT
  l.*,
  c.nombre as comercial_nombre
FROM leads l
LEFT JOIN comerciales c ON c.id = l.responsable_id
WHERE
  l.estado IN ('conversacion', 'propuesta', 'cierre')
  AND l.proximo_paso_fecha IS NOT NULL
  AND l.proximo_paso_fecha::date <= CURRENT_DATE
ORDER BY l.proximo_paso_fecha ASC;
```

### `v_patrones_ia`

Detección simple de patrones para el insight de IA:

```sql
-- Patrón 1: leads del formulario sin responsable
SELECT
  'asignacion_pendiente' as patron,
  COUNT(*) as cantidad,
  array_agg(l.id) as lead_ids
FROM leads l
WHERE
  l.origen = 'formulario'
  AND l.responsable_id IS NULL
  AND l.fecha_creacion > now() - interval '15 days'
HAVING COUNT(*) >= 3;
```

(A futuro, sumar más patrones — uno por query, unidas con UNION ALL.)

---

## RLS (Row Level Security)

**Política base:** todas las tablas tienen RLS activada. Las políticas son **permisivas para el rol `anon`** porque la demo es pública, pero limitadas a operaciones seguras.

```sql
-- Ejemplo para la tabla leads (igual para las otras)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de leads"
  ON leads FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Inserción pública de leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Actualización pública de leads"
  ON leads FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- DELETE no permitido para anon
-- (el reset diario usa service_role)
```

---

## Reset diario

El endpoint `/api/reset` (protegido por `CRON_SECRET`):

1. Usa el cliente **service_role** (bypass de RLS)
2. `TRUNCATE` de `contactos`, `agenda`, `leads`, `comerciales` (en ese orden, por FKs)
3. Reinserta el seed
4. Ajusta fechas: `fecha_creacion`, `fecha_ultimo_contacto`, `proximo_paso_fecha`, `agenda.fecha` son **relativas a `now()`** para que cada día se vean fechas frescas

Ejemplo: si en el seed un lead tiene "creado hace 10 días", en cada reset eso se calcula como `now() - interval '10 days'`.

---

## Migrations

Convención de nombres: `YYYYMMDDHHMMSS_descripcion_corta.sql`

Migrations iniciales planeadas:

```
supabase/migrations/
  20260526120000_init_comerciales.sql
  20260526120100_init_leads.sql
  20260526120200_init_contactos.sql
  20260526120300_init_agenda.sql
  20260526120400_views.sql
  20260526120500_rls_policies.sql
  20260526120600_triggers.sql
```

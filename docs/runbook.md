# Runbook · operación del proyecto

> Cómo se opera el proyecto en producción.
> Si se rompe algo, mirá acá primero.

---

## Deploy

### Setup inicial en Vercel

1. Conectar el repo `github.com/juansebarrio/leads-tablero` a Vercel
2. Importar las variables de entorno (ver `.env.example`)
3. Configurar el dominio `leads.js80.studio`:
   - En Vercel: Settings → Domains → Add `leads.js80.studio`
   - En el DNS de `js80.studio` (donde sea que esté): CNAME `leads` → `cname.vercel-dns.com`

### Deploys siguientes

Automáticos en cada push a `main`. Branch deploys para PRs.

### Variables de entorno en Vercel

| Variable | Scope | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Pública, expuesta al cliente |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Pública, expuesta al cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only | NUNCA en Preview |
| `CRON_SECRET` | Production only | Generar con `openssl rand -hex 32` |

---

## Reset diario

### Cómo funciona

- Cron de Vercel corre a las 06:00 UTC (= 03:00 ART)
- Hace `POST /api/reset` con header `Authorization: Bearer ${CRON_SECRET}`
- El endpoint valida el header, conecta con service_role, trunca tablas y reinserta el seed

### Si necesitás resetear manualmente

```bash
curl -X POST https://leads.js80.studio/api/reset \
  -H "Authorization: Bearer $CRON_SECRET"
```

(O desde el dashboard de Supabase: Database → Tables → seleccionar tabla → Truncate, y después correr el seed manualmente desde `scripts/seed.ts`.)

### Si el cron falla

Verificar en Vercel: Logs → Cron Jobs → ver última ejecución.

Errores típicos:
- **401 Unauthorized:** `CRON_SECRET` mal configurada en Vercel o en el header.
- **500 con timeout:** la API route demora más de lo permitido en plan free (10s). Si es eso, mover el reset a un worker o particionar el proceso.

---

## Backups

No hace falta. Es una demo, los datos se regeneran cada noche.

Si en algún momento sumamos algo que sea importante preservar (ej: un contador de visitas), se backupea desde Supabase: Database → Backups → Daily.

---

## Cómo verificar que la demo está sana

Checklist post-deploy:

- [ ] `leads.js80.studio` carga sin error
- [ ] El pipeline bar muestra valores
- [ ] La tabla de leads frío muestra al menos 5 filas
- [ ] La agenda muestra 4 eventos
- [ ] El insight de IA muestra el patrón
- [ ] Click en "Retomar" actualiza `fecha_ultimo_contacto`
- [ ] Mobile: la hamburguesa abre el sidebar, el ícono agenda abre el drawer derecho

---

## Cómo actualizar el seed

El seed vive en `supabase/seed/`. Para agregar un lead nuevo, evento, etc.:

1. Editar el archivo correspondiente en `supabase/seed/`
2. Probar local:
   ```bash
   pnpm db:reset
   pnpm db:seed
   pnpm dev
   ```
3. Si se ve bien, commitear
4. En el próximo reset diario en producción, los datos nuevos van a aparecer

### Convenciones del seed

- **Fechas relativas a `now()`**: nunca poner fechas absolutas. Ejemplo: si querés un lead "creado hace 10 días", el script de seed hace `new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)`.
- **IDs determinísticos para FKs**: usar UUIDs hardcodeados (`v4`) para que las referencias entre tablas no se rompan.
- **Variedad de rubros**: mantener la mezcla constructora / contable / clínica / agencia.

---

## Si se rompe en producción

1. Mirá los logs de Vercel: `vercel logs leads.js80.studio` o desde el dashboard
2. Si es un error de DB, mirá los logs de Supabase: Project → Logs → Postgres logs
3. Si es algo grave, rollback al deploy anterior desde Vercel (botón "Promote to Production" en el deploy previo)

### Errores comunes

- **"Failed to fetch" en cliente:** problema de CORS o de URL de Supabase mal configurada. Verificar `NEXT_PUBLIC_SUPABASE_URL`.
- **"RLS policy violation":** alguien intentó hacer DELETE desde el cliente. Revisar las policies en `supabase/migrations/`.
- **Datos vacíos:** el reset no corrió o falló. Correr reset manual.

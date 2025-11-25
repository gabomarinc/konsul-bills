# 🔍 Verificar que las Tablas de Gmail Existan

## Problema
El error indica que la tabla `GmailIntegration` no existe en la base de datos.

## Pasos para Verificar y Corregir

### 1️⃣ Verificar en Supabase que las Tablas Existan

1. Ve a **Supabase → Table Editor**
2. Verifica que aparezcan estas 3 tablas:
   - ✅ `GmailIntegration`
   - ✅ `PendingQuote`
   - ✅ `ProcessedEmail`

**Si NO aparecen**, ejecuta este SQL en **Supabase → SQL Editor**:

```sql
-- Verificar si las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('GmailIntegration', 'PendingQuote', 'ProcessedEmail');
```

Si no devuelve las 3 tablas, ejecuta el SQL completo de `migration_gmail_integration.sql`.

### 2️⃣ Verificar que Vercel Esté Conectado a la Misma Base de Datos

1. Ve a **Vercel → Settings → Environment Variables**
2. Verifica que `DATABASE_URL` apunte a Supabase:
   ```
   postgresql://postgres.oyeityuizebqjmpopsrn:Konsul2025abc@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```
3. Verifica que `DIRECT_URL` también apunte a Supabase:
   ```
   postgresql://postgres.oyeityuizebqjmpopsrn:Konsul2025abc@aws-1-us-east-1.pooler.supabase.com:5432/postgres
   ```

### 3️⃣ Si las Tablas Existen pero el Error Persiste

Puede ser un problema de cache de Prisma. Prueba:

1. **Forzar regeneración de Prisma Client en Vercel:**
   - Ve a **Vercel → Deployments**
   - Haz clic en **"Redeploy"** en el último deployment
   - O haz un nuevo commit y push para forzar un nuevo build

2. **Verificar que Prisma Client esté actualizado:**
   - El build de Vercel debería ejecutar `prisma generate` automáticamente
   - Si no, puedes agregar en `package.json`:
     ```json
     "postinstall": "prisma generate"
     ```

### 4️⃣ Ejecutar SQL de Verificación Directamente

Si las tablas existen pero Prisma no las ve, ejecuta este SQL para verificar:

```sql
-- Verificar estructura de GmailIntegration
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'GmailIntegration' 
AND table_schema = 'public';

-- Verificar que tenga datos (debería estar vacía)
SELECT COUNT(*) FROM "public"."GmailIntegration";
```

### 5️⃣ Si Nada Funciona - Recrear las Tablas

Si las tablas no existen o están corruptas, ejecuta este SQL para eliminarlas y recrearlas:

```sql
-- CUIDADO: Esto eliminará todas las tablas de Gmail
DROP TABLE IF EXISTS "public"."ProcessedEmail" CASCADE;
DROP TABLE IF EXISTS "public"."PendingQuote" CASCADE;
DROP TABLE IF EXISTS "public"."GmailIntegration" CASCADE;

-- Luego ejecuta el SQL completo de migration_gmail_integration.sql
```

## Checklist

- [ ] Las 3 tablas aparecen en Supabase Table Editor
- [ ] `DATABASE_URL` en Vercel apunta a Supabase
- [ ] `DIRECT_URL` en Vercel apunta a Supabase
- [ ] Se hizo redeploy en Vercel después de crear las tablas
- [ ] Los logs de Vercel muestran que Prisma Client se generó correctamente

## Próximos Pasos

1. Verifica las tablas en Supabase
2. Si existen, haz un redeploy en Vercel
3. Prueba nuevamente el endpoint `/api/gmail/status`
4. Revisa los logs en Vercel para ver si el error persiste


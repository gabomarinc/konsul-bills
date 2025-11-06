# 🚀 Configurar Neon - Paso a Paso

## ✅ Paso 1: Cerrar el Modal
- Haz clic en la **X** del modal (arriba a la derecha)
- No necesitas `npx neonctl init` (ya usas Prisma)

## ✅ Paso 2: Obtener la Connection String

1. En el dashboard de Neon, busca la sección **"Connect to your database"**
2. O ve a la pestaña **"SQL Editor"** en el menú lateral
3. Busca el botón **"Connection string"** o **"Connect"**
4. Deberías ver algo como:
   ```
   postgresql://usuario:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
5. **Copia esta URL completa**

## ✅ Paso 3: Exportar datos de Supabase

**Opción A: Desde Supabase Dashboard (Más fácil)**
1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Ve a **Database** → **Backups**
3. Haz clic en **"Download backup"** o **"Create backup"**
4. Descarga el archivo SQL

**Opción B: Usando pg_dump (Desde terminal)**
```bash
# Exportar desde Supabase
pg_dump "postgresql://postgres.oyeityuizebqjmpopsrn:Konsul2025abc@aws-1-us-east-1.pooler.supabase.com:5432/postgres" > backup.sql
```

## ✅ Paso 4: Importar datos a Neon

1. En Neon Dashboard, ve a **"SQL Editor"** (menú lateral)
2. Haz clic en **"New query"** o **"Import"**
3. Pega el contenido del archivo SQL exportado de Supabase
4. Haz clic en **"Run"** o **"Execute"**
5. Espera a que termine la importación

## ✅ Paso 5: Actualizar variables en Vercel

1. Ve a Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto **konsul-bills**
3. Ve a **Settings** → **Environment Variables**
4. Busca `DATABASE_URL` y haz clic en **Edit**
5. Reemplaza el valor con la Connection String de Neon:
   ```
   postgresql://usuario:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
6. Si tienes `DIRECT_URL`, actualízalo también (puede ser la misma URL)
7. **IMPORTANTE:** En Neon NO necesitas `?pgbouncer=true&connection_limit=1`
   - Neon ya tiene connection pooling automático
   - Solo usa la URL que te da Neon tal cual

## ✅ Paso 6: Ejecutar migraciones

```bash
# Desde tu terminal
cd /Users/ortizalfano/Desktop/konsul-bills/konsul-bills
npx prisma migrate deploy
```

O si prefieres hacer push:
```bash
npx prisma db push
```

## ✅ Paso 7: Probar

1. Espera 2-3 minutos a que Vercel redesplegue
2. Prueba el bot en Telegram escribiendo `/start`
3. Verifica que responda correctamente
4. Revisa los logs en Vercel para asegurarte de que no hay errores

---

## 🔍 Dónde encontrar la Connection String en Neon

**Método 1: Desde Dashboard**
- En la tarjeta "Connect to your database"
- Haz clic en "Connect"
- Copia la URL que aparece

**Método 2: Desde SQL Editor**
- Ve a "SQL Editor" en el menú lateral
- Busca el botón "Connection string" o "Copy connection string"

**Método 3: Desde Settings**
- Ve a "Settings" en el menú lateral
- Busca "Connection string" o "Database URL"

---

## ⚠️ Importante

- **NO uses** `npx neonctl init` (es para proyectos nuevos sin Prisma)
- **Solo necesitas** la Connection String
- **No agregues** `?pgbouncer=true&connection_limit=1` (Neon ya lo tiene)
- **Usa** la URL tal cual te la da Neon

---

## 🆘 Si algo sale mal

Comparte:
1. El error que ves
2. Los logs de Vercel
3. Qué paso estás haciendo


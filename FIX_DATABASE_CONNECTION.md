# 🔧 Solución: Error de Conexión a Base de Datos en Vercel

## Problema
```
Timed out fetching a new connection from the connection pool
(Current connection pool timeout: 10, connection limit: 5)
```

## Causa
En Vercel con PostgreSQL, necesitas usar **connection pooling** correctamente. El `DATABASE_URL` debe apuntar a un pooler, no directamente a la base de datos.

## Solución

### 1️⃣ Verificar Variables de Entorno en Vercel

Ve a **Vercel → Settings → Environment Variables** y verifica que tengas:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:pass@host:5432/db"
```

**Importante:**
- `DATABASE_URL` debe tener `?pgbouncer=true&connection_limit=1` para usar pooling
- `DIRECT_URL` debe ser la conexión directa (sin pooling) para migraciones

### 2️⃣ Si Usas Vercel Postgres

Si creaste la base de datos desde Vercel Storage:

1. Ve a **Vercel → Storage → Tu Base de Datos**
2. En la pestaña **.env.local**, verás:
   - `POSTGRES_URL` → Úsalo como `DATABASE_URL` (ya tiene pooling)
   - `POSTGRES_URL_NON_POOLING` → Úsalo como `DIRECT_URL`

3. En **Environment Variables**, configura:
   ```
   DATABASE_URL = (valor de POSTGRES_URL)
   DIRECT_URL = (valor de POSTGRES_URL_NON_POOLING)
   ```

### 3️⃣ Si Usas Base de Datos Externa (Supabase, Neon, etc.)

**Para Supabase:**
```bash
# Connection Pooler (para queries normales)
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true&connection_limit=1"

# Direct Connection (para migraciones)
DIRECT_URL="postgresql://user:pass@host:5432/db"
```

**Para Neon:**
```bash
# Connection Pooler
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require&pgbouncer=true&connection_limit=1"

# Direct Connection
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"
```

### 4️⃣ Verificar el Schema de Prisma

Asegúrate de que `prisma/schema.prisma` tenga:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Con pooling
  directUrl = env("DIRECT_URL")        // Sin pooling (para migraciones)
}
```

### 5️⃣ Redesplegar

Después de configurar las variables:

1. Ve a **Deployments**
2. Haz clic en los **3 puntos** (⋯) del último deployment
3. Selecciona **Redeploy**

## Cambios Realizados en el Código

✅ Eliminado `findMany()` innecesario que agotaba el pool
✅ Optimizado `getTelegramUser()` para usar `findUnique()` directamente
✅ Mejorado manejo de conexiones en `prisma.ts`

## Verificar que Funciona

1. Revisa los logs en Vercel
2. Prueba enviar un mensaje al bot de Telegram
3. Deberías ver logs exitosos sin errores de conexión

## Si Sigue Fallando

1. **Verifica que la base de datos esté accesible:**
   ```bash
   # Prueba conectarte desde tu máquina local
   psql $DATABASE_URL
   ```

2. **Verifica los límites de conexión:**
   - Vercel Postgres: 100 conexiones simultáneas
   - Supabase Free: 60 conexiones
   - Neon Free: 100 conexiones

3. **Revisa los logs completos en Vercel** para ver el error exacto



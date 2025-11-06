# 🔧 Corregir Configuración de Supabase en Vercel

## Configuración Actual

**DATABASE_URL:**
```
postgresql://postgres.oyeityuizebqjmpopsrn:Konsul2025abc@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**DIRECT_URL:**
```
postgresql://postgres.oyeityuizebqjmpopsrn:Konsul2025abc@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

## Problema

El `DATABASE_URL` tiene `pgbouncer=true` pero **le falta `connection_limit=1`** que es crítico para Vercel serverless.

## Solución

### 1️⃣ Actualizar DATABASE_URL

Ve a **Vercel → Settings → Environment Variables** y edita `DATABASE_URL`:

**Valor correcto:**
```
postgresql://postgres.oyeityuizebqjmpopsrn:Konsul2025abc@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Cambio:** Agregar `&connection_limit=1` al final

### 2️⃣ Verificar DIRECT_URL

Tu `DIRECT_URL` está correcto (usa puerto 5432 para conexión directa). No necesitas cambiarlo.

## Pasos Exactos

1. Ve a **Vercel → Settings → Environment Variables**
2. Haz clic en el ícono de **editar** (lápiz) junto a `DATABASE_URL`
3. En el campo **Value**, agrega `&connection_limit=1` al final:
   ```
   postgresql://postgres.oyeityuizebqjmpopsrn:Konsul2025abc@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```
4. Haz clic en **Save**
5. Redesplega tu aplicación

## Después de Corregir

1. **Redesplega** (Vercel lo hará automáticamente o hazlo manualmente)
2. **Prueba el bot** enviando un mensaje en Telegram
3. **Revisa los logs** - el error de conexión debería desaparecer

## ¿Por qué `connection_limit=1`?

En Vercel serverless, cada función puede crear múltiples conexiones. Con `connection_limit=1`, Prisma solo usa 1 conexión por instancia, lo cual es perfecto para serverless y evita agotar el pool.


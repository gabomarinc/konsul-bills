# 🔧 Actualizar Vercel con Neon

## Connection String de Neon

```
postgresql://neondb_owner:npg_wUJ4fvpd5hTK@ep-icy-glade-addh0guy-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## 📋 Pasos para Actualizar Vercel

### Paso 1: Ir a Vercel

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto **konsul-bills**
3. Ve a **Settings** → **Environment Variables**

### Paso 2: Actualizar DATABASE_URL

1. Busca la variable `DATABASE_URL`
2. Haz clic en **Edit** (o **Add** si no existe)
3. **Valor anterior (Supabase):**
   ```
   postgresql://postgres.oyeityuizebqjmpopsrn:Konsul2025abc@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```
4. **Valor nuevo (Neon):**
   ```
   postgresql://neondb_owner:npg_wUJ4fvpd5hTK@ep-icy-glade-addh0guy-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
5. Asegúrate de que esté seleccionado para **Production**, **Preview**, y **Development**
6. Haz clic en **Save**

### Paso 3: Actualizar DIRECT_URL (si existe)

1. Busca la variable `DIRECT_URL`
2. Si existe, actualízala con el mismo valor de Neon:
   ```
   postgresql://neondb_owner:npg_wUJ4fvpd5hTK@ep-icy-glade-addh0guy-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
3. Si no existe, puedes crearla o dejarla igual que DATABASE_URL
4. Haz clic en **Save**

### Paso 4: Verificar

1. Asegúrate de que ambas variables estén actualizadas
2. Los valores deben ser iguales (ambos apuntando a Neon)
3. **IMPORTANTE:** NO necesitas `?pgbouncer=true&connection_limit=1` en Neon

---

## ⚠️ Importante

- **NO agregues** `?pgbouncer=true&connection_limit=1` (Neon ya tiene pooling)
- **Usa** la URL tal cual te la da Neon
- **Asegúrate** de que esté seleccionado para todos los ambientes (Production, Preview, Development)

---

## 🚀 Después de Actualizar

1. Vercel redesplegará automáticamente
2. Espera 2-3 minutos
3. Prueba el bot en Telegram
4. Deberías ver menos errores de timeout


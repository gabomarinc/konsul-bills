# 🚀 Guía de Migración: Supabase → Neon

## ¿Por qué Neon?

- ✅ **PostgreSQL** (compatible con tu código actual)
- ✅ **Connection pooling nativo** (mejor para Vercel)
- ✅ **512 MB gratis** (suficiente para empezar)
- ✅ **Sin límite de conexiones** (usa pooling)
- ✅ **Mejor rendimiento** en serverless

---

## 📋 Pasos para Migrar

### Paso 1: Crear cuenta en Neon

1. Ve a https://neon.tech
2. Haz clic en "Sign Up" (puedes usar GitHub)
3. Crea un nuevo proyecto
4. Elige una región cercana (ej: US East)
5. Anota la **Connection String** que te dan

### Paso 2: Exportar datos de Supabase

**Opción A: Desde Supabase Dashboard (Recomendado)**
1. Ve a tu proyecto en Supabase
2. Ve a **Database** → **Backups**
3. Haz clic en **Download backup**
4. Guarda el archivo SQL

**Opción B: Usando pg_dump (Desde terminal)**
```bash
# Instalar PostgreSQL client si no lo tienes
brew install postgresql  # macOS
# o
sudo apt-get install postgresql-client  # Linux

# Exportar
pg_dump "postgresql://postgres.oyeityuizebqjmpopsrn:Konsul2025abc@aws-1-us-east-1.pooler.supabase.com:5432/postgres" > backup.sql
```

### Paso 3: Importar a Neon

1. Ve a tu proyecto en Neon Dashboard
2. Ve a **SQL Editor**
3. Haz clic en **Import**
4. Pega el contenido del archivo SQL exportado
5. Haz clic en **Run**

### Paso 4: Actualizar variables en Vercel

1. Ve a Vercel → Tu proyecto → **Settings** → **Environment Variables**
2. Actualiza `DATABASE_URL`:
   - **Valor anterior (Supabase):**
     ```
     postgresql://postgres.oyeityuizebqjmpopsrn:Konsul2025abc@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
     ```
   - **Valor nuevo (Neon):**
     ```
     postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
     (Neon te dará esta URL cuando crees el proyecto)

3. Actualiza `DIRECT_URL` (si lo usas):
   - **Valor nuevo (Neon):**
     ```
     postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
     (Puede ser la misma que DATABASE_URL en Neon)

4. **IMPORTANTE:** En Neon, NO necesitas `?pgbouncer=true&connection_limit=1`
   - Neon tiene connection pooling nativo
   - La URL ya incluye el pooling automáticamente

### Paso 5: Ejecutar migraciones de Prisma

```bash
# Desde tu terminal local
cd konsul-bills
npx prisma migrate deploy
```

O si prefieres hacer push directo:
```bash
npx prisma db push
```

### Paso 6: Verificar que funciona

1. Prueba el bot en Telegram
2. Escribe `/start`
3. Verifica que responda correctamente
4. Revisa los logs en Vercel para asegurarte de que no hay errores

---

## 🔧 Configuración Adicional

### En `prisma/schema.prisma`

No necesitas cambiar nada, pero puedes optimizar:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### En Vercel

**Variables de entorno necesarias:**
- `DATABASE_URL` - URL de Neon (con pooling)
- `DIRECT_URL` - URL directa de Neon (opcional, puede ser la misma)

---

## ✅ Ventajas de Neon vs Supabase

| Característica | Supabase (Free) | Neon (Free) |
|----------------|-----------------|-------------|
| Almacenamiento | 500 MB | 512 MB |
| Connection Pooling | Manual (pgbouncer) | ✅ Nativo |
| Límite de conexiones | 1 (con pooling) | ✅ Sin límite |
| Optimizado para serverless | ⚠️ Requiere config | ✅ Sí |
| Timeouts | ⚠️ Frecuentes | ✅ Menos frecuentes |
| Migración | - | ✅ Fácil |

---

## 🐛 Si algo sale mal

### Problema: Error de conexión
**Solución:** Verifica que la URL de Neon sea correcta y que incluya `?sslmode=require`

### Problema: Tablas no se crean
**Solución:** Ejecuta `npx prisma migrate deploy` o `npx prisma db push`

### Problema: Datos no aparecen
**Solución:** Verifica que el import se haya completado correctamente en Neon Dashboard

---

## 📞 ¿Necesitas ayuda?

Si tienes problemas durante la migración, comparte:
1. Los logs de Vercel
2. El error específico que ves
3. Qué paso de la migración estás haciendo

---

## 🎯 Resultado Esperado

Después de migrar a Neon:
- ✅ Menos timeouts de conexión
- ✅ Mejor rendimiento en Vercel
- ✅ El bot responde más rápido
- ✅ Menos errores de "connection pool"


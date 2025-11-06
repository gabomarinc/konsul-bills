# 🔍 Verificar Configuración de Base de Datos en Vercel

## Situación Actual

Tienes configurado:
- ✅ `DATABASE_URL` 
- ✅ `DIRECT_URL`
- ✅ `GEMINI_API_KEY` (recién agregado)
- ✅ `TELEGRAM_BOT_TOKEN`

## Problema Potencial

El `DATABASE_URL` que veo (`postgresql://postgres.oyeityuizebq...`) **probablemente no tiene los parámetros de connection pooling** necesarios para Vercel serverless.

## Solución: Dos Opciones

### Opción 1: Si usas Vercel Postgres (Recomendado)

1. Ve a **Vercel → Storage** en tu proyecto
2. Si ves una base de datos Postgres, haz clic en ella
3. Ve a la pestaña **".env.local"** o **"Variables"**
4. Deberías ver:
   - `POSTGRES_URL` → Esta tiene pooling automático
   - `POSTGRES_URL_NON_POOLING` → Esta es la conexión directa

5. **Actualiza tus variables de entorno:**
   - `DATABASE_URL` = copia el valor de `POSTGRES_URL`
   - `DIRECT_URL` = copia el valor de `POSTGRES_URL_NON_POOLING`

### Opción 2: Si usas Base de Datos Externa (Supabase, Neon, etc.)

Necesitas agregar parámetros de pooling al `DATABASE_URL`:

**Formato actual (probablemente):**
```
postgresql://user:pass@host:5432/db
```

**Formato correcto para Vercel:**
```
postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=1
```

**Pasos:**
1. Ve a **Vercel → Settings → Environment Variables**
2. Haz clic en `DATABASE_URL` para editarla
3. Agrega al final: `?pgbouncer=true&connection_limit=1`
4. Guarda

**Ejemplo completo:**
```
postgresql://postgres.oyeityuizebq:password@host:5432/db?pgbouncer=true&connection_limit=1
```

## Verificar

Después de hacer los cambios:

1. **Redesplega** tu aplicación
2. **Prueba el bot de Telegram** enviando un mensaje
3. **Revisa los logs** en Vercel para ver si desapareció el error de conexión

## ¿Cuál es tu caso?

- **Si tienes Vercel Postgres:** Usa la Opción 1
- **Si usas Supabase/Neon/Otra:** Usa la Opción 2

¿Puedes confirmar qué tipo de base de datos estás usando?


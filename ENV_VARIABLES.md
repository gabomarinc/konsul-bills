# Variables de Entorno Requeridas

Para que la aplicación funcione correctamente en Vercel, necesitas configurar las siguientes variables de entorno:

## Base de Datos (REQUERIDAS)

```bash
DATABASE_URL="postgresql://username:password@host:5432/database?schema=public"
DIRECT_URL="postgresql://username:password@host:5432/database?schema=public"
```

**Para Vercel:**
1. Ve a tu proyecto en Vercel
2. Settings → Storage → Create Database → Postgres
3. Vercel configurará automáticamente `DATABASE_URL` y `POSTGRES_URL_NON_POOLING` (usa esta como `DIRECT_URL`)

## Autenticación (REQUERIDA)

```bash
JWT_SECRET="tu-clave-secreta-jwt-muy-segura-aqui"
SESSION_MAX_AGE="86400"
```

**Genera un JWT_SECRET seguro:**
```bash
# Opción 1: En Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 2: En terminal
openssl rand -hex 32
```

## Encriptación (REQUERIDA para Stripe)

```bash
ENCRYPTION_KEY="tu-clave-de-32-caracteres-aqui"
```

**Genera una clave de 32 caracteres:**
```bash
openssl rand -base64 24 | head -c 32
```

## Stripe (OPCIONAL - solo si usas pagos)

```bash
STRIPE_SECRET_KEY="sk_test_..." # o sk_live_... en producción
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Obtener las claves:**
1. Ve a https://dashboard.stripe.com/apikeys
2. Copia tu Secret Key (usa Test keys para pruebas)
3. Para el Webhook Secret:
   - Ve a Developers → Webhooks
   - Crea un webhook apuntando a `https://tu-dominio.vercel.app/api/stripe/webhook`
   - Copia el Signing Secret

## Cron Jobs (REQUERIDA para facturas recurrentes)

```bash
CRON_SECRET="tu-token-aleatorio-para-proteger-cron"
```

**Genera un token seguro:**
```bash
openssl rand -hex 32
```

## Rate Limiting (OPCIONAL)

```bash
RATE_LIMIT_MAX="10"
RATE_LIMIT_WINDOW_MS="900000"
```

Tienen valores por defecto, solo configúralas si necesitas cambiarlos.

---

## Configuración en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable con su valor
4. Selecciona el entorno: Production, Preview, Development (o todos)
5. Guarda y redeploya tu proyecto

## Notas Importantes

⚠️ **Nunca commits estas variables en el código**
⚠️ **Usa valores diferentes para desarrollo y producción**
⚠️ **Genera claves seguras para producción, no uses los ejemplos**

## Configurar Base de Datos en Vercel

1. En tu proyecto de Vercel → Storage → Create Database
2. Selecciona "Postgres"
3. Sigue el wizard de configuración
4. Vercel conectará automáticamente las variables `DATABASE_URL` y otras
5. En Environment Variables, agrega manualmente:
   - `DIRECT_URL` = copia el valor de `POSTGRES_URL_NON_POOLING`

Después de configurar todo, redeploya tu aplicación.


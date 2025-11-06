# 🔧 Migración de Base de Datos para Telegram

## ⚠️ IMPORTANTE: Ejecutar esta migración en producción

La tabla `TelegramUser` debe crearse en tu base de datos antes de poder vincular cuentas de Telegram.

## Opción 1: Usando Prisma Migrate (Recomendado)

Si tienes acceso a la base de datos de producción:

```bash
# 1. Asegúrate de tener las variables de entorno configuradas
# DATABASE_URL y DIRECT_URL deben estar en tu .env

# 2. Ejecutar la migración
npx prisma migrate deploy
```

## Opción 2: Usando Prisma DB Push (Para desarrollo/testing)

Si estás en desarrollo o necesitas aplicar cambios rápidamente:

```bash
npx prisma db push
```

## Opción 3: Ejecutar SQL manualmente

Si no puedes usar Prisma Migrate, ejecuta este SQL en tu base de datos:

```sql
-- Crear tabla TelegramUser
CREATE TABLE IF NOT EXISTS "TelegramUser" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("id")
);

-- Crear índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS "TelegramUser_telegramId_key" ON "TelegramUser"("telegramId");
CREATE UNIQUE INDEX IF NOT EXISTS "TelegramUser_userId_key" ON "TelegramUser"("userId");

-- Crear foreign key
ALTER TABLE "TelegramUser" 
ADD CONSTRAINT "TelegramUser_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;
```

## Verificar que la tabla existe

Después de ejecutar la migración, verifica que la tabla existe:

```sql
SELECT * FROM "TelegramUser" LIMIT 1;
```

Si no hay errores, la tabla existe y está lista para usar.

## Para Vercel

Si estás usando Vercel, puedes ejecutar la migración en el build script:

1. Ve a tu proyecto en Vercel
2. Settings → General → Build & Development Settings
3. Asegúrate de que el build command incluya:
   ```bash
   npx prisma generate && npx prisma migrate deploy && npm run build
   ```

O agrega esto a tu `vercel-build.sh`:

```bash
#!/bin/bash
npx prisma generate
npx prisma migrate deploy
npm run build
```

## Solución de problemas

Si ves el error "Error al vincular usuario de Telegram" después de ejecutar la migración:

1. Verifica que la tabla existe en la base de datos
2. Verifica los logs del servidor en Vercel para ver el error específico
3. Asegúrate de que las variables de entorno DATABASE_URL y DIRECT_URL estén configuradas correctamente



# 📦 Migrar Datos de Supabase a Neon - Paso a Paso

## 🔄 Proceso Completo

Neon está vacío, necesitamos **copiar** todos los datos de Supabase a Neon.

---

## 📋 Opción 1: Desde Supabase Dashboard (MÁS FÁCIL) ⭐

### Paso 1: Exportar desde Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Database** → **Backups**
4. Haz clic en **"Create backup"** o **"Download backup"**
5. Espera a que se genere el backup
6. Descarga el archivo SQL (se llamará algo como `backup_2024-11-06.sql`)

### Paso 2: Importar a Neon

1. Abre el archivo SQL descargado en un editor de texto
2. Copia TODO el contenido (Cmd+A, Cmd+C)
3. Ve a Neon Dashboard → **SQL Editor**
4. Haz clic en **"New query"**
5. Pega todo el contenido del archivo SQL
6. Haz clic en **"Run"** o **"Execute"**
7. Espera a que termine (puede tardar unos minutos)

---

## 📋 Opción 2: Desde Terminal (Más rápido)

### Paso 1: Exportar desde Supabase

```bash
cd /Users/ortizalfano/Desktop/konsul-bills/konsul-bills

# Exportar datos de Supabase
pg_dump "postgresql://postgres.oyeityuizebqjmpopsrn:Konsul2025abc@aws-1-us-east-1.pooler.supabase.com:5432/postgres" > supabase_backup.sql
```

**Nota:** Si no tienes `pg_dump` instalado:
```bash
# macOS
brew install postgresql

# Luego ejecuta el comando de exportación de arriba
```

### Paso 2: Importar a Neon

```bash
# Importar a Neon
psql "postgresql://neondb_owner:npg_wUJ4fvpd5hTK@ep-icy-glade-addh0guy-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" < supabase_backup.sql
```

---

## 📋 Opción 3: Usando Prisma (Solo schema, NO datos)

Si solo quieres el schema (estructura de tablas) pero no los datos:

```bash
cd /Users/ortizalfano/Desktop/konsul-bills/konsul-bills

# Esto crea las tablas en Neon (pero sin datos)
npx prisma db push
```

**⚠️ Esto NO copia los datos, solo crea las tablas vacías.**

---

## ✅ Verificar que los datos se importaron

### En Neon Dashboard:

1. Ve a **SQL Editor**
2. Ejecuta esta query:
   ```sql
   SELECT COUNT(*) FROM "TelegramUser";
   ```
3. Deberías ver el número de usuarios de Telegram que tienes
4. También puedes verificar otras tablas:
   ```sql
   SELECT COUNT(*) FROM "User";
   SELECT COUNT(*) FROM "Company";
   SELECT COUNT(*) FROM "Client";
   ```

---

## 🎯 Recomendación

**Usa la Opción 1 (Supabase Dashboard)** porque:
- ✅ Más fácil y visual
- ✅ No necesitas instalar nada
- ✅ Puedes ver el progreso
- ✅ Menos propenso a errores

---

## ⚠️ Importante

- **NO actualices Vercel** hasta que hayas importado los datos a Neon
- **Verifica** que los datos se importaron correctamente antes de cambiar Vercel
- **Haz backup** del archivo SQL por si acaso

---

## 🚀 Orden Correcto

1. ✅ Exportar datos de Supabase
2. ✅ Importar datos a Neon
3. ✅ Verificar que los datos están en Neon
4. ✅ Actualizar variables en Vercel
5. ✅ Ejecutar `npx prisma migrate deploy`
6. ✅ Probar el bot

---

## 🆘 Si algo sale mal

Comparte:
1. El error que ves
2. Qué paso estás haciendo
3. Los logs de Neon (si hay errores en SQL Editor)


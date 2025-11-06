# 📥 Importar Datos a Neon - Paso a Paso

## ✅ Archivo Exportado

- **Archivo:** `supabase_backup.sql`
- **Tamaño:** 238 KB
- **Líneas:** 7,267
- **Estado:** ✅ Listo para importar

---

## 📋 Opción 1: Desde Neon Dashboard (RECOMENDADO) ⭐

### Paso 1: Abrir SQL Editor en Neon

1. Ve a tu proyecto en Neon Dashboard
2. En el menú lateral, haz clic en **"SQL Editor"**
3. Haz clic en **"New query"** o **"New"**

### Paso 2: Abrir el archivo SQL

1. Abre el archivo `supabase_backup.sql` en un editor de texto
   - Puedes usar VS Code, TextEdit, o cualquier editor
   - El archivo está en: `/Users/ortizalfano/Desktop/konsul-bills/konsul-bills/supabase_backup.sql`

### Paso 3: Copiar y Pegar

1. Selecciona TODO el contenido del archivo (Cmd+A)
2. Copia (Cmd+C)
3. Vuelve a Neon SQL Editor
4. Pega todo el contenido (Cmd+V)

### Paso 4: Ejecutar

1. Haz clic en **"Run"** o **"Execute"** (o presiona Cmd+Enter)
2. Espera a que termine (puede tardar 1-2 minutos)
3. Deberías ver un mensaje de éxito

---

## 📋 Opción 2: Desde Terminal (Más rápido)

```bash
cd /Users/ortizalfano/Desktop/konsul-bills/konsul-bills

# Importar a Neon usando psql
/opt/homebrew/opt/postgresql@17/bin/psql "postgresql://neondb_owner:npg_wUJ4fvpd5hTK@ep-icy-glade-addh0guy-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" < supabase_backup.sql
```

**Nota:** Esto puede tardar unos minutos dependiendo del tamaño de los datos.

---

## ✅ Verificar que los Datos se Importaron

### En Neon SQL Editor, ejecuta:

```sql
-- Verificar usuarios de Telegram
SELECT COUNT(*) FROM "TelegramUser";

-- Verificar usuarios
SELECT COUNT(*) FROM "User";

-- Verificar empresas
SELECT COUNT(*) FROM "Company";

-- Verificar clientes
SELECT COUNT(*) FROM "Client";
```

Deberías ver los mismos números que en Supabase.

---

## 🚀 Después de Importar

1. ✅ Verificar que los datos están en Neon
2. ✅ Actualizar variables en Vercel (DATABASE_URL y DIRECT_URL)
3. ✅ Ejecutar `npx prisma migrate deploy`
4. ✅ Probar el bot en Telegram

---

## 🆘 Si algo sale mal

**Error: "relation already exists"**
- Las tablas ya existen en Neon
- Puedes ignorar estos errores o eliminar las tablas primero

**Error: "permission denied"**
- Verifica que la Connection String sea correcta
- Asegúrate de usar el usuario correcto (neondb_owner)

**Error: "connection timeout"**
- El archivo puede ser muy grande
- Intenta importar en partes más pequeñas
- O usa la Opción 1 (Dashboard) que es más robusta

---

## 📝 Nota Importante

Si ves errores sobre "schema auth" o "supabase_admin", puedes ignorarlos. Esos son schemas específicos de Supabase que no necesitas en Neon.


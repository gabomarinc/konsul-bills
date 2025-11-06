# 📦 Exportar Datos de Supabase (Plan Gratuito)

## ⚠️ Problema

El plan gratuito de Supabase **NO incluye backups automáticos**. Necesitamos exportar manualmente.

---

## ✅ Opción 1: Usar pg_dump (RECOMENDADO) ⭐

### Paso 1: Instalar PostgreSQL client (si no lo tienes)

```bash
# macOS
brew install postgresql

# Verificar que se instaló
pg_dump --version
```

### Paso 2: Exportar datos de Supabase

```bash
cd /Users/ortizalfano/Desktop/konsul-bills/konsul-bills

# Exportar TODO (schema + datos)
pg_dump "postgresql://postgres.oyeityuizebqjmpopsrn:Konsul2025abc@aws-1-us-east-1.pooler.supabase.com:5432/postgres" > supabase_backup.sql
```

**Nota:** Usa el puerto **5432** (directo) en lugar de 6543 (pooler) para exportar.

### Paso 3: Verificar el archivo

```bash
# Ver el tamaño del archivo
ls -lh supabase_backup.sql

# Ver las primeras líneas (para verificar que tiene contenido)
head -20 supabase_backup.sql
```

---

## ✅ Opción 2: Exportar desde SQL Editor (Manual)

### Paso 1: Ir a SQL Editor en Supabase

1. Ve a **Database** → **SQL Editor** (o usa el menú lateral)
2. Haz clic en **"New query"**

### Paso 2: Exportar tabla por tabla

Para cada tabla importante, ejecuta:

```sql
-- Exportar usuarios de Telegram
COPY "TelegramUser" TO STDOUT WITH CSV HEADER;

-- Exportar usuarios
COPY "User" TO STDOUT WITH CSV HEADER;

-- Exportar empresas
COPY "Company" TO STDOUT WITH CSV HEADER;

-- Exportar clientes
COPY "Client" TO STDOUT WITH CSV HEADER;

-- Y así para cada tabla...
```

**⚠️ Esto es tedioso si tienes muchas tablas.**

---

## ✅ Opción 3: Usar el script que creamos

```bash
cd /Users/ortizalfano/Desktop/konsul-bills/konsul-bills
./scripts/export-supabase.sh
```

Esto creará un archivo `supabase_backup_YYYYMMDD_HHMMSS.sql`

---

## 🎯 Recomendación: Usar pg_dump

**Es la forma más fácil y completa:**
- ✅ Exporta TODO (schema + datos)
- ✅ Un solo comando
- ✅ Mantiene relaciones entre tablas
- ✅ Funciona en cualquier plan

---

## 📋 Después de Exportar

Una vez que tengas el archivo `supabase_backup.sql`:

1. **Abre el archivo** y verifica que tiene contenido
2. **Copia todo** (Cmd+A, Cmd+C)
3. **Ve a Neon Dashboard** → **SQL Editor**
4. **Pega todo** y haz clic en **"Run"**
5. **Espera** a que termine la importación

---

## 🆘 Si pg_dump no funciona

**Error: "command not found"**
```bash
brew install postgresql
```

**Error: "connection refused"**
- Verifica que la URL de Supabase sea correcta
- Asegúrate de usar el puerto **5432** (directo), no 6543 (pooler)

**Error: "authentication failed"**
- Verifica que la contraseña sea correcta
- Puedes resetear la contraseña en Supabase → Database → Settings

---

## ✅ Verificar Exportación

Después de exportar, verifica que el archivo tiene contenido:

```bash
# Ver tamaño
ls -lh supabase_backup.sql

# Ver primeras líneas
head -50 supabase_backup.sql

# Contar líneas
wc -l supabase_backup.sql
```

Deberías ver algo como:
- CREATE TABLE statements
- INSERT INTO statements
- COPY statements

---

## 🚀 Siguiente Paso

Una vez que tengas el archivo exportado, sigue con:
1. Importar a Neon (SQL Editor → New query → Pegar → Run)
2. Verificar que los datos están en Neon
3. Actualizar variables en Vercel
4. Probar el bot


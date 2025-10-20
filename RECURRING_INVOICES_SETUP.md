# 🔄 Configuración de Facturas Recurrentes

Este documento explica cómo configurar el sistema de facturas recurrentes para que se generen automáticamente.

---

## 📋 Requisitos Previos

1. ✅ Base de datos PostgreSQL (ya configurada con Supabase)
2. ✅ Aplicación desplegada en Vercel (o cualquier hosting)
3. ✅ Repositorio en GitHub

---

## 🔧 Configuración de GitHub Actions (GRATIS)

### Paso 1: Generar un Token Secreto

En tu terminal local, genera un token aleatorio:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado (ejemplo: `a7f2d9e1c3b4...`).

---

### Paso 2: Configurar Variables de Entorno

#### A) En tu archivo `.env` local:

```env
CRON_SECRET=tu_token_aqui_generado_en_paso_1
```

#### B) En GitHub (Secrets del repositorio):

1. Ve a tu repositorio en GitHub
2. Click en `Settings` → `Secrets and variables` → `Actions`
3. Click en `New repository secret`
4. Agrega estos 2 secrets:

| Nombre | Valor | Descripción |
|--------|-------|-------------|
| `CRON_SECRET` | (el token que generaste) | Token de autenticación para el cron |
| `APP_URL` | `https://tu-app.vercel.app` | URL de tu aplicación en producción |

**Ejemplo:**
```
CRON_SECRET = a7f2d9e1c3b4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0
APP_URL = https://konsul-bills.vercel.app
```

---

### Paso 3: Subir el Workflow a GitHub

El archivo `.github/workflows/recurring-invoices.yml` ya está creado.

Sube tu código a GitHub:

```bash
git add .
git commit -m "Add recurring invoices feature"
git push origin main
```

---

### Paso 4: Verificar que funciona

#### Opción A: Ejecutar manualmente (recomendado para probar)

1. Ve a tu repositorio en GitHub
2. Click en `Actions` (en el menú superior)
3. Selecciona el workflow `Generate Recurring Invoices`
4. Click en `Run workflow` (botón gris)
5. Click en `Run workflow` (botón verde)

Verás los logs en tiempo real y si hay algún error.

#### Opción B: Esperar a las 2:00 AM UTC

El workflow se ejecutará automáticamente todos los días a las 2:00 AM UTC (4:00 AM en España en horario de invierno, 3:00 AM en verano).

---

## 🧪 Probar Localmente (antes de subir a GitHub)

Puedes probar el cron job manualmente:

```bash
# En tu terminal
curl -X POST http://localhost:3000/api/cron/recurring-invoices \
  -H "Authorization: Bearer TU_CRON_SECRET" \
  -H "Content-Type: application/json"
```

Deberías ver una respuesta como:

```json
{
  "success": true,
  "timestamp": "2025-10-17T02:00:00.000Z",
  "duration": "234ms",
  "generated": 3,
  "invoices": ["INV-00123", "INV-00124", "INV-00125"],
  "errors": 0
}
```

---

## 📅 Horarios Personalizados

Si quieres cambiar el horario, edita `.github/workflows/recurring-invoices.yml`:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Cambiar aquí
```

**Ejemplos de horarios:**

| Horario | Cron | Descripción |
|---------|------|-------------|
| 2:00 AM UTC diario | `'0 2 * * *'` | Actual |
| 9:00 AM UTC diario | `'0 9 * * *'` | Horario de oficina |
| 12:00 PM UTC diario | `'0 12 * * *'` | Mediodía |
| Cada 6 horas | `'0 */6 * * *'` | 00:00, 06:00, 12:00, 18:00 |
| Solo lunes a viernes a las 8 AM | `'0 8 * * 1-5'` | Días laborables |

🔗 **Generador de Cron:** https://crontab.guru/

---

## 🎯 Cómo Usar Facturas Recurrentes

### 1. Crear una Factura Recurrente

1. Ve a `Facturas` → `🔄 Facturas Recurrentes`
2. Click en `Nueva Factura Recurrente`
3. Completa el formulario:
   - **Cliente:** Selecciona un cliente existente
   - **Título:** ej: "Hosting mensual"
   - **Frecuencia:** Mensual, Semanal o Anual
   - **Día del mes:** (1-31) cuando se generará
   - **Fecha de inicio:** Cuando empieza
   - **Fecha de fin:** (opcional) cuando termina
   - **Días hasta vencimiento:** días para pagar

### 2. Gestionar Facturas Recurrentes

En la lista de facturas recurrentes puedes:

- **Pausar** (⏸️): Detiene temporalmente la generación
- **Reanudar** (▶️): Reactiva la generación automática
- **Editar** (✏️): Modificar detalles o recurrencia
- **Eliminar** (🗑️): Eliminar permanentemente

### 3. Facturas Generadas

Las facturas se crean automáticamente en estado **BORRADOR**.

Puedes revisarlas en `Facturas` → `Todas las Facturas` y:
- Editarlas si necesitas cambios
- Enviarlas al cliente
- Cobrarlas con Stripe (si está configurado)

---

## 🔍 Monitoreo y Logs

### Ver ejecuciones en GitHub Actions:

1. Ve a tu repo → `Actions`
2. Selecciona el workflow `Generate Recurring Invoices`
3. Verás todas las ejecuciones con:
   - ✅ Exitosas (verde)
   - ❌ Fallidas (rojo)
   - ⏸️ En progreso (amarillo)

### Logs del servidor:

Los logs también aparecen en tu consola de Vercel:

1. Ve a Vercel Dashboard
2. Selecciona tu proyecto
3. Tab `Logs`
4. Filtra por `[Recurring Invoices]`

---

## ❓ Solución de Problemas

### El workflow no se ejecuta

- ✅ Verifica que los secrets `CRON_SECRET` y `APP_URL` estén configurados
- ✅ Asegúrate de que el archivo `.github/workflows/recurring-invoices.yml` esté en `main`
- ✅ GitHub Actions requiere que haya actividad reciente en el repo (push)

### Error 401 Unauthorized

- ✅ Verifica que `CRON_SECRET` en GitHub coincida con el de tu `.env`
- ✅ Asegúrate de que `APP_URL` sea la URL correcta (sin `/` al final)

### No se generan facturas

- ✅ Verifica que haya facturas recurrentes con `isActive = true`
- ✅ Verifica que `nextRunDate` sea hoy o anterior
- ✅ Revisa los logs en GitHub Actions para ver errores

---

## 💰 Costos

| Servicio | Costo | Límite Gratuito |
|----------|-------|-----------------|
| **GitHub Actions** | **GRATIS** | 2,000 minutos/mes |
| **Vercel (Hobby)** | **GRATIS** | 100 GB bandwidth/mes |
| **Supabase (Free)** | **GRATIS** | 500 MB database |

**Consumo estimado:**
- 1 ejecución diaria = ~10 segundos
- 30 días = ~5 minutos/mes
- **0.25% del límite gratuito** ✅

---

## 🚀 ¡Listo!

Tu sistema de facturas recurrentes está configurado y funcionando. Las facturas se generarán automáticamente cada día sin que tengas que hacer nada.

**¿Dudas?** Revisa la documentación o los logs de GitHub Actions.



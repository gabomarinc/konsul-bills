# 🧾 Kônsul Bills

Sistema de gestión de facturación y cotizaciones construido con Next.js 15, TypeScript, Prisma y SQLite.

## 📋 Características

### 🔐 Autenticación Segura
- Autenticación JWT con cookies httpOnly
- Protección de rutas con middleware
- Rate limiting en endpoints de autenticación
- Validación de inputs con Zod
- Hashing de contraseñas con bcrypt (salt 12)

### 💼 Gestión de Facturas y Cotizaciones
- Crear, editar y eliminar facturas (invoices)
- Crear, editar y eliminar cotizaciones (quotes)
- Gestión de clientes
- Cálculo automático de impuestos y totales
- Numeración automática secuencial (INV-00001, Q-00001)
- Soporte para múltiples monedas (EUR, USD)

### 💳 Integración con Stripe
- Configuración de API Keys por empresa
- Creación automática de facturas en Stripe
- Envío de facturas por email a clientes
- Sincronización de estados de pago vía webhooks
- Encriptación segura de Secret Keys
- Hosted Invoice Pages de Stripe

### 🏢 Multi-empresa
- Sistema de empresas (companies)
- Configuración personalizable por empresa
- Membresías de usuarios por empresa

### 🎨 Interfaz Moderna
- UI construida con Tailwind CSS 4
- Componentes con Radix UI
- Diseño responsive
- Notificaciones con Sonner

### ⚡ Rendimiento y Seguridad
- Paginación en listados (máx. 100 items por página)
- IDs seguros generados con nanoid
- Validación de datos en backend
- Rate limiting configurable
- Middleware de autenticación





## 🔒 Seguridad

### Autenticación
- **JWT con cookies httpOnly**: Las sesiones se almacenan en cookies seguras, no en localStorage
- **Middleware de autenticación**: Todas las rutas protegidas requieren autenticación
- **Validación de datos**: Todos los inputs se validan con Zod

### Rate Limiting
- **Login**: 5 intentos cada 15 minutos por IP
- **Registro**: 3 intentos cada hora por IP
- **Headers de rate limit**: Las respuestas incluyen información sobre límites

### Generación de IDs
- **nanoid**: IDs únicos y seguros de 16 caracteres
- **Prefijos**: Cada tipo de entidad tiene su prefijo (`user_`, `company_`, etc.)

## 📊 API Endpoints



#### POST `/api/auth/logout`
Cerrar sesión

#### GET `/api/auth/me`
Obtener usuario autenticado

### Facturas

#### GET `/api/invoices?page=1&limit=50`
Listar facturas (paginado)

#### POST `/api/invoices`
Crear factura

```json
{
  "client": "Nombre Cliente",
  "clientEmail": "cliente@ejemplo.com",
  "title": "Factura de servicios",
  "issueDate": "2025-01-15",
  "dueDate": "2025-02-15",
  "currency": "EUR",
  "tax": 21,
  "items": [
    {
      "description": "Servicio de desarrollo",
      "qty": 10,
      "price": 50
    }
  ],
  "notes": "Notas adicionales"
}
```

#### GET `/api/invoices/[id]`
Obtener factura por ID

#### PUT `/api/invoices/[id]`
Actualizar factura

#### DELETE `/api/invoices/[id]`
Eliminar factura

### Cotizaciones

Los endpoints son similares a facturas, reemplazando `/invoices` por `/quotes`

### Stripe

#### GET `/api/stripe/config`
Obtener configuración de Stripe para la empresa actual

**Respuesta:**
```json
{
  "enabled": true,
  "secretKey": "sk_test_...",
  "publishableKey": "pk_test_..."
}
```

#### POST `/api/stripe/config`
Guardar/actualizar configuración de Stripe

**Body:**
```json
{
  "secretKey": "sk_test_...",
  "publishableKey": "pk_test_...",
  "enabled": true
}
```

#### POST `/api/stripe/invoice/[id]`
Enviar factura a Stripe para cobro

**Respuesta:**
```json
{
  "success": true,
  "stripeInvoiceId": "in_...",
  "hostedInvoiceUrl": "https://invoice.stripe.com/..."
}
```

#### POST `/api/stripe/webhook`
Endpoint público para recibir eventos de Stripe (webhooks)

**Eventos manejados:**
- `invoice.payment_succeeded` - Marca factura como PAID
- `invoice.payment_failed` - Marca factura como OVERDUE

## 🔧 Configuración de Stripe

### 1. Obtener API Keys

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. Click en **Developers** → **API keys**
3. Copia tus **Secret key** y **Publishable key**
4. Para pruebas, usa las **Test keys** (empiezan con `sk_test_` y `pk_test_`)

### 2. Configurar en la Aplicación

1. Inicia sesión en Konsul Bills
2. Ve a **Settings** → **Integraciones**
3. Click en **Conectar** en la tarjeta de Stripe
4. Pega tus API Keys
5. Click en **Guardar y Conectar**

### 3. Configurar Webhooks (Opcional)

Para recibir notificaciones automáticas de pagos:

1. En Stripe Dashboard, ve a **Developers** → **Webhooks**
2. Click en **Add endpoint**
3. URL: `https://tu-dominio.com/api/stripe/webhook`
4. Selecciona estos eventos:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copia el **Signing secret** (empieza con `whsec_`)
6. Agrégalo a tu `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

### 4. Usar Stripe para Cobrar

1. Ve a una factura en Konsul Bills
2. Click en **Cobrar con Stripe**
3. El sistema:
   - Crea automáticamente el cliente en Stripe (si no existe)
   - Crea la factura en Stripe con todos los items
   - Envía la factura por email al cliente
   - Te muestra el enlace del Hosted Invoice Page

El cliente recibirá un email con un enlace para pagar. Cuando pague, el webhook actualizará automáticamente el estado de la factura a **PAID**.

## 🗄️ Base de Datos

### Modelos Principales

- **User**: Usuarios del sistema
- **Company**: Empresas
- **CompanySettings**: Configuración de empresas
- **Membership**: Relación usuario-empresa
- **Client**: Clientes de las empresas
- **Invoice**: Facturas
- **InvoiceItem**: Items de facturas
- **Quote**: Cotizaciones
- **QuoteItem**: Items de cotizaciones
- **Sequence**: Secuencias para numeración automática

## 🛠️ Tecnologías

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript 5
- **Base de datos**: SQLite con Prisma ORM
- **Autenticación**: JWT con cookies httpOnly
- **Validación**: Zod
- **UI**: Tailwind CSS 4, Radix UI
- **Iconos**: Lucide React
- **Notificaciones**: Sonner
- **Pagos**: Stripe (integración completa con webhooks)

## 📝 Scripts

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Iniciar servidor de producción
npm run lint         # Ejecutar linter
npm run db:seed      # Poblar base de datos con datos de ejemplo
```

## 🚧 Producción

### Consideraciones para Producción

1. **Variables de Entorno**
   - Cambia `JWT_SECRET` por una clave aleatoria segura
   - Usa una base de datos más robusta (PostgreSQL, MySQL)
   - Configura `NODE_ENV=production`

2. **Rate Limiting**
   - Considera usar Redis para rate limiting distribuido
   - Ajusta los límites según tus necesidades

3. **Seguridad**
   - Configura CORS apropiadamente
   - Usa HTTPS
   - Implementa logging y monitoreo
   - Revisa las políticas de cookies según tu región (GDPR, etc.)

4. **Base de Datos**
   - Migra a PostgreSQL o MySQL para producción
   - Configura backups automáticos
   - Implementa migrations con Prisma

## 📄 Licencia

Este proyecto es privado y propietario.

## 🐛 Reporte de Bugs

Si encuentras un bug, por favor abre un issue con:
- Descripción del problema
- Pasos para reproducirlo
- Comportamiento esperado vs actual
- Screenshots si aplica

## 📧 Contacto

Para preguntas o soporte, contacta al equipo de desarrollo.

---

Desarrollado con ❤️ por el equipo de Kônsul

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

## 🚀 Instalación

### Requisitos
- Node.js 20+
- npm o pnpm

### Pasos

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd konsul-bills
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita el archivo `.env` y configura las siguientes variables:

```env
# Base de datos
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret - CAMBIA ESTO EN PRODUCCIÓN
JWT_SECRET="tu-super-secreto-jwt-cambiar-en-produccion"

# Configuración de sesión (en segundos)
SESSION_MAX_AGE=86400 # 24 horas

# Entorno
NODE_ENV="development"

# Rate Limiting
RATE_LIMIT_MAX=10

# Stripe (opcional - solo para webhooks)
STRIPE_SECRET_KEY="sk_test_..."  # Solo si usas webhooks globales
STRIPE_WEBHOOK_SECRET="whsec_..."  # Secret del webhook de Stripe
ENCRYPTION_KEY="change-this-to-32-character-key!"  # 32 caracteres para encriptar API keys
RATE_LIMIT_WINDOW_MS=900000 # 15 minutos
```

4. **Configurar base de datos**
```bash
npx prisma generate
npx prisma db push
```

5. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
konsul-bills/
├── prisma/
│   ├── schema.prisma       # Esquema de base de datos
│   └── dev.db             # Base de datos SQLite
├── src/
│   ├── app/               # App Router de Next.js
│   │   ├── api/          # API Routes
│   │   │   ├── auth/     # Autenticación (login, register, logout)
│   │   │   ├── invoices/ # CRUD de facturas
│   │   │   └── quotes/   # CRUD de cotizaciones
│   │   ├── auth/         # Páginas de autenticación
│   │   ├── dashboard/    # Dashboard principal
│   │   ├── invoices/     # Gestión de facturas
│   │   ├── quotes/       # Gestión de cotizaciones
│   │   └── settings/     # Configuración
│   ├── components/       # Componentes React
│   │   ├── konsul/      # Componentes específicos
│   │   └── ui/          # Componentes UI reutilizables
│   ├── contexts/        # Contextos de React
│   │   └── AuthContext.tsx
│   ├── lib/             # Utilidades
│   │   ├── auth-utils.ts    # Utilidades de autenticación
│   │   ├── db.ts            # Operaciones de base de datos
│   │   ├── jwt.ts           # Manejo de JWT
│   │   ├── rate-limit.ts    # Rate limiting
│   │   ├── schemas.ts       # Esquemas de validación Zod
│   │   ├── prisma.ts        # Cliente de Prisma
│   │   └── ids.ts           # Generación de IDs
│   └── middleware.ts    # Middleware de Next.js
├── .env                 # Variables de entorno
├── .env.example        # Ejemplo de variables de entorno
└── package.json

```

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

### Autenticación

#### POST `/api/auth/register`
Registrar nuevo usuario

```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "name": "Nombre Usuario"
}
```

#### POST `/api/auth/login`
Iniciar sesión

```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

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

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

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

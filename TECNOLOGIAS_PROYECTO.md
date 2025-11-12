# 🛠️ Tecnologías del Proyecto Konsul Bills

## 📋 Resumen Ejecutivo

**Konsul Bills** es una aplicación web moderna de gestión de facturación y cotizaciones, construida con tecnologías de última generación para ofrecer una experiencia rápida, segura y escalable.

---

## 💻 Lenguaje de Programación

### **TypeScript 5**
- Lenguaje principal del proyecto
- Tipado estático para mayor seguridad y productividad
- Configuración estricta (`strict: true`)
- Compatible con ES2017+

---

## 🚀 Framework y Runtime

### **Next.js 15.5.0**
- Framework React para aplicaciones web
- **App Router** (arquitectura moderna de Next.js)
- Server-Side Rendering (SSR)
- Server Components
- API Routes integradas
- Optimizaciones automáticas de rendimiento
- **Turbopack** para desarrollo rápido

### **Node.js >= 18.0.0**
- Runtime de JavaScript
- Versión mínima requerida: 18.0.0

### **React 19.1.0**
- Biblioteca de UI
- React DOM 19.1.0
- Componentes funcionales con hooks

---

## 🗄️ Base de Datos

### **PostgreSQL**
- Base de datos principal (producción)
- Alojada en **Neon** (PostgreSQL serverless)
- Anteriormente en Supabase (migrado a Neon)

### **Prisma ORM 6.15.0**
- ORM (Object-Relational Mapping) para TypeScript
- Migraciones automáticas
- Type-safe database client
- Schema-first approach

### **Modelos de Base de Datos:**
- `User` - Usuarios del sistema
- `Company` - Empresas
- `CompanySettings` - Configuración de empresas
- `Client` - Clientes
- `Invoice` - Facturas
- `InvoiceItem` - Items de facturas
- `Quote` - Cotizaciones
- `QuoteItem` - Items de cotizaciones
- `RecurringInvoice` - Facturas recurrentes
- `Payment` - Pagos
- `Membership` - Relación usuario-empresa
- `TelegramUser` - Integración con Telegram
- `UserProfile` - Perfiles de usuario
- `Sequence` - Secuencias para numeración
- `Account`, `Session`, `VerificationToken` - Autenticación

---

## 🔐 Autenticación y Seguridad

### **JWT (JSON Web Tokens)**
- Autenticación basada en tokens
- Implementado con la librería `jose` (v6.1.0)
- Cookies httpOnly para mayor seguridad
- No almacenamiento en localStorage

### **bcryptjs 3.0.2**
- Hashing de contraseñas
- Salt rounds: 12
- Algoritmo bcrypt para seguridad

### **Zod 4.1.12**
- Validación de esquemas TypeScript-first
- Validación de datos en runtime
- Type inference automático

---

## 🎨 Interfaz de Usuario (UI)

### **Tailwind CSS 4.0.0**
- Framework CSS utility-first
- Diseño responsive
- Configuración personalizada

### **Radix UI**
- Componentes accesibles y sin estilos
- Componentes utilizados:
  - `@radix-ui/react-dialog` - Diálogos modales
  - `@radix-ui/react-dropdown-menu` - Menús desplegables
  - `@radix-ui/react-tabs` - Pestañas
  - `@radix-ui/react-tooltip` - Tooltips
  - `@radix-ui/react-checkbox` - Checkboxes
  - `@radix-ui/react-switch` - Switches
  - `@radix-ui/react-label` - Labels
  - `@radix-ui/react-slot` - Slots

### **Lucide React 0.541.0**
- Librería de iconos moderna
- Iconos SVG optimizados

### **Sonner 2.0.7**
- Sistema de notificaciones toast
- Notificaciones elegantes y no intrusivas

### **class-variance-authority 0.7.1**
- Gestión de variantes de componentes
- Utilizado con Tailwind CSS

### **clsx 2.1.1** y **tailwind-merge 3.3.1**
- Utilidades para combinar clases CSS
- Resolución de conflictos de Tailwind

---

## 💳 Pagos

### **Stripe 19.1.0**
- Integración completa de pagos
- Creación de facturas en Stripe
- Webhooks para sincronización de pagos
- Hosted Invoice Pages
- Encriptación de API keys

---

## 🤖 Inteligencia Artificial

### **OpenAI API**
- Modelo: `gpt-4o-mini`
- Procesamiento de lenguaje natural
- Respuestas conversacionales en Telegram

### **Google Gemini API**
- Modelo: `gemini-1.5-flash`
- Alternativa a OpenAI
- Procesamiento de lenguaje natural

---

## 📱 Integración con Telegram

### **node-telegram-bot-api 0.66.0**
- SDK oficial de Telegram Bot API
- Webhooks para recibir mensajes
- Envío de mensajes automáticos
- Bot conversacional con IA

---

## 🔄 Gestión de Estado y Datos

### **TanStack Query (React Query) 5.90.5**
- Gestión de estado del servidor
- Caché automático
- Sincronización de datos
- Revalidación automática

---

## 🛠️ Utilidades

### **nanoid 5.1.6**
- Generación de IDs únicos y seguros
- IDs de 16 caracteres
- Prefijos por tipo de entidad

### **Express 5.1.0**
- Framework web (usado en algunos scripts)

---

## 🏗️ Herramientas de Desarrollo

### **TypeScript 5**
- Compilador TypeScript
- Type checking en tiempo de compilación

### **ESLint 9**
- Linter de código
- Configuración con `eslint-config-next`

### **tsx 4.20.5**
- Ejecutor de TypeScript
- Utilizado para scripts de Prisma

---

## ☁️ Despliegue y Hosting

### **Vercel**
- Plataforma de hosting serverless
- Deployments automáticos desde GitHub
- Serverless Functions
- Edge Functions
- Variables de entorno gestionadas

### **Neon**
- Base de datos PostgreSQL serverless
- Connection pooling nativo
- Escalado automático

---

## 📦 Gestión de Paquetes

### **npm**
- Gestor de paquetes de Node.js
- `package-lock.json` para versiones fijas

---

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo con Turbopack
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run lint         # Ejecutar linter
npm run db:seed      # Poblar base de datos
```

---

## 📊 Arquitectura

### **Frontend**
- Next.js App Router
- React Server Components
- Client Components cuando es necesario
- Tailwind CSS para estilos

### **Backend**
- Next.js API Routes
- Serverless Functions en Vercel
- Prisma para acceso a base de datos

### **Base de Datos**
- PostgreSQL en Neon
- Prisma ORM como capa de abstracción
- Migraciones versionadas

---

## 🔒 Seguridad

- ✅ Autenticación JWT con cookies httpOnly
- ✅ Hashing de contraseñas con bcrypt
- ✅ Validación de datos con Zod
- ✅ Rate limiting en endpoints críticos
- ✅ Middleware de autenticación
- ✅ Encriptación de API keys sensibles
- ✅ HTTPS obligatorio en producción

---

## 📈 Escalabilidad

- ✅ Serverless architecture (Vercel)
- ✅ Connection pooling (Neon)
- ✅ Caché con React Query
- ✅ Paginación en listados
- ✅ Optimizaciones de Next.js

---

## 🌐 APIs Externas Integradas

1. **Telegram Bot API** - Bot conversacional
2. **OpenAI API** - Procesamiento de lenguaje natural
3. **Google Gemini API** - Procesamiento de lenguaje natural (alternativa)
4. **Stripe API** - Procesamiento de pagos

---

## 📝 Resumen de Versiones Clave

| Tecnología | Versión |
|------------|---------|
| Next.js | 15.5.0 |
| React | 19.1.0 |
| TypeScript | 5.x |
| Prisma | 6.15.0 |
| Node.js | >= 18.0.0 |
| Tailwind CSS | 4.0.0 |
| Stripe | 19.1.0 |
| TanStack Query | 5.90.5 |

---

## 🎯 Stack Tecnológico Completo

```
Frontend:
├── Next.js 15 (App Router)
├── React 19
├── TypeScript 5
├── Tailwind CSS 4
├── Radix UI
├── Lucide React
└── Sonner

Backend:
├── Next.js API Routes
├── Prisma ORM
├── JWT (jose)
├── bcryptjs
└── Zod

Base de Datos:
└── PostgreSQL (Neon)

Integraciones:
├── Stripe (Pagos)
├── Telegram Bot API
├── OpenAI API
└── Google Gemini API

Deployment:
└── Vercel (Serverless)
```

---

*Última actualización: Enero 2025*


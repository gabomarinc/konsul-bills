# 🛠️ Tecnologías del Proyecto - Backend vs Frontend

## 📋 Resumen

Este documento divide las tecnologías utilizadas en **Konsul Bills** entre **Backend** y **Frontend** para una mejor comprensión de la arquitectura.

---

## 🎨 FRONTEND

### **Framework y Librerías Core**

#### **Next.js 15.5.0**
- Framework React para aplicaciones web
- **App Router** (arquitectura moderna)
- Server Components y Client Components
- Routing automático basado en carpetas
- Optimizaciones automáticas de rendimiento
- **Turbopack** para desarrollo rápido

#### **React 19.1.0**
- Biblioteca de UI
- Componentes funcionales con hooks
- React DOM 19.1.0

#### **TypeScript 5**
- Lenguaje de programación
- Tipado estático
- Type safety en todo el código

---

### **Estilos y UI**

#### **Tailwind CSS 4.0.0**
- Framework CSS utility-first
- Diseño responsive
- Configuración personalizada
- Clases utilitarias para estilos rápidos

#### **Radix UI**
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

#### **Lucide React 0.541.0**
- Librería de iconos moderna
- Iconos SVG optimizados
- Más de 1000 iconos disponibles

#### **Sonner 2.0.7**
- Sistema de notificaciones toast
- Notificaciones elegantes y no intrusivas
- Posicionamiento personalizable

#### **class-variance-authority 0.7.1**
- Gestión de variantes de componentes
- Utilizado con Tailwind CSS
- Permite crear componentes con múltiples variantes

#### **clsx 2.1.1** y **tailwind-merge 3.3.1**
- Utilidades para combinar clases CSS
- Resolución de conflictos de Tailwind
- Evita duplicación de clases

---

### **Gestión de Estado y Datos**

#### **TanStack Query (React Query) 5.90.5**
- Gestión de estado del servidor
- Caché automático de datos
- Sincronización automática
- Revalidación en background
- Optimistic updates

---

### **Utilidades Frontend**

#### **nanoid 5.1.6**
- Generación de IDs únicos
- Utilizado para keys de React
- IDs seguros de 16 caracteres

---

## ⚙️ BACKEND

### **Framework y Runtime**

#### **Next.js 15.5.0 (API Routes)**
- API Routes para endpoints REST
- Serverless Functions
- Manejo de requests HTTP
- Middleware integrado

#### **Node.js >= 18.0.0**
- Runtime de JavaScript
- Versión mínima requerida: 18.0.0
- Ejecuta el código del servidor

#### **TypeScript 5**
- Lenguaje de programación
- Tipado estático
- Type safety en APIs

---

### **Base de Datos y ORM**

#### **PostgreSQL**
- Base de datos relacional
- Alojada en **Neon** (PostgreSQL serverless)
- Escalable y robusta
- Soporte para transacciones

#### **Prisma ORM 6.15.0**
- ORM (Object-Relational Mapping)
- Type-safe database client
- Migraciones automáticas
- Schema-first approach
- Query builder type-safe

---

### **Autenticación y Seguridad**

#### **JWT (JSON Web Tokens)**
- Implementado con `jose` 6.1.0
- Autenticación basada en tokens
- Cookies httpOnly para seguridad
- Tokens firmados y verificados

#### **bcryptjs 3.0.2**
- Hashing de contraseñas
- Salt rounds: 12
- Algoritmo bcrypt
- Seguridad contra ataques de fuerza bruta

#### **Zod 4.1.12**
- Validación de esquemas
- Validación de datos en runtime
- Type inference automático
- Validación de requests y responses

---

### **Integraciones Externas**

#### **Stripe 19.1.0**
- SDK de Stripe para pagos
- Creación de facturas
- Webhooks para eventos
- Encriptación de API keys
- Hosted Invoice Pages

#### **node-telegram-bot-api 0.66.0**
- SDK de Telegram Bot API
- Webhooks para recibir mensajes
- Envío de mensajes automáticos
- Manejo de comandos y conversaciones

#### **OpenAI API**
- Modelo: `gpt-4o-mini`
- Procesamiento de lenguaje natural
- Respuestas conversacionales
- Integración en backend

#### **Google Gemini API**
- Modelo: `gemini-1.5-flash`
- Alternativa a OpenAI
- Procesamiento de lenguaje natural
- Integración en backend

---

### **Utilidades Backend**

#### **Express 5.1.0**
- Framework web (usado en algunos scripts)
- Manejo de rutas
- Middleware personalizado

#### **nanoid 5.1.6**
- Generación de IDs únicos
- IDs seguros para entidades
- Prefijos por tipo de entidad

---

## 🔄 COMPARTIDO (Backend y Frontend)

### **TypeScript 5**
- Lenguaje utilizado en todo el proyecto
- Backend: API Routes, servicios, utilidades
- Frontend: Componentes, hooks, utilidades

### **Next.js 15.5.0**
- Framework que unifica backend y frontend
- Backend: API Routes, Server Components
- Frontend: Client Components, routing, optimizaciones

### **Zod 4.1.12**
- Backend: Validación de requests
- Frontend: Validación de formularios
- Compartido: Esquemas de validación

---

## 📊 Arquitectura Visual

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
├─────────────────────────────────────────────────────────┤
│  Next.js 15 (App Router)                                │
│  ├── React 19                                           │
│  ├── TypeScript 5                                       │
│  ├── Tailwind CSS 4                                     │
│  ├── Radix UI                                           │
│  ├── Lucide React                                       │
│  ├── Sonner                                             │
│  └── TanStack Query                                     │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/API
┌─────────────────────────────────────────────────────────┐
│                    BACKEND                              │
├─────────────────────────────────────────────────────────┤
│  Next.js 15 (API Routes)                               │
│  ├── Node.js >= 18                                      │
│  ├── TypeScript 5                                       │
│  ├── Prisma ORM                                         │
│  ├── JWT (jose)                                         │
│  ├── bcryptjs                                           │
│  ├── Zod                                                │
│  ├── Stripe SDK                                         │
│  ├── Telegram Bot API                                   │
│  ├── OpenAI API                                         │
│  └── Google Gemini API                                  │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              BASE DE DATOS                              │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL (Neon)                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Resumen por Categoría

### **Solo Frontend**
- ✅ Tailwind CSS
- ✅ Radix UI
- ✅ Lucide React
- ✅ Sonner
- ✅ class-variance-authority
- ✅ clsx / tailwind-merge
- ✅ TanStack Query (principalmente frontend)

### **Solo Backend**
- ✅ Prisma ORM
- ✅ PostgreSQL
- ✅ bcryptjs
- ✅ jose (JWT)
- ✅ Stripe SDK
- ✅ node-telegram-bot-api
- ✅ OpenAI API
- ✅ Google Gemini API
- ✅ Express (scripts)

### **Compartido**
- ✅ Next.js 15
- ✅ React 19
- ✅ TypeScript 5
- ✅ Zod
- ✅ nanoid

---

## 📝 Detalles por Capa

### **Capa de Presentación (Frontend)**
- Renderizado de UI
- Interacción con el usuario
- Gestión de estado del cliente
- Optimizaciones de rendimiento visual

### **Capa de Aplicación (Backend)**
- Lógica de negocio
- Validación de datos
- Autenticación y autorización
- Integraciones externas

### **Capa de Datos (Backend)**
- Acceso a base de datos
- ORM (Prisma)
- Migraciones
- Queries optimizadas

---

## 🚀 Flujo de Datos

```
Usuario (Frontend)
    ↓
React Component
    ↓
TanStack Query
    ↓
Next.js API Route (Backend)
    ↓
Validación (Zod)
    ↓
Lógica de Negocio
    ↓
Prisma ORM
    ↓
PostgreSQL (Neon)
```

---

## 🔧 Herramientas de Desarrollo

### **Frontend**
- ESLint (linting)
- TypeScript Compiler
- Tailwind CSS Compiler
- Next.js Dev Server (Turbopack)

### **Backend**
- ESLint (linting)
- TypeScript Compiler
- Prisma CLI
- tsx (ejecutor de TypeScript)

---

*Última actualización: Enero 2025*


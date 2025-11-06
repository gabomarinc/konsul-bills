# 🔑 Cómo Configurar Gemini en Vercel (Paso a Paso)

## ⚠️ IMPORTANTE: NO compartas tu API key con nadie

Los API keys son secretos y solo deben estar en Vercel como variables de entorno.

---

## Pasos para Configurar

### 1️⃣ Obtener la API Key de Gemini

1. Ve a: https://makersuite.google.com/app/apikey
2. Inicia sesión con tu cuenta de Google
3. Si es tu primera vez, crea un nuevo proyecto
4. Haz clic en "Create API Key"
5. **Copia la API key** (se ve algo como: `AIzaSy...`)

### 2️⃣ Agregar en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona el proyecto `konsul-bills`
3. Ve a **Settings** → **Environment Variables**
4. Haz clic en **Add New**
5. Completa:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Pega tu API key (la que copiaste)
   - **Environment:** Selecciona todas las opciones (Production, Preview, Development)
6. Haz clic en **Save**

### 3️⃣ Redesplegar (Importante)

Después de agregar la variable, **debes redesplegar**:

1. Ve a la pestaña **Deployments**
2. Haz clic en los **3 puntos** (⋯) del último deployment
3. Selecciona **Redeploy**
4. O simplemente haz un nuevo commit y push (Vercel redesplegará automáticamente)

### 4️⃣ Verificar que Funciona

1. Abre Telegram y envía un mensaje al bot en lenguaje natural:
   ```
   Crea una cotización de 500 dólares para Juan Pérez
   ```
2. El bot debería responder procesando con IA y preguntando confirmación

---

## 🔒 Seguridad

- ✅ **SÍ:** Agregar el API key en Vercel como variable de entorno
- ❌ **NO:** Compartir el API key en código, GitHub, o con otras personas
- ❌ **NO:** Hacer commit del API key en el repositorio

El código ya está configurado para leer `process.env.GEMINI_API_KEY` automáticamente.

---

## 🐛 Si No Funciona

1. Verifica que la variable se llama exactamente `GEMINI_API_KEY` (mayúsculas)
2. Verifica que redesplegaste después de agregar la variable
3. Revisa los logs en Vercel para ver errores
4. Verifica que la API key sea válida en: https://makersuite.google.com/app/apikey

---

## 💡 Alternativa: OpenAI

Si prefieres usar OpenAI en lugar de Gemini:

1. Obtén la API key en: https://platform.openai.com/api-keys
2. Agrega en Vercel: `OPENAI_API_KEY` (en lugar de `GEMINI_API_KEY`)
3. El código detectará automáticamente cuál usar

**Nota:** El código intenta usar OpenAI primero, luego Gemini, y si no hay ninguno, usa parseo básico.


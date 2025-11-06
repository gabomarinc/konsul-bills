# 🤖 Cómo Funciona el Bot de Telegram con IA

## 📋 Flujo Completo (Paso a Paso)

```
┌─────────────┐
│   Usuario   │
│  (Telegram) │
└──────┬──────┘
       │ 1. Usuario escribe: "Hola, ¿cómo estás?"
       │
       ▼
┌─────────────────────────────────────┐
│         Telegram Servers            │
│  (Recibe el mensaje del usuario)    │
└──────┬──────────────────────────────┘
       │ 2. Telegram envía el mensaje al webhook
       │    URL: https://konsul-bills.vercel.app/api/telegram/webhook
       │
       ▼
┌─────────────────────────────────────┐
│         Vercel (Tu Código)          │
│  /api/telegram/webhook/route.ts     │
└──────┬──────────────────────────────┘
       │
       ├─► 3. Recibe el mensaje
       │
       ├─► 4. Llama a generateConversationalResponse()
       │      (usa Gemini con GEMINI_API_KEY)
       │
       ├─► 5. Gemini genera respuesta: "¡Hola! Soy Axel..."
       │
       └─► 6. Envía respuesta usando bot.sendMessage()
           │
           ▼
┌─────────────────────────────────────┐
│         Telegram Bot API             │
│  (Envía mensaje al usuario)         │
└──────┬──────────────────────────────┘
       │ 7. Telegram entrega el mensaje
       │
       ▼
┌─────────────┐
│   Usuario   │
│  (Ve la     │
│  respuesta) │
└─────────────┘
```

## 🔑 Componentes Clave

### 1. **Webhook de Telegram**
- **URL**: `https://konsul-bills.vercel.app/api/telegram/webhook`
- **Función**: Recibe TODOS los mensajes que los usuarios envían al bot
- **Archivo**: `src/app/api/telegram/webhook/route.ts`

### 2. **Token del Bot**
- **Variable**: `TELEGRAM_BOT_TOKEN` en Vercel
- **Función**: Permite que tu código envíe mensajes usando la API de Telegram
- **Ejemplo**: `8339985693:AAHEa5VG37ie8dyCOuJjV2rND02t5wBPtCs`

### 3. **API Key de Gemini**
- **Variable**: `GEMINI_API_KEY` en Vercel
- **Función**: Genera respuestas conversacionales inteligentes
- **Archivo**: `src/lib/telegram-ai.ts` → función `generateConversationalResponse()`

### 4. **Función bot.sendMessage()**
- **Función**: Envía mensajes de vuelta a Telegram
- **Código**: `await bot.sendMessage(chatId, "Tu respuesta aquí")`

## 💡 Ejemplo Real

Cuando escribes "Hola" en Telegram:

1. **Telegram** → Envía a Vercel: `{ message: { text: "Hola", chat: { id: 5556569720 } } }`

2. **Vercel** → Recibe en `/api/telegram/webhook/route.ts`:
   ```typescript
   const text = update.message.text // "Hola"
   const chatId = update.message.chat.id // 5556569720
   ```

3. **Vercel** → Llama a Gemini:
   ```typescript
   const response = await generateConversationalResponse("Hola", {
     telegramId: "5556569720",
     isLinked: false
   })
   // Gemini responde: "👋 ¡Hola! Soy Axel, tu asistente..."
   ```

4. **Vercel** → Envía respuesta a Telegram:
   ```typescript
   await bot.sendMessage(chatId, response)
   // Envía: "👋 ¡Hola! Soy Axel, tu asistente..."
   ```

5. **Telegram** → Muestra el mensaje al usuario

## ✅ Verificación

Para verificar que todo funciona:

1. **Verifica el webhook**:
   ```bash
   curl "https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo"
   ```
   Debe mostrar: `"url": "https://konsul-bills.vercel.app/api/telegram/webhook"`

2. **Verifica las variables en Vercel**:
   - ✅ `TELEGRAM_BOT_TOKEN` (ya configurado)
   - ✅ `GEMINI_API_KEY` (ya configurado según tú)

3. **Prueba el bot**:
   - Escribe "Hola" en Telegram
   - El bot debería responder con un mensaje generado por Gemini

## 🐛 Si No Funciona

1. **Revisa los logs en Vercel**:
   - Busca: `[TELEGRAM] Generando respuesta conversacional con IA...`
   - Busca: `[TELEGRAM] ✅ Respuesta generada por IA`

2. **Verifica que Gemini esté configurado**:
   - En Vercel → Settings → Environment Variables
   - Debe existir `GEMINI_API_KEY`

3. **Verifica que el webhook esté activo**:
   - El webhook debe estar configurado en Telegram
   - URL debe ser: `https://konsul-bills.vercel.app/api/telegram/webhook`

## 📝 Resumen

**Telegram NO sabe qué responder por sí solo**. 

Lo que pasa es:
1. Telegram envía el mensaje a tu código en Vercel
2. Tu código usa Gemini para generar una respuesta
3. Tu código envía esa respuesta de vuelta a Telegram
4. Telegram muestra la respuesta al usuario

**Todo está automatizado en el código que ya está desplegado.**


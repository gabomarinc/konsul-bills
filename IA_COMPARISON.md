# 🤖 Comparación: OpenAI vs Gemini para Telegram Bot

## Para Empezar GRATIS (Sin Tarjeta)

### 🥇 **GEMINI - RECOMENDADO**

**Ventajas:**
- ✅ **Completamente gratis** - No requiere tarjeta de crédito
- ✅ **Gemini 1.5 Flash** tiene tier gratuito generoso
- ✅ **Más económico** cuando empiezas a pagar: $0.075/1M tokens entrada vs $0.15 de OpenAI
- ✅ **Buen soporte para español**
- ✅ **Rápido** - Latencia baja
- ✅ **API simple** - Fácil de integrar

**Limitaciones del tier gratuito:**
- ~15-60 requests por minuto (depende del modelo)
- Suficiente para uso personal/pequeño

**Cómo obtener la API Key:**
1. Ve a: https://makersuite.google.com/app/apikey
2. Inicia sesión con tu cuenta de Google
3. Crea un nuevo proyecto o selecciona uno existente
4. Copia la API key
5. ¡Listo! No necesitas tarjeta de crédito

---

### 🥈 **OpenAI - Alternativa**

**Ventajas:**
- ✅ **$5 USD de créditos gratis** al registrarse
- ✅ **Excelente calidad** en español
- ✅ **GPT-4o-mini** es muy preciso
- ✅ **Function calling** muy robusto

**Desventajas:**
- ❌ **Requiere tarjeta de crédito** desde el inicio (aunque no cobra hasta agotar créditos)
- ❌ **Más caro** cuando empiezas a pagar: $0.15/1M tokens entrada
- ❌ Los créditos gratis se agotan rápido si usas mucho

**Cómo obtener la API Key:**
1. Ve a: https://platform.openai.com/api-keys
2. Crea una cuenta
3. Agrega método de pago (requerido)
4. Obtienes $5 USD gratis
5. Crea una API key

---

## Comparación de Costos (Después del Tier Gratuito)

### Por 1,000 conversaciones típicas (~50 tokens entrada, 200 tokens salida):

| Modelo | Costo por 1K conversaciones | Costo mensual (100 conversaciones/día) |
|--------|------------------------------|----------------------------------------|
| **Gemini 1.5 Flash** | ~$0.02 | ~$0.60 |
| **OpenAI GPT-4o-mini** | ~$0.04 | ~$1.20 |

**Conclusión:** Gemini es **2x más económico**.

---

## Recomendación Final

### Para Empezar AHORA (Sin Tarjeta):
👉 **Usa Gemini** - Es completamente gratis y no requiere tarjeta

### Si Ya Tienes Tarjeta y Quieres Máxima Calidad:
👉 **Usa OpenAI** - Mejor calidad, pero más caro

### Estrategia Híbrida (Recomendada):
1. **Empieza con Gemini** (gratis, sin tarjeta)
2. **Si necesitas más calidad**, agrega OpenAI después
3. El código ya soporta ambos - solo cambia la variable de entorno

---

## Configuración Rápida

### Opción 1: Gemini (Recomendado para empezar)
```bash
# En Vercel, agrega:
GEMINI_API_KEY="tu-api-key-de-gemini"
```

### Opción 2: OpenAI
```bash
# En Vercel, agrega:
OPENAI_API_KEY="sk-tu-api-key-de-openai"
```

**Nota:** El código intenta usar OpenAI primero, luego Gemini, y si no hay ninguno, usa parseo básico sin IA.

---

## ¿Cuánto Cuesta Realmente?

Para un uso típico (10-50 conversaciones por día):
- **Gemini**: $0-2 USD/mes (tier gratuito suele ser suficiente)
- **OpenAI**: $1-5 USD/mes (después de agotar créditos gratis)

**Conclusión:** Ambos son muy económicos para uso personal/pequeño. Gemini es mejor para empezar sin compromiso.



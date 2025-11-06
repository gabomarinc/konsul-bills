# 🤖 Guía de Configuración del Bot de Telegram

Esta guía te ayudará a configurar y usar el bot de Telegram para gestionar facturas y cotizaciones desde Telegram.

## 📋 Requisitos Previos

1. Tener una cuenta de Telegram
2. Tener el proyecto desplegado y funcionando
3. Acceso a las variables de entorno del proyecto

## 🔧 Paso 1: Crear el Bot en Telegram

1. Abre Telegram y busca `@BotFather`
2. Envía el comando `/newbot`
3. Sigue las instrucciones:
   - Elige un nombre para tu bot (ej: "Mi Bot de Facturas")
   - Elige un username único (debe terminar en `bot`, ej: `mi_bot_facturas_bot`)
4. BotFather te dará un token que se ve así: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
5. **Guarda este token**, lo necesitarás en el siguiente paso

## 🔑 Paso 2: Configurar el Token en Variables de Entorno

Agrega el token a tus variables de entorno:

```bash
TELEGRAM_BOT_TOKEN="tu_token_aqui"
```

Si estás en Vercel:
1. Ve a Settings → Environment Variables
2. Agrega `TELEGRAM_BOT_TOKEN` con el valor que te dio BotFather
3. Guarda y redeploya

## 🔗 Paso 3: Configurar el Webhook

El webhook permite que Telegram envíe mensajes a tu aplicación. Debes configurarlo una vez que tu aplicación esté desplegada.

**Opción 1: Usando curl**
```bash
curl -X POST "https://api.telegram.org/bot<TU_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tu-dominio.vercel.app/api/telegram/webhook"}'
```

**Opción 2: Usando el navegador**
Abre esta URL en tu navegador (reemplaza `<TU_TOKEN>` y `<TU_DOMINIO>`):
```
https://api.telegram.org/bot<TU_TOKEN>/setWebhook?url=https://<TU_DOMINIO>/api/telegram/webhook
```

**Verificar que el webhook está configurado:**
```bash
curl "https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo"
```

## 👤 Paso 4: Vincular tu Cuenta de Telegram

Antes de usar el bot, debes vincular tu cuenta de Telegram con tu cuenta en la aplicación web.

### Opción A: Desde la API (para desarrolladores)

1. Obtén tu Telegram ID:
   - Busca `@userinfobot` en Telegram
   - Envía `/start` y te mostrará tu ID

2. Hace una petición POST a `/api/telegram/link` con tu sesión autenticada:
```json
{
  "telegramId": "123456789",
  "username": "tu_username",
  "firstName": "Tu Nombre",
  "lastName": "Tu Apellido"
}
```

### Opción B: Desde la Interfaz Web (cuando implementes la UI)

1. Ve a la página de configuración
2. Busca la sección "Telegram"
3. Haz clic en "Vincular con Telegram"
4. Sigue las instrucciones

## 🚀 Paso 5: Usar el Bot

Una vez vinculado, puedes usar los siguientes comandos:

### Comandos Disponibles

- `/start` - Iniciar el bot y ver los comandos disponibles
- `/crear_factura` - Crear una nueva factura
- `/crear_cotizacion` - Crear una nueva cotización
- `/clientes` - Listar todos tus clientes
- `/cancelar` - Cancelar la operación actual
- `/ayuda` - Mostrar esta ayuda

### Ejemplo de Flujo: Crear una Factura

1. Envía `/crear_factura`
2. El bot te preguntará: "¿Cuál es el nombre del cliente?"
3. Escribe el nombre del cliente o busca entre tus clientes existentes
4. Si el cliente existe, el bot te mostrará opciones similares
5. Responde con el número del cliente o escribe "nuevo" para crear uno nuevo
6. El bot te pedirá el título de la factura
7. Agrega los items en formato: `Descripción | Cantidad | Precio`
   - Ejemplo: `Desarrollo web | 10 | 50`
8. Escribe "terminar" cuando hayas agregado todos los items
9. ¡Listo! La factura se creará automáticamente

## 🔍 Verificación de Clientes

El bot **verifica automáticamente** si un cliente ya existe antes de crear uno nuevo:

- Si escribes un nombre de cliente, el bot buscará clientes similares
- Te mostrará una lista de clientes encontrados
- Puedes seleccionar uno de la lista o crear uno nuevo
- Esto evita duplicados y mantiene tu base de datos limpia

## 🛠️ Solución de Problemas

### El bot no responde

1. Verifica que `TELEGRAM_BOT_TOKEN` esté configurado correctamente
2. Verifica que el webhook esté configurado:
   ```bash
   curl "https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo"
   ```
3. Revisa los logs de tu aplicación para ver si hay errores

### "No estás vinculado a una cuenta"

1. Asegúrate de haber vinculado tu cuenta de Telegram desde la web
2. Verifica que tu Telegram ID sea correcto
3. Revisa que la vinculación se haya guardado en la base de datos

### Error al crear factura/cotización

1. Verifica que tengas una empresa asociada a tu cuenta
2. Asegúrate de que el cliente exista o se pueda crear
3. Revisa los logs del servidor para más detalles

## 📝 Notas Importantes

- El estado de las conversaciones se guarda en memoria (en producción considera usar Redis)
- Cada usuario debe vincular su cuenta de Telegram manualmente
- Los clientes se verifican automáticamente antes de crear duplicados
- El bot solo funciona con usuarios autenticados y vinculados

## 🔐 Seguridad

- El webhook valida que el usuario esté autenticado
- Solo usuarios vinculados pueden usar el bot
- Cada usuario solo puede acceder a sus propios datos
- Los datos se validan antes de crear facturas/cotizaciones

## 📚 Próximos Pasos

- [ ] Implementar UI en la web para vincular cuentas de Telegram
- [ ] Agregar más comandos (listar facturas, ver detalles, etc.)
- [ ] Implementar Redis para el estado de conversaciones
- [ ] Agregar notificaciones cuando se crean facturas desde la web
- [ ] Permitir editar facturas/cotizaciones desde Telegram



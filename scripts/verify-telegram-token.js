/**
 * Script para verificar que el token de Telegram sea válido
 * Ejecutar: node scripts/verify-telegram-token.js
 */

const https = require('https')

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN no está configurado')
  console.log('\nConfigura la variable de entorno:')
  console.log('export TELEGRAM_BOT_TOKEN="tu_token_aqui"')
  console.log('\nO pasa el token como argumento:')
  console.log('TELEGRAM_BOT_TOKEN="tu_token" node scripts/verify-telegram-token.js')
  process.exit(1)
}

console.log('🔍 Verificando token de Telegram...')
console.log('Token preview:', TELEGRAM_BOT_TOKEN.substring(0, 10) + '...\n')

// Verificar el token haciendo una llamada a la API de Telegram
const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`

https.get(url, (res) => {
  let data = ''
  
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data)
      
      if (result.ok) {
        console.log('✅ Token válido!')
        console.log('\n📋 Información del bot:')
        console.log('  Nombre:', result.result.first_name)
        console.log('  Username:', '@' + result.result.username)
        console.log('  ID:', result.result.id)
        console.log('  Puede unirse a grupos:', result.result.can_join_groups)
        console.log('  Puede leer mensajes de grupo:', result.result.can_read_all_group_messages)
        console.log('  Soporta comandos inline:', result.result.supports_inline_queries)
        console.log('\n✅ El bot está configurado correctamente!')
      } else {
        console.error('❌ Token inválido!')
        console.error('Error:', result.description)
        console.error('Error code:', result.error_code)
        console.log('\n💡 Posibles soluciones:')
        console.log('  1. Verifica que el token sea correcto')
        console.log('  2. Obtén un nuevo token de @BotFather en Telegram')
        console.log('  3. Asegúrate de que no haya espacios extra en el token')
        process.exit(1)
      }
    } catch (error) {
      console.error('❌ Error parseando respuesta:', error.message)
      console.error('Respuesta recibida:', data)
      process.exit(1)
    }
  })
}).on('error', (error) => {
  console.error('❌ Error de conexión:', error.message)
  process.exit(1)
})


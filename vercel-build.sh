#!/bin/bash
set -e

echo "🔧 Iniciando build para Vercel..."

# Limpiar cache de Prisma
echo "🧹 Limpiando cache de Prisma..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Generar Prisma Client
echo "🏗️ Generando Prisma Client..."
npx prisma generate

# Verificar que se generó
if [ ! -d "node_modules/@prisma/client" ]; then
  echo "❌ Error: Prisma Client no se generó"
  exit 1
fi

echo "✅ Prisma Client generado correctamente"

# Ejecutar build
echo "🚀 Iniciando build de Next.js..."
npm run build

echo "✅ Build completado exitosamente"





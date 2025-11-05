#!/bin/bash
# Script para build en Vercel que asegura que Prisma se genere correctamente

echo "🔧 Generando Prisma Client..."
npx prisma generate

echo "🏗️ Iniciando build de Next.js..."
npm run build





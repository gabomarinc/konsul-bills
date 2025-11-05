#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando build para Vercel...');

try {
  // Verificar que Prisma está instalado
  console.log('📦 Verificando Prisma...');
  execSync('npx prisma --version', { stdio: 'inherit' });
  
  // Generar Prisma Client
  console.log('🏗️ Generando Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Verificar que el cliente se generó
  const clientPath = path.join(__dirname, '../node_modules/@prisma/client');
  if (!fs.existsSync(clientPath)) {
    throw new Error('Prisma Client no se generó correctamente');
  }
  
  console.log('✅ Prisma Client generado correctamente');
  
  // Ejecutar build de Next.js
  console.log('🚀 Iniciando build de Next.js...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build completado exitosamente');
  
} catch (error) {
  console.error('❌ Error durante el build:', error.message);
  process.exit(1);
}





const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Vercel Build Script - Iniciando...');

try {
  // Limpiar cache de Prisma
  console.log('🧹 Limpiando cache de Prisma...');
  const prismaCache = path.join(__dirname, '../node_modules/.prisma');
  const prismaClient = path.join(__dirname, '../node_modules/@prisma/client');
  
  if (fs.existsSync(prismaCache)) {
    fs.rmSync(prismaCache, { recursive: true, force: true });
  }
  if (fs.existsSync(prismaClient)) {
    fs.rmSync(prismaClient, { recursive: true, force: true });
  }

  // Generar Prisma Client
  console.log('🏗️ Generando Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  // Verificar que se generó
  const clientPath = path.join(__dirname, '../node_modules/@prisma/client');
  if (!fs.existsSync(clientPath)) {
    throw new Error('Prisma Client no se generó correctamente');
  }

  console.log('✅ Prisma Client generado correctamente');

  // Ejecutar build de Next.js
  console.log('🚀 Iniciando build de Next.js...');
  execSync('npx next build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('✅ Build completado exitosamente');

} catch (error) {
  console.error('❌ Error durante el build:', error.message);
  process.exit(1);
}





import { PrismaClient } from "@prisma/client"

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Configuración optimizada para Vercel (connection pooling)
const prismaClientOptions = {
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  // Optimizar para serverless
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}

// Crear una instancia única del cliente Prisma
export const prisma = global.prisma ?? new PrismaClient(prismaClientOptions)

// En desarrollo, guardar la instancia globalmente para evitar múltiples conexiones
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma
}

// En producción (Vercel), asegurar que las conexiones se cierren correctamente
if (process.env.NODE_ENV === "production") {
  // Manejar cierre graceful en serverless
  process.on("beforeExit", async () => {
    await prisma.$disconnect()
  })
}

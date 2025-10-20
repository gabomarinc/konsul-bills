import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined
}

// Crear una instancia única del cliente Prisma
export const prisma = global.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
})

// En desarrollo, guardar la instancia globalmente para evitar múltiples conexiones
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma
}

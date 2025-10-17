import { prisma } from './prisma'
import { nanoid } from 'nanoid'

// Generador de IDs seguros
export function generateId(prefix: string): string {
  return `${prefix}_${nanoid(16)}`
}

// Funciones helper para operaciones comunes con Prisma
export async function findUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      Membership: {
        include: {
          Company: true
        }
      }
    }
  })
}

export async function createUser(email: string, name: string, hashedPassword: string) {
  const userId = generateId('user')
  
  await prisma.user.create({
    data: {
      id: userId,
      email,
      name,
      password: hashedPassword,
      updatedAt: new Date()
    }
  })
  
  return userId
}

export async function createCompany(name: string) {
  const companyId = generateId('company')
  
  await prisma.company.create({
    data: {
      id: companyId,
      name,
      updatedAt: new Date()
    }
  })
  
  return companyId
}

export async function createMembership(userId: string, companyId: string, role: string = 'OWNER') {
  await prisma.membership.create({
    data: {
      id: generateId('membership'),
      userId,
      companyId,
      role
    }
  })
}

export async function createCompanySettings(companyId: string) {
  await prisma.companySettings.create({
    data: {
      id: generateId('settings'),
      companyId,
      defaultCurrency: 'EUR',
      defaultTaxRate: 21,
      locale: 'es-ES',
      timezone: 'Europe/Madrid',
      quotePrefix: 'Q-',
      invoicePrefix: 'INV-',
      numberPadding: 5
    }
  })
}

export async function createSequences(companyId: string) {
  await prisma.sequence.createMany({
    data: [
      {
        id: generateId('seq'),
        companyId,
        type: 'QUOTE',
        current: 0
      },
      {
        id: generateId('seq'),
        companyId,
        type: 'INVOICE',
        current: 0
      }
    ]
  })
}

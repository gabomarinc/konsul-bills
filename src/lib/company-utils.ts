import { prisma } from "./prisma"
import { generateId } from "./db"

/**
 * Obtiene la empresa del usuario autenticado
 * Si el usuario no tiene empresa, crea una por defecto
 */
export async function getUserCompany(userId: string) {
  // Buscar la membership del usuario
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: {
      Company: {
        include: {
          CompanySettings: true
        }
      }
    },
    orderBy: { Company: { createdAt: 'asc' } } // Primera empresa creada
  })

  if (membership?.Company) {
    return membership.Company
  }

  // Si no tiene empresa, crear una por defecto
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true }
  })

  const companyName = user?.name ? `${user.name}'s Company` : "Mi Empresa"
  
  // Crear empresa con transaction
  const company = await prisma.$transaction(async (tx) => {
    // Crear empresa
    const newCompany = await tx.company.create({
      data: {
        id: generateId('company'),
        name: companyName,
        updatedAt: new Date()
      }
    })

    // Crear membership
    await tx.membership.create({
      data: {
        id: generateId('membership'),
        userId,
        companyId: newCompany.id,
        role: 'OWNER'
      }
    })

    // Crear settings
    await tx.companySettings.create({
      data: {
        id: generateId('settings'),
        companyId: newCompany.id,
        defaultCurrency: 'EUR',
        defaultTaxRate: 21,
        locale: 'es-ES',
        timezone: 'Europe/Madrid',
        quotePrefix: 'Q-',
        invoicePrefix: 'INV-',
        numberPadding: 5
      }
    })

    // Crear sequences
    await tx.sequence.createMany({
      data: [
        {
          id: generateId('seq'),
          companyId: newCompany.id,
          type: 'QUOTE',
          current: 0
        },
        {
          id: generateId('seq'),
          companyId: newCompany.id,
          type: 'INVOICE',
          current: 0
        }
      ]
    })

    return tx.company.findUnique({
      where: { id: newCompany.id },
      include: { CompanySettings: true }
    })
  })

  return company!
}

/**
 * DEPRECATED: Usar getUserCompany en su lugar
 * Esta función solo existe para compatibilidad temporal
 */
export async function ensureDefaultCompany() {
  // Buscar la empresa más reciente que tenga configuración
  const found = await prisma.company.findFirst({ 
    where: { 
      CompanySettings: { isNot: null }
    },
    include: { CompanySettings: true },
    orderBy: { createdAt: 'desc' }
  })
  
  if (found) {
    return found
  }
  
  // Crear empresa por defecto si no existe ninguna
  return prisma.company.create({
    data: {
      id: generateId("company"),
      name: "Default Company",
      updatedAt: new Date(),
      CompanySettings: { 
        create: {
          id: generateId("settings"),
          defaultCurrency: "EUR",
          defaultTaxRate: 21,
          invoicePrefix: "INV-",
          quotePrefix: "QUO-",
          numberPadding: 5
        }
      },
    },
    include: { CompanySettings: true },
  })
}









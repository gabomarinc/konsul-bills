import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing duplicate companies...')

  // Obtener todas las empresas
  const companies = await prisma.company.findMany()
  console.log('Found companies:', companies.map(c => ({ id: c.id, name: c.name })))

  if (companies.length <= 1) {
    console.log('✅ No duplicate companies found')
    return
  }

  // Usar la primera empresa como principal
  const mainCompany = companies[0]
  const duplicateCompanies = companies.slice(1)

  console.log('Main company:', mainCompany.name)
  console.log('Duplicate companies:', duplicateCompanies.map(c => c.name))

  // Mover todas las cotizaciones a la empresa principal
  for (const duplicate of duplicateCompanies) {
    console.log(`Moving quotes from ${duplicate.name} to ${mainCompany.name}...`)
    
    await prisma.quote.updateMany({
      where: { companyId: duplicate.id },
      data: { companyId: mainCompany.id }
    })

    console.log(`Moving invoices from ${duplicate.name} to ${mainCompany.name}...`)
    
    await prisma.invoice.updateMany({
      where: { companyId: duplicate.id },
      data: { companyId: mainCompany.id }
    })

    console.log(`Moving clients from ${duplicate.name} to ${mainCompany.name}...`)
    
    await prisma.client.updateMany({
      where: { companyId: duplicate.id },
      data: { companyId: mainCompany.id }
    })

    console.log(`Moving sequences from ${duplicate.name} to ${mainCompany.name}...`)
    
    // Para las secuencias, necesitamos manejar la restricción única
    const duplicateSequences = await prisma.sequence.findMany({
      where: { companyId: duplicate.id }
    })
    
    for (const seq of duplicateSequences) {
      // Intentar actualizar, si falla por duplicado, eliminar la duplicada
      try {
        await prisma.sequence.update({
          where: { id: seq.id },
          data: { companyId: mainCompany.id }
        })
      } catch (error) {
        // Si hay conflicto, eliminar la secuencia duplicada
        await prisma.sequence.delete({
          where: { id: seq.id }
        })
        console.log(`Deleted duplicate sequence: ${seq.type}`)
      }
    }

    // Eliminar configuraciones de empresa duplicadas
    await prisma.companySettings.deleteMany({
      where: { companyId: duplicate.id }
    })

    // Eliminar la empresa duplicada
    await prisma.company.delete({
      where: { id: duplicate.id }
    })

    console.log(`✅ Deleted duplicate company: ${duplicate.name}`)
  }

  // Verificar que todo esté en la empresa principal
  const finalQuotes = await prisma.quote.findMany({
    where: { companyId: mainCompany.id }
  })

  const finalInvoices = await prisma.invoice.findMany({
    where: { companyId: mainCompany.id }
  })

  const finalClients = await prisma.client.findMany({
    where: { companyId: mainCompany.id }
  })

  console.log('✅ Final state:')
  console.log(`- Company: ${mainCompany.name} (${mainCompany.id})`)
  console.log(`- Quotes: ${finalQuotes.length}`)
  console.log(`- Invoices: ${finalInvoices.length}`)
  console.log(`- Clients: ${finalClients.length}`)

  console.log('🎉 Company consolidation completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during company consolidation:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

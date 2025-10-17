import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Crear usuario de ejemplo
  const user = await prisma.user.upsert({
    where: {
      email: "user@example.com"
    },
    update: {},
    create: {
      id: "user_" + Date.now(),
      email: "user@example.com",
      name: "Example User",
      password: "hashedpassword123",
      updatedAt: new Date()
    }
  })

  console.log('✅ User created:', user.id)

  // Crear empresa de ejemplo
  const company = await prisma.company.upsert({
    where: {
      id: "company_" + Date.now()
    },
    update: {},
    create: {
      id: "company_" + Date.now(),
      name: "Default Company",
      updatedAt: new Date()
    }
  })

  console.log('✅ Company created:', company.id)

  // Crear configuración de empresa
  const companySettings = await prisma.companySettings.upsert({
    where: {
      companyId: company.id
    },
    update: {},
    create: {
      id: "settings_" + Date.now(),
      companyId: company.id,
      defaultCurrency: "EUR",
      defaultTaxRate: 21,
      quotePrefix: "Q-",
      invoicePrefix: "INV-",
      numberPadding: 5
    }
  })

  console.log('✅ Company settings created:', companySettings.id)

  // Crear membresía del usuario en la empresa
  const membership = await prisma.membership.upsert({
    where: {
      id: "membership_" + Date.now()
    },
    update: {},
    create: {
      id: "membership_" + Date.now(),
      userId: user.id,
      companyId: company.id,
      role: "OWNER"
    }
  })

  console.log('✅ Membership created:', membership.id)

  // Crear secuencias para quotes e invoices
  const quoteSequence = await prisma.sequence.upsert({
    where: {
      companyId_type: { companyId: company.id, type: "QUOTE" }
    },
    update: {},
    create: {
      id: "seq_quote_" + Date.now(),
      companyId: company.id,
      type: "QUOTE",
      current: 0
    }
  })

  const invoiceSequence = await prisma.sequence.upsert({
    where: {
      companyId_type: { companyId: company.id, type: "INVOICE" }
    },
    update: {},
    create: {
      id: "seq_invoice_" + Date.now(),
      companyId: company.id,
      type: "INVOICE",
      current: 0
    }
  })

  console.log('✅ Sequences created:', { quote: quoteSequence.id, invoice: invoiceSequence.id })

  // Crear cliente de ejemplo
  const client = await prisma.client.upsert({
    where: {
      companyId_name: { companyId: company.id, name: "Example Client" }
    },
    update: {},
    create: {
      id: "client_" + Date.now(),
      companyId: company.id,
      name: "Example Client",
      email: "client@example.com",
      updatedAt: new Date()
    }
  })

  console.log('✅ Client created:', client.id)

  // Crear quote de ejemplo
  const quote = await prisma.quote.upsert({
    where: {
      id: "Q-00001"
    },
    update: {},
    create: {
      id: "Q-00001",
      companyId: company.id,
      clientId: client.id,
      title: "Example Quote",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: "EUR",
      tax: 21,
      status: "DRAFT",
      subtotal: 1000,
      taxAmount: 210,
      total: 1210,
      updatedAt: new Date()
    }
  })

  console.log('✅ Quote created:', quote.id)

  // Crear item del quote
  const quoteItem = await prisma.quoteItem.upsert({
    where: {
      id: "item_" + Date.now()
    },
    update: {},
    create: {
      id: "item_" + Date.now(),
      quoteId: quote.id,
      description: "Example Service",
      qty: 1,
      price: 1000
    }
  })

  console.log('✅ Quote item created:', quoteItem.id)

  // Crear invoice de ejemplo
  const invoice = await prisma.invoice.upsert({
    where: {
      id: "INV-00001"
    },
    update: {},
    create: {
      id: "INV-00001",
      companyId: company.id,
      clientId: client.id,
      title: "Example Invoice",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: "EUR",
      tax: 21,
      status: "DRAFT",
      subtotal: 1000,
      taxAmount: 210,
      total: 1210,
      updatedAt: new Date()
    }
  })

  console.log('✅ Invoice created:', invoice.id)

  // Crear item del invoice
  const invoiceItem = await prisma.invoiceItem.upsert({
    where: {
      id: "inv_item_" + Date.now()
    },
    update: {},
    create: {
      id: "inv_item_" + Date.now(),
      invoiceId: invoice.id,
      description: "Example Service",
      qty: 1,
      price: 1000
    }
  })

  console.log('✅ Invoice item created:', invoiceItem.id)

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

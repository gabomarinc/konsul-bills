import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  ensureAccessToken,
  extractEmailText,
  getHeader,
  getMessage,
  listRecentMessages
} from "@/lib/gmail-client"
import { extractQuoteFromEmail } from "@/lib/gemini"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const expectedToken = process.env.CRON_SECRET

  if (!expectedToken) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 500 })
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const integrations = await prisma.gmailIntegration.findMany({
    where: { isActive: true }
  })

  const summary = {
    processedUsers: 0,
    messagesFound: 0,
    pendingCreated: 0,
    errors: [] as string[]
  }

  for (const integration of integrations) {
    try {
      const accessToken = await ensureAccessToken(integration)
      const messages = await listRecentMessages(accessToken)
      summary.processedUsers += 1

      for (const message of messages) {
        summary.messagesFound += 1

        // Evitar reprocesar correos
        const alreadyProcessed = await prisma.processedEmail.findUnique({
          where: {
            gmailIntegrationId_emailId: {
              gmailIntegrationId: integration.id,
              emailId: message.id
            }
          }
        })
        if (alreadyProcessed) continue

        const fullMessage = await getMessage(accessToken, message.id)
        const emailBody = extractEmailText(fullMessage.payload)
        const subject = getHeader(fullMessage.payload, "Subject") || fullMessage.snippet
        const from = getHeader(fullMessage.payload, "From") || "desconocido"
        const internalDate = fullMessage.internalDate
          ? new Date(Number(fullMessage.internalDate))
          : new Date()

        const parsed = await extractQuoteFromEmail(`${subject}\n\n${emailBody}`)

        if (!parsed) {
          await prisma.processedEmail.create({
            data: {
              id: `processed_${integration.id}_${message.id}`,
              gmailIntegrationId: integration.id,
              emailId: message.id
            }
          })
          continue
        }

        const pendingId = `pending_${integration.id}_${message.id}`
        await prisma.pendingQuote.create({
          data: {
            id: pendingId,
            userId: integration.userId,
            gmailIntegrationId: integration.id,
            emailId: message.id,
            emailSubject: subject,
            emailFrom: from,
            emailDate: internalDate,
            emailBody: emailBody.slice(0, 5000),
            clientName: parsed.clientName,
            clientEmail: parsed.clientEmail,
            title: parsed.title,
            description: parsed.description,
            amount: parsed.amount ?? null,
            currency: parsed.currency ?? "EUR",
            tax: parsed.tax ?? null,
            issueDate: parsed.issueDate ?? null,
            dueDate: parsed.dueDate ?? null,
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })

        await prisma.processedEmail.create({
          data: {
            id: `processed_${integration.id}_${message.id}`,
            gmailIntegrationId: integration.id,
            emailId: message.id
          }
        })

        summary.pendingCreated += 1
      }

      await prisma.gmailIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date(), updatedAt: new Date() }
      })
    } catch (error) {
      console.error("Error sincronizando Gmail:", error)
      summary.errors.push(
        `User ${integration.userId}: ${(error as Error).message || "Unknown error"}`
      )
    }
  }

  return NextResponse.json(summary)
}


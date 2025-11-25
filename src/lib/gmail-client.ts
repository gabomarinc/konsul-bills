import { decryptToken, encryptToken, refreshAccessToken } from "./gmail-oauth"
import { prisma } from "./prisma"

export type GmailIntegrationRecord = Awaited<
  ReturnType<typeof prisma.gmailIntegration.findFirst>
>

const KEYWORDS = [
  "cotizacion",
  "cotización",
  "presupuesto",
  "estimate",
  "quote",
  "quotation"
]

export async function ensureAccessToken(integration: GmailIntegrationRecord) {
  if (!integration) throw new Error("Integration not found")
  const now = new Date()
  const expiresSoon =
    !integration.expiresAt || integration.expiresAt.getTime() - now.getTime() < 60 * 1000

  if (!expiresSoon) {
    return decryptToken(integration.accessToken)
  }

  const refreshed = await refreshAccessToken(decryptToken(integration.refreshToken))

  if (!refreshed.access_token) {
    throw new Error("No access token received on refresh")
  }

  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + (refreshed.expires_in || 3600))

  await prisma.gmailIntegration.update({
    where: { id: integration.id },
    data: {
      accessToken: encryptToken(refreshed.access_token),
      expiresAt,
      updatedAt: new Date()
    }
  })

  return refreshed.access_token as string
}

export async function listRecentMessages(accessToken: string, daysBack = 5) {
  const after = new Date()
  after.setDate(after.getDate() - daysBack)
  const afterTimestamp = Math.floor(after.getTime() / 1000)

  const query = `after:${afterTimestamp} (${KEYWORDS.join(" OR ")})`

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=30`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  if (response.status === 401) {
    throw new Error("unauthorized")
  }

  if (!response.ok) {
    throw new Error(`Gmail API error: ${await response.text()}`)
  }

  const data = await response.json()
  return (data.messages || []) as Array<{ id: string }>
}

export async function getMessage(accessToken: string, messageId: string) {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch message ${messageId}: ${await response.text()}`)
  }

  return (await response.json()) as GmailMessage
}

export type GmailMessage = {
  id: string
  snippet: string
  payload: GmailPayload
  internalDate?: string
}

export type GmailPayload = {
  mimeType: string
  filename?: string
  body?: { data?: string }
  parts?: GmailPayload[]
  headers?: { name: string; value: string }[]
}

export function extractEmailText(payload: GmailPayload): string {
  if (!payload) return ""
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64(payload.body.data)
  }
  if (payload.parts && payload.parts.length > 0) {
    for (const part of payload.parts) {
      const text = extractEmailText(part)
      if (text) return text
    }
  }
  if (payload.body?.data) {
    return decodeBase64(payload.body.data)
  }
  return ""
}

export function getHeader(payload: GmailPayload, name: string) {
  return payload.headers?.find(
    (header) => header.name.toLowerCase() === name.toLowerCase()
  )?.value
}

function decodeBase64(data: string) {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
}


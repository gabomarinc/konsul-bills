import { generateId } from "./db"

/**
 * Utilidades para OAuth de Gmail
 */

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile"
].join(" ")

function resolveRedirectUri() {
  const primary = process.env.GOOGLE_REDIRECT_URI_PRIMARY
  const secondary = process.env.GOOGLE_REDIRECT_URI
  if (primary) return primary
  if (secondary) return secondary
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/oauth/callback`
  }
  return "http://localhost:3000/api/gmail/oauth/callback"
}

export function getGmailOAuthUrl(state?: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = resolveRedirectUri()
  
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID no está configurado')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state })
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = resolveRedirectUri()

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no están configurados')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error intercambiando código: ${error}`)
  }

  return await response.json()
}

export async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no están configurados')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error refrescando token: ${error}`)
  }

  return await response.json()
}

/**
 * Encriptación simple de tokens (en producción usar algo más robusto)
 * Por ahora usamos base64, pero deberías usar crypto para encriptar realmente
 */
export function encryptToken(token: string): string {
  return Buffer.from(token).toString("base64")
}

export function decryptToken(encryptedToken: string): string {
  return Buffer.from(encryptedToken, "base64").toString("utf-8")
}

export { resolveRedirectUri as getRedirectUri }


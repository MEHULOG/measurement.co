import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'

const http = httpRouter()

/**
 * Polar webhook endpoint.
 *
 * Polar follows the Standard Webhooks spec — see
 * https://github.com/standard-webhooks/standard-webhooks
 *
 * Configure in the Polar dashboard:
 *   URL:    https://<your-convex-deployment>.convex.site/polar/webhook
 *   Events: subscription.created, subscription.updated, subscription.active,
 *           subscription.canceled, subscription.revoked, subscription.uncanceled
 *
 * Then on Convex:
 *   npx convex env set POLAR_WEBHOOK_SECRET whsec_xxx
 */
http.route({
  path: '/polar/webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.POLAR_WEBHOOK_SECRET
    if (!secret) {
      console.error('POLAR_WEBHOOK_SECRET not set — rejecting webhook')
      return new Response('Webhook not configured', { status: 503 })
    }

    const webhookId = request.headers.get('webhook-id')
    const webhookTs = request.headers.get('webhook-timestamp')
    const webhookSig = request.headers.get('webhook-signature')
    if (!webhookId || !webhookTs || !webhookSig) {
      return new Response('Missing webhook headers', { status: 400 })
    }

    // Standard Webhooks: tolerate ±5 minutes of clock skew
    const now = Math.floor(Date.now() / 1000)
    const ts = parseInt(webhookTs, 10)
    if (!Number.isFinite(ts) || Math.abs(now - ts) > 300) {
      return new Response('Stale or invalid timestamp', { status: 400 })
    }

    const rawBody = await request.text()
    const ok = await verifyStandardWebhook(
      secret,
      webhookId,
      webhookTs,
      rawBody,
      webhookSig,
    )
    if (!ok) {
      return new Response('Invalid signature', { status: 401 })
    }

    let event: { type?: string; data?: unknown }
    try {
      event = JSON.parse(rawBody)
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }

    const type = event.type ?? ''
    if (
      type === 'subscription.created' ||
      type === 'subscription.updated' ||
      type === 'subscription.active' ||
      type === 'subscription.canceled' ||
      type === 'subscription.revoked' ||
      type === 'subscription.uncanceled'
    ) {
      await ctx.runMutation(internal.billing.applyPolarEvent, {
        type,
        payload: event,
      })
    } else {
      console.log('Polar webhook: ignoring event', type)
    }

    return new Response('ok', { status: 200 })
  }),
})

export default http

// ─────────────────────────────────────────────────────────────────────
// Standard Webhooks signature verification (HMAC-SHA256, base64)
// Spec: https://github.com/standard-webhooks/standard-webhooks
// ─────────────────────────────────────────────────────────────────────

async function verifyStandardWebhook(
  secret: string,
  id: string,
  timestamp: string,
  body: string,
  signatureHeader: string,
): Promise<boolean> {
  // Polar secret is base64-encoded, prefixed with `whsec_`
  const base64Key = secret.startsWith('whsec_') ? secret.slice(7) : secret
  const keyBytes = base64ToBytes(base64Key)

  const signedContent = `${id}.${timestamp}.${body}`
  // Copy into a tight ArrayBuffer to satisfy lib.dom's BufferSource type
  const keyBuf = keyBytes.buffer.slice(
    keyBytes.byteOffset,
    keyBytes.byteOffset + keyBytes.byteLength,
  ) as ArrayBuffer
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuf,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const msgBytes = new TextEncoder().encode(signedContent)
  const msgBuf = msgBytes.buffer.slice(
    msgBytes.byteOffset,
    msgBytes.byteOffset + msgBytes.byteLength,
  ) as ArrayBuffer
  const sigBytes = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, msgBuf),
  )
  const expected = bytesToBase64(sigBytes)

  // Header is space-delimited list like "v1,<sig> v1,<sig2>"
  for (const entry of signatureHeader.split(' ')) {
    const [version, sig] = entry.split(',')
    if (version !== 'v1' || !sig) continue
    if (timingSafeEqual(sig, expected)) return true
  }
  return false
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

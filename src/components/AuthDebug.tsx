import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useConvexAuth } from 'convex/react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, XCircle, AlertCircle, Copy } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Diagnoses the Clerk → Convex auth handshake. Mount this temporarily on a
 * page (e.g. WelcomePage) when "Not authenticated" errors show up; it prints
 * the exact step that's failing and what to do about it.
 *
 * Remove it once everything is green.
 */
export function AuthDebug() {
  const { isSignedIn, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const [token, setToken] = useState<string | null | 'pending' | 'error'>(
    'pending',
  )
  const [tokenError, setTokenError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchToken() {
      if (!isSignedIn) {
        setToken(null)
        return
      }
      try {
        const t = await getToken({ template: 'convex' })
        if (!cancelled) setToken(t ?? null)
      } catch (e: any) {
        if (!cancelled) {
          setToken('error')
          setTokenError(e?.message ?? String(e))
        }
      }
    }
    fetchToken()
    return () => {
      cancelled = true
    }
  }, [isSignedIn, getToken])

  const convexUrl = import.meta.env.VITE_CONVEX_URL
  const claims =
    token && typeof token === 'string' ? decodeClaims(token) : null
  const issuer = claims?.iss ?? null
  const audience = claims?.aud ?? null

  return (
    <Card className="border-amber-400/40 bg-amber-50/40 dark:bg-amber-950/20">
      <CardContent className="space-y-3 p-4 text-sm">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Auth diagnostic (temporary)
        </div>

        <Row
          ok={isLoaded && !!isSignedIn}
          label="Clerk session"
          detail={
            !isLoaded
              ? 'Loading Clerk SDK…'
              : isSignedIn
                ? 'Signed in via Clerk ✓'
                : 'Not signed in — open /auth and sign in.'
          }
        />

        <Row
          ok={token !== null && token !== 'error' && token !== 'pending'}
          label='Clerk JWT (template: "convex")'
          detail={
            token === 'pending'
              ? 'Requesting token…'
              : token === 'error'
                ? `Error: ${tokenError}`
                : token === null
                  ? 'Clerk returned null. The "convex" JWT template does not exist in your Clerk app. Go to Clerk dashboard → Configure → JWT Templates → New template → pick the "Convex" preset, save it with the name "convex".'
                  : `Token issued ✓ (${token.length} chars)`
          }
        />

        {typeof token === 'string' && token && (
          <>
            <Row
              ok={!!issuer}
              label="JWT issuer (iss claim)"
              detail={
                issuer
                  ? issuer
                  : 'Could not decode the JWT payload to read the issuer.'
              }
              action={
                issuer && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(issuer)
                      toast.success(
                        'Issuer copied. Run: npx convex env set CLERK_JWT_ISSUER_DOMAIN <paste>',
                      )
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                )
              }
            />
            <Row
              ok={audience === 'convex'}
              label='JWT audience (aud claim) — must be "convex"'
              detail={
                audience
                  ? `aud = "${audience}" ${audience === 'convex' ? '✓' : '— mismatch with auth.config.ts'}`
                  : 'Missing aud claim. Edit the Clerk JWT template and ensure Claims contains: { "aud": "convex" }'
              }
            />
          </>
        )}

        <Row
          ok={isAuthenticated}
          label="Convex sees the token"
          detail={
            isLoading
              ? 'Verifying with Convex…'
              : isAuthenticated
                ? 'Convex accepted the token ✓'
                : "Convex rejected the token. Your Convex deployment's CLERK_JWT_ISSUER_DOMAIN doesn't match the JWT issuer above. Run: npx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer-from-row-above>, then sign out and back in."
          }
        />

        <div className="border-t border-amber-400/30 pt-2 text-xs text-muted-foreground">
          Convex URL: <code>{convexUrl}</code>
        </div>
      </CardContent>
    </Card>
  )
}

function Row({
  ok,
  label,
  detail,
  action,
}: {
  ok: boolean
  label: string
  detail: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      )}
      <div className="min-w-0 flex-1">
        <div className="font-medium">{label}</div>
        <div className="break-words text-xs text-muted-foreground">
          {detail}
        </div>
      </div>
      {action}
    </div>
  )
}

function decodeClaims(
  jwt: string,
): { iss?: string; aud?: string; sub?: string } | null {
  try {
    const [, payload] = jwt.split('.')
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

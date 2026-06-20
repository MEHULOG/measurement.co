import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import App from './App'
import { ThemeProvider } from './lib/theme'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ConfigError } from './components/ConfigError'
import './index.css'

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const convexUrl = import.meta.env.VITE_CONVEX_URL

// Decode the host the publishable key points at. Clerk's publishable keys are
// `pk_(live|test)_<base64(host$)>`. If the host doesn't resolve to a real Clerk
// frontend, the SDK silently fails to mount → blank screen. We detect that here
// and show a friendly setup screen instead.
function decodeClerkHost(key: string | undefined): string | null {
  if (!key) return null
  const m = key.match(/^pk_(?:live|test)_(.+)$/)
  if (!m) return null
  try {
    return atob(m[1]).replace(/\$$/, '')
  } catch {
    return null
  }
}

const clerkHost = decodeClerkHost(clerkKey)
const placeholderClerkHosts = new Set([
  'clerk.skribe.demo',
  'your-clerk-frontend.clerk.accounts.dev',
])

const root = ReactDOM.createRoot(document.getElementById('root')!)

if (!clerkKey || !clerkHost) {
  root.render(
    <ConfigError
      title="Clerk publishable key is missing"
      description="The app needs VITE_CLERK_PUBLISHABLE_KEY in .env.local to mount the auth provider."
      steps={[
        'Open https://dashboard.clerk.com and select your application.',
        'Go to API Keys and copy the Publishable key (pk_test_… or pk_live_…).',
        'Paste it into .env.local as VITE_CLERK_PUBLISHABLE_KEY=…',
        'Restart `npm run dev` so Vite picks up the new env var.',
      ]}
    />,
  )
} else if (placeholderClerkHosts.has(clerkHost)) {
  root.render(
    <ConfigError
      title="Clerk key is a placeholder"
      description={`Your VITE_CLERK_PUBLISHABLE_KEY points at "${clerkHost}", which isn't a real Clerk tenant. The Clerk widget can't load, which is why you're seeing a blank screen.`}
      hint="Create your own Clerk app and use its publishable key — the demo placeholder won't work."
      steps={[
        'Sign up / sign in at https://dashboard.clerk.com.',
        'Create a new application (Email + Google is fine).',
        'Copy the Publishable key from "API Keys" and put it in .env.local.',
        'In Clerk → JWT Templates, add the "Convex" template, copy the Issuer URL.',
        'Run: npx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer-url>',
        'Restart `npm run dev`.',
      ]}
    />,
  )
} else if (!convexUrl) {
  root.render(
    <ConfigError
      title="Convex URL is missing"
      description="Run `npx convex dev` once to provision a deployment — it will populate VITE_CONVEX_URL in .env.local automatically."
      steps={['Run `npx convex dev` in another terminal.', 'Restart Vite.']}
    />,
  )
} else {
  const convex = new ConvexReactClient(convexUrl)
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ClerkProvider
          publishableKey={clerkKey}
          afterSignOutUrl="/"
          signInUrl="/auth?mode=sign-in"
          signUpUrl="/auth?mode=sign-up"
        >
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <ThemeProvider>
              <BrowserRouter>
                <App />
                <Toaster richColors closeButton position="top-right" />
              </BrowserRouter>
            </ThemeProvider>
          </ConvexProviderWithClerk>
        </ClerkProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  )
}

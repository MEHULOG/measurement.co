import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import LandingPage from '@/pages/LandingPage'
import AuthPage from '@/pages/AuthPage'
import WelcomePage from '@/pages/WelcomePage'
import DashboardPage from '@/pages/DashboardPage'
import OrdersPage from '@/pages/OrdersPage'
import BillingPage from '@/pages/BillingPage'
import TermsPage from '@/pages/TermsPage'
import PrivacyPage from '@/pages/PrivacyPage'
import MeasurementsPage from '@/pages/MeasurementsPage'
import ReportsPage from '@/pages/ReportsPage'
import UsersPage from '@/pages/UsersPage'
import ProfilePage from '@/pages/ProfilePage'
import DashboardLayout from '@/layouts/DashboardLayout'
import { UserBootstrap } from '@/components/UserBootstrap'
import { RequireAdmin } from '@/components/RequireAdmin'
import { RequireActiveSubscription } from '@/components/RequireActiveSubscription'

function ProtectedShell() {
  return (
    <>
      <SignedIn>
        <UserBootstrap />
        <RequireActiveSubscription>
          <DashboardLayout />
        </RequireActiveSubscription>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Unified auth page (Sign in + Sign up tabs) */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Legal pages — public */}
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Post-login welcome (create / import an app) */}
      <Route
        path="/welcome"
        element={
          <>
            <SignedIn>
              <WelcomePage />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />

      {/* Legacy routes redirect into the unified page */}
      <Route
        path="/sign-in/*"
        element={<Navigate to="/auth?mode=sign-in" replace />}
      />
      <Route
        path="/sign-up/*"
        element={<Navigate to="/auth?mode=sign-up" replace />}
      />

      <Route path="/app" element={<ProtectedShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="measurements" element={<MeasurementsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route
          path="users"
          element={
            <RequireAdmin>
              <UsersPage />
            </RequireAdmin>
          }
        />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="billing" element={<BillingPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

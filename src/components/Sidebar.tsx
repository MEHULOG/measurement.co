import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Ruler,
  FileBarChart,
  Users,
  UserCircle,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const nav = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/measurements', label: 'Measurements', icon: Ruler },
  { to: '/app/reports', label: 'Reports', icon: FileBarChart },
  { to: '/app/users', label: 'Users', icon: Users, adminOnly: true },
  { to: '/app/profile', label: 'Profile', icon: UserCircle },
]

interface SidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { user } = useCurrentUser()
  const isAdmin = user?.role === 'admin'

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Ruler className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Measure</div>
            <div className="text-xs text-muted-foreground">Management</div>
          </div>
        </div>
        <button
          className="rounded-md p-2 hover:bg-accent lg:hidden"
          onClick={onCloseMobile}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav
          .filter((item) => !item.adminOnly || isAdmin)
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
      </nav>
      <div className="border-t p-4 text-xs text-muted-foreground">
        v1.0.0 · Convex + Clerk
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onCloseMobile}
          />
          <div className="absolute left-0 top-0 h-full w-64 border-r bg-card">
            {content}
          </div>
        </div>
      )}
    </>
  )
}

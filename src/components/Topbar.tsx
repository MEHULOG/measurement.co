import { Menu } from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Badge } from '@/components/ui/Badge'

interface TopbarProps {
  onOpenMobileMenu: () => void
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const { user } = useCurrentUser()
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMobileMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <div className="text-sm font-semibold leading-tight">
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {user && (
          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
            {user.role}
          </Badge>
        )}
        <ThemeToggle />
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  )
}

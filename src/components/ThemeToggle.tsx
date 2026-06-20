import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { Button } from '@/components/ui/Button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      title={`Theme: ${theme} (click for ${next})`}
    >
      <Icon className="h-5 w-5" />
    </Button>
  )
}

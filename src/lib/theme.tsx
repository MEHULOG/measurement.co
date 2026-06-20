import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

type Theme = 'light' | 'dark' | 'system'

const ThemeContext = createContext<{
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (t: Theme) => void
} | null>(null)

function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  return dark ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) ?? 'system',
  )
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    applyTheme((localStorage.getItem('theme') as Theme) ?? 'system'),
  )

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem('theme', t)
    setThemeState(t)
    setResolvedTheme(applyTheme(t))
  }, [])

  useEffect(() => {
    if (theme !== 'system') return
    const m = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolvedTheme(applyTheme('system'))
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [theme])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

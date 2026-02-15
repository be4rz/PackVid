import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** User's stored preference (may be 'system') */
export type Theme = 'light' | 'dark' | 'system'

/** Actual color scheme applied to the document */
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  /** User's preference — may be 'system' */
  theme: Theme
  /** Actual active theme after resolving system preference */
  resolvedTheme: ResolvedTheme
  /** Update the stored preference */
  setTheme: (theme: Theme) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'packvid-theme'
const DEFAULT_THEME: Theme = 'dark'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read system color-scheme preference */
function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Read persisted theme from localStorage, fall back to default */
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return DEFAULT_THEME
}

/** Resolve 'system' to an actual theme */
function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemPreference() : theme
}

/** Apply or remove the `dark` class on <html> */
function applyThemeToDOM(resolved: ResolvedTheme) {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(getStoredTheme()))

  // Persist and apply whenever `theme` changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme)
    const resolved = resolveTheme(theme)
    setResolvedTheme(resolved)
    applyThemeToDOM(resolved)
  }, [theme])

  // Listen for OS color-scheme changes (only relevant when mode is 'system')
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    const handler = () => {
      if (theme === 'system') {
        const resolved = getSystemPreference()
        setResolvedTheme(resolved)
        applyThemeToDOM(resolved)
      }
    }

    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the current theme state.
 *
 * @returns `{ theme, resolvedTheme, setTheme }`
 *  - `theme` — user's preference ('light' | 'dark' | 'system')
 *  - `resolvedTheme` — actual applied theme ('light' | 'dark')
 *  - `setTheme` — update and persist the preference
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>')
  }
  return ctx
}

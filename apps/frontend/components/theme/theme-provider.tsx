'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { Theme } from '@/lib/theme-storage'
import { readStoredTheme, storeTheme } from '@/lib/theme-storage'

type ThemeContextValue = {
  theme: Theme
  setTheme: (nextTheme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const DEFAULT_THEME: Theme = 'light'

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const applyTheme = (theme: Theme): void => {
  if (typeof document === 'undefined') {
    return
  }

  const rootElement = document.documentElement
  rootElement.classList.toggle('dark', theme === 'dark')
  rootElement.dataset.theme = theme
}

export const ThemeProvider = ({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === 'undefined') {
      return DEFAULT_THEME
    }

    return document.documentElement.classList.contains('dark') ? 'dark' : DEFAULT_THEME
  })

  useEffect(() => {
    const storedTheme = readStoredTheme()
    const resolvedTheme = storedTheme ?? getSystemTheme()

    setThemeState(resolvedTheme)
    applyTheme(resolvedTheme)
  }, [])

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(() => {
      applyTheme(nextTheme)
      storeTheme(nextTheme)
      return nextTheme
    })
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
      applyTheme(nextTheme)
      storeTheme(nextTheme)
      return nextTheme
    })
  }, [])

  const contextValue = useMemo(
    (): ThemeContextValue => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme]
  )

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'task-manager-theme'

const canUseDOM = (): boolean => typeof window !== 'undefined'

export const readStoredTheme = (): Theme | null => {
  if (!canUseDOM()) return null

  try {
    const storedValue = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (storedValue === 'light' || storedValue === 'dark') {
      return storedValue
    }
  } catch (error) {
    console.warn('[theme] Failed to read stored theme', error)
  }

  return null
}

export const storeTheme = (theme: Theme): void => {
  if (!canUseDOM()) return

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    console.warn('[theme] Failed to persist theme', error)
  }
}

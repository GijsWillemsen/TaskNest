import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from './useAuth'
import { ThemeContext, THEMES, normalizeTheme } from './theme-context'

export function ThemeProvider({ children }) {
  const { profile, user } = useAuth()

  const [localTheme, setLocalTheme] = useState(() => {
    return normalizeTheme(localStorage.getItem('tasknest_theme'))
  })

  // Normalize profile preference if present, otherwise local
  const activeTheme = normalizeTheme(profile?.theme_preference || localTheme)
  const userId = user?.id

  // Synchronize document data-theme attribute and mobile OS status bar color
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme)
    localStorage.setItem('tasknest_theme', activeTheme)

    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      const themeColors = {
        candy: '#ffffff',
        playful: '#ffffff',
        arcade: '#131b2e',
        sunset: '#261642',
        forest: '#142820',
        obsidian: '#141416',
        modern: '#141416',
      }
      metaThemeColor.setAttribute('content', themeColors[activeTheme] || '#141416')
    }
  }, [activeTheme])

  const setTheme = useCallback(
    async (newTheme) => {
      const validTheme = normalizeTheme(newTheme)
      setLocalTheme(validTheme)
      document.documentElement.setAttribute('data-theme', validTheme)
      localStorage.setItem('tasknest_theme', validTheme)

      if (userId) {
        try {
          await supabase
            .from('profiles')
            .update({ theme_preference: validTheme })
            .eq('id', userId)
        } catch (err) {
          console.error('Failed to persist theme preference:', err)
        }
      }
    },
    [userId]
  )

  const toggleTheme = useCallback(() => {
    const currentIndex = THEMES.findIndex((t) => t.id === activeTheme)
    const nextIndex = (currentIndex + 1) % THEMES.length
    setTheme(THEMES[nextIndex].id)
  }, [activeTheme, setTheme])

  const value = useMemo(
    () => ({
      theme: activeTheme,
      setTheme,
      toggleTheme,
    }),
    [activeTheme, setTheme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from './useAuth'
import { ThemeContext } from './theme-context'

export function ThemeProvider({ children }) {
  const { profile, user } = useAuth()
  
  const [localTheme, setLocalTheme] = useState(() => {
    return localStorage.getItem('tasknest_theme') || 'playful'
  })

  // Derive active theme from profile preference or local override
  const activeTheme = profile?.theme_preference || localTheme
  const userId = user?.id

  // Synchronize document attribute with active theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme)
    localStorage.setItem('tasknest_theme', activeTheme)
  }, [activeTheme])

  const setTheme = useCallback(async (newTheme) => {
    if (newTheme !== 'playful' && newTheme !== 'modern') return
    setLocalTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('tasknest_theme', newTheme)

    if (userId) {
      try {
        await supabase
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('id', userId)
      } catch (err) {
        console.error('Failed to persist theme preference:', err)
      }
    }
  }, [userId])

  const toggleTheme = useCallback(() => {
    setTheme(activeTheme === 'playful' ? 'modern' : 'playful')
  }, [activeTheme, setTheme])

  const value = useMemo(() => ({
    theme: activeTheme,
    setTheme,
    toggleTheme,
  }), [activeTheme, setTheme, toggleTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

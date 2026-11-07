import { useState, useCallback, useMemo, useEffect } from 'react'
import { LanguageContext } from './language-context'
import { TRANSLATIONS } from '../i18n/translations'

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('tasknest_language') || 'nl'
  })

  useEffect(() => {
    localStorage.setItem('tasknest_language', lang)
    document.documentElement.lang = lang
  }, [lang])

  const setLanguage = useCallback((newLang) => {
    const valid = newLang === 'en' ? 'en' : 'nl'
    setLangState(valid)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLangState((prev) => (prev === 'nl' ? 'en' : 'nl'))
  }, [])

  /**
   * Helper function to translate keys, e.g. t('tasks.tab_open') or t('tasks.items_count', { count: 3 })
   */
  const t = useCallback(
    (path, params = {}) => {
      const keys = path.split('.')
      let current = TRANSLATIONS[lang]

      for (const k of keys) {
        if (current && current[k] !== undefined) {
          current = current[k]
        } else {
          // Fallback to Dutch if current language missing key
          let fallback = TRANSLATIONS.nl
          for (const fbK of keys) {
            if (fallback && fallback[fbK] !== undefined) {
              fallback = fallback[fbK]
            } else {
              return path
            }
          }
          current = fallback
          break
        }
      }

      if (typeof current === 'string') {
        let result = current
        for (const [pKey, pVal] of Object.entries(params)) {
          result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), pVal)
        }
        return result
      }

      return path
    },
    [lang]
  )

  const value = useMemo(
    () => ({
      lang,
      isDutch: lang === 'nl',
      setLanguage,
      toggleLanguage,
      t,
    }),
    [lang, setLanguage, toggleLanguage, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}


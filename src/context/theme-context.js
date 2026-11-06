import { createContext } from 'react'

export const ThemeContext = createContext({
  theme: 'playful',
  setTheme: () => {},
  toggleTheme: () => {},
})

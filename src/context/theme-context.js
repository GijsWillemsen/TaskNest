import { createContext } from 'react'

export const THEMES = [
  {
    id: 'candy',
    name: 'Candy Pop 🍬',
    description: 'Bubbly sky-blue, 3D candy purple borders & yellow stars',
    vibe: 'Playful & Joyful',
    category: 'Childish',
    bgPreview: '#e0f2fe',
    accentPreview: '#7c3aed',
  },
  {
    id: 'arcade',
    name: 'Arcade Neon 👾',
    description: 'Midnight cyberpunk, neon cyan glowing borders & mint buttons',
    vibe: 'Retro Gamer',
    category: 'Gamer',
    bgPreview: '#0b0f19',
    accentPreview: '#00f2fe',
  },
  {
    id: 'sunset',
    name: 'Sunset Glow 🌅',
    description: 'Warm dusk violet, rich plum cards & coral rose accents',
    vibe: 'Warm & Vibrant',
    category: 'Creative',
    bgPreview: '#1a102f',
    accentPreview: '#f43f5e',
  },
  {
    id: 'forest',
    name: 'Nordic Forest 🌲',
    description: 'Calming deep pine, moss green surfaces & warm birch gold',
    vibe: 'Serene & Natural',
    category: 'Relaxed',
    bgPreview: '#0c1914',
    accentPreview: '#10b981',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Luxe 🖤',
    description: 'Matte obsidian black, slate cards & crisp titanium white',
    vibe: 'Sleek Minimalist',
    category: 'Mature',
    bgPreview: '#09090b',
    accentPreview: '#ffffff',
  },
]

export function normalizeTheme(rawTheme) {
  if (rawTheme === 'playful') return 'candy'
  if (rawTheme === 'modern') return 'obsidian'
  if (THEMES.some((t) => t.id === rawTheme)) return rawTheme
  return 'candy'
}

export const ThemeContext = createContext({
  theme: 'candy',
  setTheme: () => {},
  toggleTheme: () => {},
})

import { createContext } from 'react'

export const THEMES = [
  // 4 LIGHT THEMES
  {
    id: 'candy',
    name: 'Candy Pop 🍬',
    mode: 'light',
    description: 'Luchtig hemelsblauw, 3D paarse randen & vrolijke gele sterren',
    descriptionEn: 'Bubbly sky-blue, 3D candy purple borders & yellow stars',
    vibe: 'Speels & Vrolijk',
    category: 'Licht',
    bgPreview: '#e0f2fe',
    accentPreview: '#7c3aed',
  },
  {
    id: 'blossom',
    name: 'Pastel Blossom 🌸',
    mode: 'light',
    description: 'Zachte lavendel & rozenbloesem met speelse framboosroze accenten',
    descriptionEn: 'Soft lavender & rose blossom with playful raspberry accents',
    vibe: 'Zacht & Dromerig',
    category: 'Licht',
    bgPreview: '#fdf2f8',
    accentPreview: '#ec4899',
  },
  {
    id: 'citrus',
    name: 'Sunny Citrus 🍋',
    mode: 'light',
    description: 'Zonnig warm vanillegeel met amber goud & vrolijke oranje knoppen',
    descriptionEn: 'Sunny vanilla cream with warm amber gold & bright citrus buttons',
    vibe: 'Fris & Energiek',
    category: 'Licht',
    bgPreview: '#fefce8',
    accentPreview: '#f59e0b',
  },
  {
    id: 'breeze',
    name: 'Nordic Breeze ☁️',
    mode: 'light',
    description: 'Fris Scandinavisch minimalistisch wit & ijsblauw met koningsblauw',
    descriptionEn: 'Fresh Nordic clean white & ice blue with crisp royal blue',
    vibe: 'Strak & Kalm',
    category: 'Licht',
    bgPreview: '#f0f9ff',
    accentPreview: '#2563eb',
  },

  // 4 OVERHAULED DARK THEMES
  {
    id: 'obsidian',
    name: 'Obsidian Luxe 🖤',
    mode: 'dark',
    description: 'Mat diepzwart, titanium zilveren randen & strak diamantwit',
    descriptionEn: 'Matte obsidian black, titanium silver edges & pure diamond white',
    vibe: 'Sleek Minimalist',
    category: 'Donker',
    bgPreview: '#09090b',
    accentPreview: '#ffffff',
  },
  {
    id: 'arcade',
    name: 'Cyber Neon 👾',
    mode: 'dark',
    description: 'Diepe middernacht, neon cyaan gloed & felgroene gamer accents',
    descriptionEn: 'Deep midnight void, glowing neon cyan & electric gamer mint',
    vibe: 'Retro Gamer',
    category: 'Donker',
    bgPreview: '#080a12',
    accentPreview: '#00f2fe',
  },
  {
    id: 'sunset',
    name: 'Cosmic Sunset 🌌',
    mode: 'dark',
    description: 'Kosmisch dieppaars, pruimkleurige kaarten & gloeiend koraalroze',
    descriptionEn: 'Cosmic deep violet, dark plum cards & glowing coral rose',
    vibe: 'Warm & Mystiek',
    category: 'Donker',
    bgPreview: '#120c24',
    accentPreview: '#f43f5e',
  },
  {
    id: 'forest',
    name: 'Emerald Forest 🌲',
    mode: 'dark',
    description: 'Diep dennenbos, mosgroene oppervlakken & warm goud',
    descriptionEn: 'Deep pine night, rich moss surfaces & warm Nordic gold',
    vibe: 'Natuurlijk & Rustgevend',
    category: 'Donker',
    bgPreview: '#07140f',
    accentPreview: '#10b981',
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

import { createContext, useContext, useEffect, useState } from "react"

export type ThemeId =
  | "dark" | "light" | "system"
  | "ocean" | "forest" | "sunset" | "galaxy" | "rose"
  | "midnight" | "crimson" | "amber" | "slate" | "neon"
  | "paper" | "arctic"

export const THEMES: { id: ThemeId; label: string; dark: boolean; primary: string; bg: string }[] = [
  { id: "dark",     label: "FitForge Dark",  dark: true,  primary: "#00E6D2", bg: "#09090B" },
  { id: "light",    label: "FitForge Light", dark: false, primary: "#00C4B0", bg: "#ffffff" },
  { id: "ocean",    label: "Ocean",          dark: true,  primary: "#2B9FFF", bg: "#05111F" },
  { id: "forest",   label: "Forest",         dark: true,  primary: "#22C55E", bg: "#05130A" },
  { id: "sunset",   label: "Sunset",         dark: true,  primary: "#FF7A3A", bg: "#140C05" },
  { id: "galaxy",   label: "Galaxy",         dark: true,  primary: "#A855F7", bg: "#0D0515" },
  { id: "rose",     label: "Rose",           dark: true,  primary: "#F43F8E", bg: "#150610" },
  { id: "midnight", label: "Midnight",       dark: true,  primary: "#E8E8E8", bg: "#080808" },
  { id: "crimson",  label: "Crimson",        dark: true,  primary: "#EF4444", bg: "#130505" },
  { id: "amber",    label: "Amber",          dark: true,  primary: "#F59E0B", bg: "#120D02" },
  { id: "slate",    label: "Slate",          dark: true,  primary: "#818CF8", bg: "#07081A" },
  { id: "neon",     label: "Neon",           dark: true,  primary: "#39FF14", bg: "#020602" },
  { id: "paper",    label: "Paper",          dark: false, primary: "#0F9B8E", bg: "#FAF8F5" },
  { id: "arctic",   label: "Arctic",         dark: false, primary: "#6366F1", bg: "#F5F7FC" },
]

const ALL_THEME_CLASSES = THEMES
  .filter(t => t.id !== "dark" && t.id !== "light" && t.id !== "system")
  .map(t => `theme-${t.id}`)

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: ThemeId
  storageKey?: string
}

type ThemeProviderState = {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeId>(
    () => (localStorage.getItem(storageKey) as ThemeId) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark", ...ALL_THEME_CLASSES)

    const meta = THEMES.find(t => t.id === theme)

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
      return
    }

    if (meta?.dark) root.classList.add("dark")
    if (theme !== "dark" && theme !== "light") root.classList.add(`theme-${theme}`)
  }, [theme])

  const value = {
    theme,
    setTheme: (t: ThemeId) => {
      localStorage.setItem(storageKey, t)
      setTheme(t)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  return context
}

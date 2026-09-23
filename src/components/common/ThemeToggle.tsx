import { Moon, Sun } from 'lucide-react'
import { useKanwichStore } from '../../store/useKanwichStore'

export default function ThemeToggle() {
  const theme = useKanwichStore((s) => s.theme)
  const toggleTheme = useKanwichStore((s) => s.toggleTheme)

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="rounded-md p-2 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}

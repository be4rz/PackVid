import { Sun, Monitor, Moon } from 'lucide-react'
import { useTheme, type Theme } from '../hooks/useTheme'

/**
 * Three-option theme toggle: Light / System / Dark.
 * Uses Lucide icons. Active option is highlighted with primary color.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Sáng' },
    { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'Hệ thống' },
    { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Tối' },
  ]

  return (
    <div className="flex items-center gap-1 bg-surface-800 rounded-lg p-1">
      {options.map((opt) => {
        const isActive = theme === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            className={`
              flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
              cursor-pointer transition-all duration-150
              ${isActive
                ? 'bg-primary-500/15 text-primary-400 shadow-sm'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700'
              }
            `}
          >
            {opt.icon}
          </button>
        )
      })}
    </div>
  )
}

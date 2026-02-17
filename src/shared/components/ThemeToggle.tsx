import { Sun, Monitor, Moon, Palette } from 'lucide-react'
import { useTheme, type Theme } from '../hooks/useTheme'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

/**
 * Three-option theme toggle: Light / System / Dark.
 *
 * Two visual modes:
 * - **Default (inline)** — horizontal pill with 3 icon buttons
 * - **Compact (dropdown)** — single icon button → shadcn DropdownMenu above
 *   For use in the collapsed sidebar where horizontal space is limited.
 */

const OPTIONS: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Sáng' },
  { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'Hệ thống' },
  { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Tối' },
]

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()

  // ── Inline mode (expanded sidebar) ──────────────────────────
  if (!compact) {
    return (
      <div className="flex items-center gap-1 bg-surface-800 rounded-lg p-1">
        {OPTIONS.map((opt) => {
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

  // ── Compact / dropdown mode (collapsed sidebar) ─────────────
  const currentIcon = OPTIONS.find(o => o.value === theme)?.icon ?? <Palette className="w-4 h-4" />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title="Đổi giao diện"
          className="w-full flex items-center justify-center p-2 rounded-lg cursor-pointer transition-all duration-150 bg-surface-800 text-surface-400 hover:text-surface-200 hover:bg-surface-700 data-[state=open]:bg-primary-500/15 data-[state=open]:text-primary-400"
        >
          {currentIcon}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" sideOffset={8} align="end">
        {OPTIONS.map((opt) => {
          const isActive = theme === opt.value
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={isActive ? 'text-primary-400 bg-primary-500/10' : ''}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

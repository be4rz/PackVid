/**
 * AppLayout — Shared layout with sidebar, header, and content outlet
 *
 * Extracted from App.tsx to serve as the layout wrapper for all routes.
 * Contains sidebar navigation, theme toggle, storage indicator, and
 * a react-router <Outlet> for page content.
 */

import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Camera, Video, Package, HardDrive,
  Settings, Search, Bell, BarChart3,
} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-900 border-r border-surface-800 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center shadow-glow-blue">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-surface-50 font-bold text-lg leading-none">PackVid</h1>
              <p className="text-surface-500 text-xs mt-0.5">Quay video đóng hàng</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            <NavItem
              icon={<Camera className="w-4.5 h-4.5" />}
              label="Quay video"
              active={location.pathname === '/'}
              onClick={() => navigate('/')}
            />
            <NavItem
              icon={<Video className="w-4.5 h-4.5" />}
              label="Thư viện video"
              active={location.pathname === '/library'}
              onClick={() => navigate('/library')}
              badge={128}
            />
            <NavItem
              icon={<BarChart3 className="w-4.5 h-4.5" />}
              label="Thống kê"
              active={location.pathname === '/stats'}
              onClick={() => navigate('/stats')}
            />
            <NavItem
              icon={<Settings className="w-4.5 h-4.5" />}
              label="Cài đặt"
              active={location.pathname === '/settings'}
              onClick={() => navigate('/settings')}
            />
          </ul>
        </nav>

        {/* Theme toggle */}
        <div className="px-4 pt-3">
          <ThemeToggle />
        </div>

        {/* Storage indicator */}
        <div className="p-4 border-t border-surface-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-surface-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              Bộ nhớ
            </span>
            <span className="text-xs text-surface-400">42.5 / 256 GB</span>
          </div>
          <div className="w-full bg-surface-800 rounded-full h-1.5">
            <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: '16.6%' }} />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header bar */}
        <header className="h-14 bg-surface-900/80 backdrop-blur-sm border-b border-surface-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-surface-100 font-semibold text-sm">
              {getPageTitle(location.pathname)}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded-md transition-colors cursor-pointer">
              <Search className="w-4.5 h-4.5" />
            </button>
            <button className="p-2 text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded-md transition-colors cursor-pointer relative">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/': 'Quay video',
    '/library': 'Thư viện video',
    '/stats': 'Thống kê',
    '/settings': 'Cài đặt',
  }
  return titles[pathname] ?? 'PackVid'
}

function NavItem({ icon, label, active = false, badge, onClick }: {
  icon: React.ReactNode
  label: string
  active?: boolean
  badge?: number
  onClick?: () => void
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200
          ${active
            ? 'bg-primary-500/10 text-primary-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]'
            : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
          }`}
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        {badge !== undefined && (
          <span className="bg-surface-800 text-surface-400 text-xs px-2 py-0.5 rounded-full font-mono">
            {badge}
          </span>
        )}
      </button>
    </li>
  )
}

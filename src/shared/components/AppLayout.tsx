/**
 * AppLayout — Shared layout with sidebar, header, and content outlet
 *
 * Features:
 * - Sticky sidebar that doesn't scroll with content
 * - Collapsible icon-only mode (persisted in localStorage)
 * - Smooth animated expand/collapse via motion (framer-motion)
 * - Tooltip labels when sidebar is collapsed (shadcn/Radix Tooltip)
 * - Live storage indicator from recordings:getStats
 */

import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Camera, Video, Package, HardDrive,
  Settings, Search, Bell, BarChart3,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { ThemeToggle } from './ThemeToggle'
import { formatFileSize } from '../lib/format'

// ─── Constants ────────────────────────────────────────────────
const SIDEBAR_WIDTH_EXPANDED = 256 // w-64
const SIDEBAR_WIDTH_COLLAPSED = 64  // w-16
const HEADER_HEIGHT = 60            // p-3 (12px) + h-9 (36px) + p-3 (12px)
const TRANSITION = { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const }

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  // Sidebar collapse state (persisted)
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })

  function toggleCollapse() {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  // Live stats for sidebar badge + storage indicator
  const [stats, setStats] = useState<{
    totalCount: number
    totalSize: number
  } | null>(null)

  useEffect(() => {
    window.api.recordings.getStats()
      .then(s => setStats({ totalCount: s.totalCount, totalSize: s.totalSize }))
      .catch(() => setStats(null))
  }, [location.pathname])

  return (
    <TooltipProvider delayDuration={300}>
    <div className="min-h-screen bg-surface-950 flex">
      {/* Sidebar — sticky, animated width */}
      <motion.aside
        animate={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
        transition={TRANSITION}
        className="h-screen sticky top-0 bg-surface-900 border-r border-surface-800 flex flex-col overflow-y-auto overflow-x-hidden"
      >
        {/* Logo */}
        <div className="p-3 border-b border-surface-800" style={{ height: HEADER_HEIGHT }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center shadow-glow-blue shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="text-surface-50 font-bold text-lg leading-none">PackVid</h1>
                <p className="text-surface-500 text-xs mt-0.5">Quay video đóng hàng</p>
              </div>
            )}
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
              collapsed={collapsed}
            />
            <NavItem
              icon={<Video className="w-4.5 h-4.5" />}
              label="Thư viện video"
              active={location.pathname === '/library'}
              onClick={() => navigate('/library')}
              badge={stats?.totalCount}
              collapsed={collapsed}
            />
            <NavItem
              icon={<BarChart3 className="w-4.5 h-4.5" />}
              label="Thống kê"
              active={location.pathname === '/stats'}
              onClick={() => navigate('/stats')}
              collapsed={collapsed}
            />
            <NavItem
              icon={<Settings className="w-4.5 h-4.5" />}
              label="Cài đặt"
              active={location.pathname === '/settings'}
              onClick={() => navigate('/settings')}
              collapsed={collapsed}
            />
          </ul>
        </nav>

        {/* Collapse toggle */}
        <div className="px-4 py-2">
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-surface-500 hover:text-surface-300 hover:bg-surface-800 rounded-md transition-colors cursor-pointer text-xs"
            title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
            {!collapsed && (
              <span className="overflow-hidden whitespace-nowrap">Thu gọn</span>
            )}
          </button>
        </div>

        {/* Theme toggle */}
        <div className="p-4">
          <ThemeToggle compact={collapsed} />
        </div>

        {/* Storage indicator — live data */}
        <div className="p-4 py-3 border-t border-surface-800 overflow-hidden">
          {!collapsed && (
            <div className="flex items-center justify-between mb-2 whitespace-nowrap">
              <span className="text-xs text-surface-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                Bộ nhớ
              </span>
              <span className="text-xs text-surface-400">
                {stats ? `Đã dùng: ${formatFileSize(stats.totalSize)}` : '...'}
              </span>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center mb-1.5">
              <HardDrive className="w-3.5 h-3.5 text-surface-500" />
            </div>
          )}
          <div className="w-full bg-surface-800 rounded-full h-1.5">
            <div
              className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: stats ? `${Math.min((stats.totalSize / (256 * 1024 * 1024 * 1024)) * 100, 100)}%` : '0%' }}
            />
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <header className="bg-surface-900/80 backdrop-blur-sm border-b border-surface-800 flex items-center justify-between px-6" style={{ height: HEADER_HEIGHT }}>
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
    </TooltipProvider>
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

/**
 * NavItem — individual sidebar navigation link.
 * Shows a Tooltip with the label when the sidebar is collapsed.
 */
function NavItem({ icon, label, active = false, badge, onClick, collapsed }: {
  icon: React.ReactNode
  label: string
  active?: boolean
  badge?: number
  onClick?: () => void
  collapsed?: boolean
}) {
  const button = (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200
        ${active
          ? 'bg-primary-500/10 text-primary-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]'
          : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
        }`}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && (
        <span className="overflow-hidden whitespace-nowrap flex items-center gap-2">
          <span className="flex-1 text-left">{label}</span>
          {badge !== undefined && (
            <span className="bg-surface-800 text-surface-400 text-xs px-2 py-0.5 rounded-full font-mono">
              {badge}
            </span>
          )}
        </span>
      )}
    </button>
  )

  // When collapsed, wrap in Tooltip to show the label on hover
  if (collapsed) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {label}
          </TooltipContent>
        </Tooltip>
      </li>
    )
  }

  return <li>{button}</li>
}

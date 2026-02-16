/**
 * Pagination — Page navigation with page size selector
 *
 * Shows prev/next buttons, smart page numbers (max 7 with ellipsis),
 * page size dropdown, and current page indicator.
 */

import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

const PAGE_SIZES = [10, 25, 50, 100]

interface PaginationProps {
  page: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({ page, totalPages, pageSize, onPageChange, onPageSizeChange }: PaginationProps) {
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between mt-4">
        <PageSizeSelector pageSize={pageSize} onChange={onPageSizeChange} />
        <span className="text-surface-500 text-xs">Trang 1 / 1</span>
      </div>
    )
  }

  const pages = getPageNumbers(page, totalPages)

  return (
    <div className="flex items-center justify-between mt-4">
      <PageSizeSelector pageSize={pageSize} onChange={onPageSizeChange} />

      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-surface-400 hover:bg-surface-800 rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Trước
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-surface-600">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                p === page
                  ? 'bg-primary-500 text-white'
                  : 'text-surface-400 hover:bg-surface-800'
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-surface-400 hover:bg-surface-800 rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Sau
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Page indicator */}
        <span className="text-surface-500 text-xs ml-2">
          Trang {page} / {totalPages}
        </span>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────

function PageSizeSelector({ pageSize, onChange }: { pageSize: number; onChange: (size: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-surface-500 text-xs">Hiển thị:</span>
      <div className="relative">
        <select
          value={pageSize}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="bg-surface-800 border border-surface-700 text-surface-300 text-xs rounded-md px-2 py-1.5 pr-6
            appearance-none cursor-pointer transition-colors
            hover:border-surface-600 focus:border-primary-500 focus:outline-none"
        >
          {PAGE_SIZES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-surface-500 pointer-events-none" />
      </div>
    </div>
  )
}

/** Generate page numbers with ellipsis for large page counts */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = []

  // Always show first page
  pages.push(1)

  if (current > 3) {
    pages.push('...')
  }

  // Window around current page
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push('...')
  }

  // Always show last page
  pages.push(total)

  return pages
}

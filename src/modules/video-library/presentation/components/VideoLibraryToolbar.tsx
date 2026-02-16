/**
 * VideoLibraryToolbar — Search, filter, and sort controls
 *
 * Renders a search input (debounced 300ms), carrier/lifecycle/sort dropdowns,
 * and a clear filters button. All filter changes trigger the useVideoLibrary hook.
 */

import { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import type { VideoLibraryFilters } from '../hooks/useVideoLibrary'

/** Sort option labels (Vietnamese) */
const SORT_OPTIONS: { label: string; sortBy: VideoLibraryFilters['sortBy']; sortOrder: VideoLibraryFilters['sortOrder'] }[] = [
  { label: 'Mới nhất', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: 'Cũ nhất', sortBy: 'createdAt', sortOrder: 'asc' },
  { label: 'Lớn nhất', sortBy: 'fileSize', sortOrder: 'desc' },
  { label: 'Nhỏ nhất', sortBy: 'fileSize', sortOrder: 'asc' },
  { label: 'Dài nhất', sortBy: 'duration', sortOrder: 'desc' },
  { label: 'Ngắn nhất', sortBy: 'duration', sortOrder: 'asc' },
]

interface VideoLibraryToolbarProps {
  filters: VideoLibraryFilters
  total: number
  hasActiveFilters: boolean
  onUpdateFilters: (partial: Partial<VideoLibraryFilters>) => void
  onResetFilters: () => void
}

export function VideoLibraryToolbar({
  filters,
  total,
  hasActiveFilters,
  onUpdateFilters,
  onResetFilters,
}: VideoLibraryToolbarProps) {
  // Debounced search input
  const [searchInput, setSearchInput] = useState(filters.trackingNumber)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Sync external filter changes back to input
  useEffect(() => {
    setSearchInput(filters.trackingNumber)
  }, [filters.trackingNumber])

  function handleSearchChange(value: string) {
    setSearchInput(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onUpdateFilters({ trackingNumber: value })
    }, 300)
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  // Current sort key for the dropdown
  const currentSortKey = `${filters.sortBy}-${filters.sortOrder}`

  function handleSortChange(key: string) {
    const option = SORT_OPTIONS.find(o => `${o.sortBy}-${o.sortOrder}` === key)
    if (option) {
      onUpdateFilters({ sortBy: option.sortBy, sortOrder: option.sortOrder })
    }
  }

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo mã vận đơn..."
            className="w-full bg-surface-800 border border-surface-700 text-surface-200 text-sm rounded-lg pl-9 pr-3 py-2.5
              placeholder:text-surface-600 transition-colors
              hover:border-surface-600 focus:border-primary-500 focus:outline-none"
          />
        </div>

        {/* Carrier filter */}
        <FilterSelect
          value={filters.carrier}
          onChange={(v) => onUpdateFilters({ carrier: v })}
          options={[
            { value: '', label: 'Hãng vận chuyển' },
            { value: 'SPX', label: 'SPX Express' },
            { value: 'GHN', label: 'Giao Hàng Nhanh' },
            { value: 'GHTK', label: 'Giao Hàng Tiết Kiệm' },
          ]}
        />

        {/* Lifecycle filter */}
        <FilterSelect
          value={filters.lifecycleStage}
          onChange={(v) => onUpdateFilters({ lifecycleStage: v })}
          options={[
            { value: '', label: 'Trạng thái' },
            { value: 'active', label: 'Hoạt động' },
            { value: 'archived', label: 'Đã nén' },
          ]}
        />

        {/* Sort */}
        <FilterSelect
          value={currentSortKey}
          onChange={handleSortChange}
          options={SORT_OPTIONS.map(o => ({
            value: `${o.sortBy}-${o.sortOrder}`,
            label: o.label,
          }))}
        />

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-surface-400 hover:text-surface-200 text-xs transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Result count */}
      <div className="mt-3 flex items-center">
        <span className="text-surface-500 text-xs">
          Tìm thấy {total} video
        </span>
      </div>
    </div>
  )
}

// ─── Sub-component ───────────────────────────────────────────

function FilterSelect({ value, onChange, options }: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-40 bg-surface-800 border border-surface-700 text-surface-200 text-sm rounded-lg px-3 py-2.5 pr-8
          appearance-none cursor-pointer transition-colors
          hover:border-surface-600 focus:border-primary-500 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
    </div>
  )
}

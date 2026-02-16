/**
 * useVideoLibrary — Core data hook for the Video Library feature
 *
 * Manages search, filtering, pagination, row selection, and bulk operations.
 * Calls window.api.recordings.search() for data and maps IPC rows to domain entities.
 *
 * @see src/modules/video-storage/domain/entities/Recording.ts
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { LifecycleStage } from '../../../video-storage/domain/value-objects/LifecycleStage'
import type { StorageRecording } from '../../../video-storage/domain/entities/Recording'

// ─── Types ────────────────────────────────────────────────────

export interface VideoLibraryFilters {
  trackingNumber: string
  carrier: string          // '' = all
  lifecycleStage: string   // '' = all
  dateFrom: string         // ISO date string or ''
  dateTo: string           // ISO date string or ''
  durationMin: number | null  // milliseconds
  durationMax: number | null  // milliseconds
  sortBy: 'createdAt' | 'fileSize' | 'duration'
  sortOrder: 'asc' | 'desc'
}

const DEFAULT_FILTERS: VideoLibraryFilters = {
  trackingNumber: '',
  carrier: '',
  lifecycleStage: '',
  dateFrom: '',
  dateTo: '',
  durationMin: null,
  durationMax: null,
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

const DEFAULT_PAGE_SIZE = 25

// ─── IPC Row → Domain Entity Mapping ─────────────────────────

type IpcRecordingRow = Awaited<ReturnType<typeof window.api.recordings.search>>['recordings'][number]

function toDomain(row: IpcRecordingRow): StorageRecording {
  return {
    id: row.id,
    trackingNumber: row.trackingNumber,
    carrier: row.carrier ?? undefined,
    fileKey: row.fileKey,
    fileSize: row.fileSize ?? undefined,
    duration: row.duration ?? undefined,
    status: row.status as StorageRecording['status'],
    lifecycleStage: (row.lifecycleStage || 'active') as LifecycleStage,
    thumbnailKey: row.thumbnailKey ?? undefined,
    thumbnailData: row.thumbnailData ?? undefined,
    originalFileSize: row.originalFileSize ?? undefined,
    startedAt: new Date(row.startedAt),
    finishedAt: row.finishedAt ? new Date(row.finishedAt) : undefined,
    archivedAt: row.archivedAt ? new Date(row.archivedAt) : undefined,
    createdAt: new Date(row.createdAt),
  }
}

// ─── Hook ─────────────────────────────────────────────────────

export function useVideoLibrary() {
  const [recordings, setRecordings] = useState<StorageRecording[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<VideoLibraryFilters>(DEFAULT_FILTERS)
  const [page, setPageState] = useState(1)
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Track latest search to avoid stale responses
  const searchIdRef = useRef(0)

  // ─── Core search ──────────────────────────────────────────

  const search = useCallback(async (
    currentFilters: VideoLibraryFilters,
    currentPage: number,
    currentPageSize: number,
  ) => {
    const id = ++searchIdRef.current
    setLoading(true)
    setError(null)

    try {
      const result = await window.api.recordings.search({
        trackingNumber: currentFilters.trackingNumber || undefined,
        carrier: currentFilters.carrier || undefined,
        lifecycleStage: currentFilters.lifecycleStage || undefined,
        dateFrom: currentFilters.dateFrom ? new Date(currentFilters.dateFrom).getTime() : undefined,
        dateTo: currentFilters.dateTo ? new Date(currentFilters.dateTo).getTime() : undefined,
        durationMin: currentFilters.durationMin ?? undefined,
        durationMax: currentFilters.durationMax ?? undefined,
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder,
        limit: currentPageSize,
        offset: (currentPage - 1) * currentPageSize,
      })

      // Only apply if this is still the latest search
      if (id === searchIdRef.current) {
        setRecordings(result.recordings.map(toDomain))
        setTotal(result.total)
      }
    } catch (err) {
      if (id === searchIdRef.current) {
        console.error('[useVideoLibrary] Search failed:', err)
        setError('Không thể tải danh sách video')
      }
    } finally {
      if (id === searchIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  // ─── Auto-fetch on mount and when filters/page change ─────

  useEffect(() => {
    search(filters, page, pageSize)
  }, [filters, page, pageSize, search])

  // ─── Filter actions ───────────────────────────────────────

  const updateFilters = useCallback((partial: Partial<VideoLibraryFilters>) => {
    setFilters(prev => ({ ...prev, ...partial }))
    setPageState(1) // Reset to page 1 on filter change
    setSelectedIds(new Set()) // Clear selection on filter change
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setPageState(1)
    setSelectedIds(new Set())
  }, [])

  const hasActiveFilters = filters.trackingNumber !== '' ||
    filters.carrier !== '' ||
    filters.lifecycleStage !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.durationMin !== null ||
    filters.durationMax !== null

  // ─── Pagination actions ───────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const setPage = useCallback((p: number) => {
    setPageState(Math.max(1, Math.min(p, totalPages)))
    setSelectedIds(new Set()) // Clear selection on page change
  }, [totalPages])

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setPageState(1) // Reset to page 1
    setSelectedIds(new Set())
  }, [])

  // ─── Selection actions ────────────────────────────────────

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === recordings.length && recordings.length > 0) {
        return new Set()
      }
      return new Set(recordings.map(r => r.id))
    })
  }, [recordings])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // ─── Bulk delete ──────────────────────────────────────────

  const deleteRecordings = useCallback(async (ids: string[]): Promise<number> => {
    let deleted = 0
    for (const id of ids) {
      try {
        const result = await window.api.recordings.delete(id)
        if (result?.fileKey) {
          await window.api.storage.deleteFile(result.fileKey).catch(() => {
            // File might already be deleted, continue
          })
        }
        deleted++
      } catch (err) {
        console.error(`[useVideoLibrary] Failed to delete recording ${id}:`, err)
      }
    }

    // Refresh after deletion
    setSelectedIds(new Set())
    await search(filters, page, pageSize)
    return deleted
  }, [filters, page, pageSize, search])

  // ─── Bulk compress ────────────────────────────────────────

  const compressRecordings = useCallback(async (
    ids: string[],
    onProgress: (current: number, total: number, trackingNumber: string, ffmpegPercent: number) => void,
  ): Promise<{ success: number; failed: number; savedBytes: number }> => {
    // Filter to only eligible (active) recordings
    const eligible = recordings.filter(r => ids.includes(r.id) && r.lifecycleStage === 'active')
    let success = 0
    let failed = 0
    let savedBytes = 0

    for (let i = 0; i < eligible.length; i++) {
      const rec = eligible[i]
      onProgress(i, eligible.length, rec.trackingNumber, 0)

      // Poll FFmpeg progress during compression
      let pollHandle: ReturnType<typeof setInterval> | null = null
      const compressPromise = window.api.lifecycle.compressVideo({
        recordingId: rec.id,
        fileKey: rec.fileKey,
      })

      pollHandle = setInterval(async () => {
        try {
          const percent = await window.api.lifecycle.getProgress(rec.id)
          if (percent != null) {
            onProgress(i, eligible.length, rec.trackingNumber, percent)
          }
        } catch { /* ignore poll errors */ }
      }, 500)

      try {
        const result = await compressPromise
        savedBytes += result.originalFileSize - result.newFileSize
        success++
        onProgress(i + 1, eligible.length, rec.trackingNumber, 100)
      } catch (err) {
        console.error(`[useVideoLibrary] Failed to compress recording ${rec.id}:`, err)
        failed++
      } finally {
        if (pollHandle) clearInterval(pollHandle)
      }
    }

    // Refresh after compression
    setSelectedIds(new Set())
    await search(filters, page, pageSize)
    return { success, failed, savedBytes }
  }, [recordings, filters, page, pageSize, search])

  // ─── Stats ───────────────────────────────────────────────

  const [stats, setStats] = useState<{
    totalSize: number; activeSize: number; archivedSize: number
    totalCount: number; activeCount: number; archivedCount: number
    spaceSaved: number
  } | null>(null)

  const refreshStats = useCallback(async () => {
    try {
      const result = await window.api.recordings.getStats()
      setStats(result)
    } catch (err) {
      console.error('[useVideoLibrary] Failed to fetch stats:', err)
    }
  }, [])

  // Fetch stats on mount and after searches complete
  useEffect(() => {
    if (!loading) refreshStats()
  }, [loading, refreshStats])

  // ─── Refresh ──────────────────────────────────────────────

  const refresh = useCallback(() => {
    return search(filters, page, pageSize)
  }, [filters, page, pageSize, search])

  return {
    // Data
    recordings,
    total,
    totalPages,
    loading,
    error,
    stats,

    // Filters
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,

    // Pagination
    page,
    pageSize,
    setPage,
    setPageSize,

    // Selection
    selectedIds,
    toggleSelection,
    toggleSelectAll,
    clearSelection,

    // Actions
    deleteRecordings,
    compressRecordings,
    refresh,
  }
}

/**
 * useStorageStats — Presentation hook for storage usage statistics
 *
 * Wraps the recordings:getStats IPC call.
 * Auto-fetches on mount, exposes refresh for manual reload.
 */

import { useState, useEffect, useCallback } from 'react'

interface StorageStats {
  totalSize: number
  activeSize: number
  archivedSize: number
  totalCount: number
  activeCount: number
  archivedCount: number
  spaceSaved: number
}

const EMPTY_STATS: StorageStats = {
  totalSize: 0,
  activeSize: 0,
  archivedSize: 0,
  totalCount: 0,
  activeCount: 0,
  archivedCount: 0,
  spaceSaved: 0,
}

export function useStorageStats() {
  const [stats, setStats] = useState<StorageStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.api.recordings.getStats()
      setStats(result)
    } catch (err) {
      console.error('[useStorageStats] Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ...stats, loading, refresh }
}

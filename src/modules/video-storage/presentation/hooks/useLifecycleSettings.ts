/**
 * useLifecycleSettings — Presentation hook for lifecycle configuration
 *
 * Reads/writes `archive_after_days` and `lifecycle_enabled` settings
 * through the settings IPC API.
 */

import { useState, useEffect, useCallback } from 'react'

export function useLifecycleSettings() {
  const [archiveAfterDays, setArchiveAfterDaysLocal] = useState(14)
  const [lifecycleEnabled, setLifecycleEnabledLocal] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [days, enabled] = await Promise.all([
          window.api.settings.get('archive_after_days'),
          window.api.settings.get('lifecycle_enabled'),
        ])
        if (typeof days === 'number') setArchiveAfterDaysLocal(days)
        if (typeof enabled === 'boolean') setLifecycleEnabledLocal(enabled)
      } catch (err) {
        console.error('[useLifecycleSettings] Failed to load:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const setArchiveAfterDays = useCallback(async (days: number) => {
    const clamped = Math.max(1, Math.min(365, Math.round(days)))
    setArchiveAfterDaysLocal(clamped)
    await window.api.settings.set('archive_after_days', clamped)
  }, [])

  const setLifecycleEnabled = useCallback(async (enabled: boolean) => {
    setLifecycleEnabledLocal(enabled)
    await window.api.settings.set('lifecycle_enabled', enabled)
  }, [])

  return {
    archiveAfterDays,
    setArchiveAfterDays,
    lifecycleEnabled,
    setLifecycleEnabled,
    loading,
  }
}

/**
 * useStoragePath — Presentation hook for storage base path management
 *
 * Reads/writes `storage_base_path` through the storage IPC API.
 */

import { useState, useEffect, useCallback } from 'react'

export function useStoragePath() {
  const [basePath, setBasePathLocal] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const path = await window.api.storage.getBasePath()
        setBasePathLocal(path)
      } catch (err) {
        console.error('[useStoragePath] Failed to load:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const setBasePath = useCallback(async (path: string) => {
    setBasePathLocal(path)
    await window.api.storage.setBasePath(path)
  }, [])

  return { basePath, setBasePath, loading }
}

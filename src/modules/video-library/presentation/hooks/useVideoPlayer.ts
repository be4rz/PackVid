/**
 * useVideoPlayer — Modal state + video URL resolution
 *
 * Opens/closes the video player modal and resolves recording fileKeys
 * to absolute file paths via the storage IPC API.
 */

import { useState, useCallback, useEffect } from 'react'
import type { StorageRecording } from '../../../video-storage/domain/entities/Recording'

export function useVideoPlayer() {
  const [recording, setRecording] = useState<StorageRecording | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOpen = recording !== null

  const open = useCallback(async (rec: StorageRecording) => {
    setRecording(rec)
    setVideoUrl(null)
    setError(null)
    setLoading(true)

    try {
      // Use custom media:// protocol for secure file access
      setVideoUrl(`media://${encodeURIComponent(rec.fileKey)}`)
    } catch {
      setError('Không thể phát video. File có thể đã bị xóa.')
    } finally {
      setLoading(false)
    }
  }, [])

  const close = useCallback(() => {
    setRecording(null)
    setVideoUrl(null)
    setError(null)
    setLoading(false)
  }, [])

  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return { recording, videoUrl, loading, error, isOpen, open, close }
}

/**
 * useCamera — Core camera management hook
 *
 * Handles device enumeration, stream acquisition/release,
 * hot-plug detection, and permission flow.
 *
 * Uses browser MediaDevices API (available in Electron renderer).
 *
 * @example
 * const { devices, requestStream, releaseStream, permission } = useCamera()
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CameraDevice, CameraPermission, CameraConstraints } from '../types/camera'
import { DEFAULT_CAMERA_CONSTRAINTS } from '../types/camera'

interface UseCameraReturn {
  /** List of available video input devices */
  devices: CameraDevice[]
  /** Current permission state */
  permission: CameraPermission
  /** Whether device enumeration is in progress */
  isLoading: boolean
  /** Request camera permission and enumerate devices */
  requestPermission: () => Promise<void>
  /** Get a MediaStream for a specific device */
  requestStream: (deviceId: string, constraints?: CameraConstraints) => Promise<MediaStream>
  /** Stop all tracks on a stream */
  releaseStream: (stream: MediaStream) => void
  /** Re-enumerate devices manually */
  refreshDevices: () => Promise<void>
}

export function useCamera(): UseCameraReturn {
  const [devices, setDevices] = useState<CameraDevice[]>([])
  const [permission, setPermission] = useState<CameraPermission>('unknown')
  const [isLoading, setIsLoading] = useState(true)

  // Track active streams for cleanup
  const activeStreams = useRef<Set<MediaStream>>(new Set())

  // ─── Enumerate video input devices ──────────────────────────
  const enumerateDevices = useCallback(async (): Promise<CameraDevice[]> => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices
        .filter((d): d is MediaDeviceInfo & { kind: 'videoinput' } => d.kind === 'videoinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
          kind: 'videoinput' as const,
        }))

      setDevices(videoDevices)
      return videoDevices
    } catch (err) {
      console.error('[useCamera] Failed to enumerate devices:', err)
      return []
    }
  }, [])

  // ─── Request camera permission ──────────────────────────────
  const requestPermission = useCallback(async () => {
    try {
      // Request a temporary stream to trigger the permission prompt
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Immediately stop the temp stream
      tempStream.getTracks().forEach((track) => track.stop())

      setPermission('granted')
      // After permission granted, enumerate to get real labels
      await enumerateDevices()
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermission('denied')
        } else {
          console.error('[useCamera] Permission error:', err.name, err.message)
          setPermission('denied')
        }
      }
    }
  }, [enumerateDevices])

  // ─── Request a stream for a specific device ─────────────────
  const requestStream = useCallback(
    async (deviceId: string, constraints?: CameraConstraints): Promise<MediaStream> => {
      const c = constraints ?? DEFAULT_CAMERA_CONSTRAINTS
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: c.width },
          height: { ideal: c.height },
          frameRate: { ideal: c.frameRate },
        },
      })
      activeStreams.current.add(stream)
      return stream
    },
    []
  )

  // ─── Release a stream ───────────────────────────────────────
  const releaseStream = useCallback((stream: MediaStream) => {
    stream.getTracks().forEach((track) => track.stop())
    activeStreams.current.delete(stream)
  }, [])

  // ─── Refresh devices (public method) ────────────────────────
  const refreshDevices = useCallback(async () => {
    setIsLoading(true)
    await enumerateDevices()
    setIsLoading(false)
  }, [enumerateDevices])

  // ─── Initial enumeration + check permission ─────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // Check existing permission state (no prompt)
        if (navigator.permissions) {
          try {
            const status = await navigator.permissions.query({ name: 'camera' as PermissionName })
            if (!cancelled) {
              setPermission(status.state === 'granted' ? 'granted' : status.state === 'denied' ? 'denied' : 'prompt')
            }
          } catch {
            // permissions.query('camera') not supported in all browsers
          }
        }

        // Enumerate (labels may be empty if permission not granted)
        const foundDevices = await enumerateDevices()

        // If we have devices with labels, permission was already granted
        if (foundDevices.some((d) => d.label && !d.label.startsWith('Camera '))) {
          if (!cancelled) setPermission('granted')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [enumerateDevices])

  // ─── Hot-plug: listen for device changes ────────────────────
  useEffect(() => {
    const handleDeviceChange = () => {
      enumerateDevices()
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [enumerateDevices])

  // ─── Cleanup all active streams on unmount ──────────────────
  useEffect(() => {
    return () => {
      activeStreams.current.forEach((stream) => {
        stream.getTracks().forEach((track) => track.stop())
      })
      activeStreams.current.clear()
    }
  }, [])

  return {
    devices,
    permission,
    isLoading,
    requestPermission,
    requestStream,
    releaseStream,
    refreshDevices,
  }
}

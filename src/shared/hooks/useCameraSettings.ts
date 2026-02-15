/**
 * useCameraSettings — Camera assignment persistence hook
 *
 * Loads/saves camera-to-role assignments from/to the app_settings
 * table via Electron IPC (window.api.settings).
 *
 * Handles:
 * - Loading saved assignments on mount
 * - Assigning a device to a role
 * - Swapping scanner ↔ recorder
 * - Auto-assigning on first launch
 * - Gracefully handling missing devices
 *
 * @example
 * const { assignments, assignCamera, swapCameras } = useCameraSettings(devices)
 */

import { useState, useEffect, useCallback } from 'react'
import type { CameraAssignment, CameraDevice, CameraRole } from '../types/camera'
import { CAMERA_ASSIGNMENT_KEY } from '../types/camera'

interface UseCameraSettingsReturn {
  /** Current camera-to-role assignments */
  assignments: CameraAssignment
  /** Whether settings are being loaded */
  isLoading: boolean
  /** Assign a device to a role */
  assignCamera: (role: CameraRole, deviceId: string | null) => Promise<void>
  /** Swap scanner ↔ recorder assignments */
  swapCameras: () => Promise<void>
  /** Clear all assignments */
  clearAssignments: () => Promise<void>
}

const EMPTY_ASSIGNMENT: CameraAssignment = { scanner: null, recorder: null }

export function useCameraSettings(devices: CameraDevice[]): UseCameraSettingsReturn {
  const [assignments, setAssignments] = useState<CameraAssignment>(EMPTY_ASSIGNMENT)
  const [isLoading, setIsLoading] = useState(true)

  // ─── Save assignments to DB via IPC ─────────────────────────
  const saveAssignments = useCallback(async (newAssignments: CameraAssignment) => {
    setAssignments(newAssignments)
    try {
      await window.api.settings.set(CAMERA_ASSIGNMENT_KEY, newAssignments)
    } catch (err) {
      console.error('[useCameraSettings] Failed to save assignments:', err)
    }
  }, [])

  // ─── Assign a device to a role ──────────────────────────────
  const assignCamera = useCallback(async (role: CameraRole, deviceId: string | null) => {
    const updated = { ...assignments }
    updated[role] = deviceId

    // If the same device is assigned to both roles, clear the other role
    const otherRole: CameraRole = role === 'scanner' ? 'recorder' : 'scanner'
    if (deviceId && updated[otherRole] === deviceId) {
      updated[otherRole] = null
    }

    await saveAssignments(updated)
  }, [assignments, saveAssignments])

  // ─── Swap scanner ↔ recorder ───────────────────────────────
  const swapCameras = useCallback(async () => {
    await saveAssignments({
      scanner: assignments.recorder,
      recorder: assignments.scanner,
    })
  }, [assignments, saveAssignments])

  // ─── Clear all assignments ─────────────────────────────────
  const clearAssignments = useCallback(async () => {
    await saveAssignments(EMPTY_ASSIGNMENT)
  }, [saveAssignments])

  // ─── Load assignments on mount ──────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const saved = await window.api.settings.get(CAMERA_ASSIGNMENT_KEY) as CameraAssignment | null
        if (!cancelled && saved) {
          setAssignments(saved)
        }
      } catch (err) {
        console.error('[useCameraSettings] Failed to load assignments:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  // ─── Auto-assign when devices change and no assignments ─────
  useEffect(() => {
    if (isLoading || devices.length === 0) return

    // Validate existing assignments — remove references to disconnected devices
    const validScanner = assignments.scanner && devices.some((d) => d.deviceId === assignments.scanner)
      ? assignments.scanner
      : null
    const validRecorder = assignments.recorder && devices.some((d) => d.deviceId === assignments.recorder)
      ? assignments.recorder
      : null

    // If assignments changed due to disconnected devices, save the update
    if (validScanner !== assignments.scanner || validRecorder !== assignments.recorder) {
      saveAssignments({ scanner: validScanner, recorder: validRecorder })
      return
    }

    // Auto-assign on first launch (when both are null and devices are available)
    if (!validScanner && !validRecorder) {
      const autoAssignment: CameraAssignment = { scanner: null, recorder: null }

      if (devices.length >= 2) {
        // Two or more cameras: first → scanner, second → recorder
        autoAssignment.scanner = devices[0].deviceId
        autoAssignment.recorder = devices[1].deviceId
      } else if (devices.length === 1) {
        // Single camera: assign to both roles (single-camera mode)
        autoAssignment.scanner = devices[0].deviceId
        autoAssignment.recorder = devices[0].deviceId
      }

      if (autoAssignment.scanner || autoAssignment.recorder) {
        saveAssignments(autoAssignment)
      }
    }
  }, [devices, assignments, isLoading, saveAssignments])

  return {
    assignments,
    isLoading,
    assignCamera,
    swapCameras,
    clearAssignments,
  }
}

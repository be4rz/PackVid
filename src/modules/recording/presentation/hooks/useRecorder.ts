/**
 * useRecorder — MediaRecorder + IPC streaming hook
 *
 * Wraps the browser MediaRecorder API, captures video from the recorder
 * camera stream, and streams data chunks to disk via Electron IPC.
 *
 * Flow:
 *   startRecording(trackingNumber) → creates DB row + opens write stream
 *   ondataavailable (every 1s)     → streams Uint8Array chunks via IPC
 *   stopRecording()                → finalizes file, updates DB row
 *   cancelRecording()              → deletes file + DB row
 *
 * @example
 * const { isRecording, duration, startRecording, stopRecording } = useRecorder(recorderStream)
 *
 * // Start recording when QR is scanned
 * await startRecording('SPXVN061116275422', 'SPX')
 *
 * // Stop and get summary
 * const summary = await stopRecording()
 */

import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Types ─────────────────────────────────────────────────────

/** Summary returned after a recording is successfully saved */
export interface RecordingSummary {
  id: string
  trackingNumber: string
  fileKey: string
  fileSize: number
  duration: number
}

/** Preferred codec in order — VP9 is higher quality, VP8 is universal fallback */
const PREFERRED_CODECS = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
]

/** Chunk interval in ms — stream to disk every 1 second */
const CHUNK_INTERVAL_MS = 1000

// ─── Utility ───────────────────────────────────────────────────

/** Generate a file key from tracking number + current date */
function generateFileKey(trackingNumber: string): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd}/${trackingNumber}.webm`
}

/** Generate a UUID v4 */
function generateId(): string {
  return crypto.randomUUID()
}

/** Pick the best supported MIME type for MediaRecorder */
function getSupportedMimeType(): string {
  for (const codec of PREFERRED_CODECS) {
    if (MediaRecorder.isTypeSupported(codec)) {
      return codec
    }
  }
  return '' // let browser pick default
}

// ─── Hook ──────────────────────────────────────────────────────

interface UseRecorderReturn {
  /** Whether a recording is currently in progress */
  isRecording: boolean
  /** Whether the recording is paused */
  isPaused: boolean
  /** Live duration counter in seconds */
  duration: number
  /** ID of the current recording (null when idle) */
  currentRecordingId: string | null
  /** Start recording from the given stream */
  startRecording: (trackingNumber: string, carrier?: string) => Promise<void>
  /** Stop recording and save — returns summary */
  stopRecording: () => Promise<RecordingSummary>
  /** Cancel recording — deletes file and DB row */
  cancelRecording: () => Promise<void>
  /** Pause the current recording */
  pauseRecording: () => void
  /** Resume a paused recording */
  resumeRecording: () => void
}

export function useRecorder(recorderStream: MediaStream | null): UseRecorderReturn {
  // ─── State ─────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null)

  // ─── Refs (mutable, no re-render) ──────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const fileKeyRef = useRef<string>('')
  const trackingNumberRef = useRef<string>('')
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordingIdRef = useRef<string>('')

  // Track pause offset for accurate duration
  const pausedDurationRef = useRef<number>(0)
  const pauseStartRef = useRef<number>(0)

  // Promise to await the final ondataavailable after stop()
  const stopResolveRef = useRef<(() => void) | null>(null)

  // ─── Duration timer ────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000
      )
      setDuration(elapsed)
    }, 500) // Update every 500ms for smoother display
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // ─── Start recording ──────────────────────────────────────
  const startRecording = useCallback(async (trackingNumber: string, carrier?: string) => {
    if (!recorderStream) {
      throw new Error('No recorder stream available')
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      throw new Error('Already recording')
    }

    const id = generateId()
    const fileKey = generateFileKey(trackingNumber)
    const now = Date.now()

    // 1. Create DB row
    await window.api.recordings.create({
      id,
      trackingNumber,
      carrier,
      fileKey,
      status: 'recording',
      startedAt: now,
      createdAt: now,
    })

    // 2. Store refs
    recordingIdRef.current = id
    fileKeyRef.current = fileKey
    trackingNumberRef.current = trackingNumber
    startTimeRef.current = now
    pausedDurationRef.current = 0

    // 3. Create MediaRecorder
    const mimeType = getSupportedMimeType()
    const recorder = new MediaRecorder(recorderStream, {
      mimeType: mimeType || undefined,
    })

    // 4. Handle data chunks — stream to disk via IPC
    recorder.ondataavailable = async (event: BlobEvent) => {
      if (event.data.size > 0) {
        try {
          const buffer = new Uint8Array(await event.data.arrayBuffer())
          await window.api.storage.writeChunk(fileKeyRef.current, buffer)
        } catch (err) {
          console.error('[useRecorder] Failed to write chunk:', err)
        }
      }

      // If we're stopping, resolve the promise so stopRecording can continue
      if (recorder.state === 'inactive' && stopResolveRef.current) {
        stopResolveRef.current()
        stopResolveRef.current = null
      }
    }

    recorder.onerror = (event) => {
      console.error('[useRecorder] MediaRecorder error:', event)
    }

    mediaRecorderRef.current = recorder

    // 5. Start recording with 1-second chunk interval
    recorder.start(CHUNK_INTERVAL_MS)

    // 6. Update state
    setIsRecording(true)
    setIsPaused(false)
    setDuration(0)
    setCurrentRecordingId(id)

    // 7. Start duration timer
    startTimer()
  }, [recorderStream, startTimer])

  // ─── Stop recording ───────────────────────────────────────
  const stopRecording = useCallback(async (): Promise<RecordingSummary> => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      throw new Error('No active recording to stop')
    }

    // 1. Stop MediaRecorder and wait for final chunk
    await new Promise<void>((resolve) => {
      stopResolveRef.current = resolve
      recorder.stop()
    })

    // 2. Stop timer
    stopTimer()

    // 3. Finalize file — close stream, get file size
    const { fileSize } = await window.api.storage.finalize(fileKeyRef.current)

    // 4. Calculate final duration (milliseconds)
    const finalDuration = Date.now() - startTimeRef.current - pausedDurationRef.current

    // 5. Update DB row
    await window.api.recordings.update(recordingIdRef.current, {
      status: 'saved',
      fileSize,
      duration: finalDuration,
      finishedAt: Date.now(),
    })

    // 6. Generate thumbnail (fire-and-forget, non-blocking)
    window.api.thumbnails.generate(fileKeyRef.current).catch((err: unknown) => {
      console.error('[useRecorder] Thumbnail generation failed:', err)
    })

    // 7. Build summary
    const summary: RecordingSummary = {
      id: recordingIdRef.current,
      trackingNumber: trackingNumberRef.current,
      fileKey: fileKeyRef.current,
      fileSize,
      duration: finalDuration,
    }

    // 8. Reset state
    mediaRecorderRef.current = null
    setIsRecording(false)
    setIsPaused(false)
    setDuration(0)
    setCurrentRecordingId(null)

    return summary
  }, [stopTimer])

  // ─── Cancel recording ─────────────────────────────────────
  const cancelRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      // Stop without waiting for final chunk
      recorder.stop()
    }

    // Stop timer
    stopTimer()

    // Delete file from disk
    if (fileKeyRef.current) {
      try {
        await window.api.storage.deleteFile(fileKeyRef.current)
      } catch (err) {
        console.error('[useRecorder] Failed to delete file on cancel:', err)
      }
    }

    // Delete DB row
    if (recordingIdRef.current) {
      try {
        await window.api.recordings.delete(recordingIdRef.current)
      } catch (err) {
        console.error('[useRecorder] Failed to delete recording on cancel:', err)
      }
    }

    // Reset state
    mediaRecorderRef.current = null
    setIsRecording(false)
    setIsPaused(false)
    setDuration(0)
    setCurrentRecordingId(null)
  }, [stopTimer])

  // ─── Pause recording ──────────────────────────────────────
  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === 'recording') {
      recorder.pause()
      pauseStartRef.current = Date.now()
      setIsPaused(true)
      stopTimer()
    }
  }, [stopTimer])

  // ─── Resume recording ─────────────────────────────────────
  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === 'paused') {
      // Accumulate paused time for accurate duration
      pausedDurationRef.current += Date.now() - pauseStartRef.current
      recorder.resume()
      setIsPaused(false)
      startTimer()
    }
  }, [startTimer])

  // ─── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      // Stop any active recording on unmount
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop()
      }
      stopTimer()
    }
  }, [stopTimer])

  return {
    isRecording,
    isPaused,
    duration,
    currentRecordingId,
    startRecording,
    stopRecording,
    cancelRecording,
    pauseRecording,
    resumeRecording,
  }
}

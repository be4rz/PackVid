/**
 * useQRScanner — Presentation Hook
 *
 * Continuously scans a <video> element for QR codes and barcodes
 * using the zxing-js library. Returns the latest scan result.
 *
 * Mechanism:
 * 1. Creates an offscreen <canvas> element
 * 2. On interval (default 100ms / 10 FPS), draws the current video frame
 * 3. Extracts ImageData → RGBLuminanceSource → BinaryBitmap
 * 4. Passes to MultiFormatReader.decodeWithState()
 * 5. On successful decode → parseTrackingCode → update lastScan
 * 6. Deduplication: same tracking number is ignored until a different code
 *    is scanned or the scanner is reset
 *
 * @example
 * const videoRef = useRef<HTMLVideoElement>(null)
 * const { lastScan, isScanning, scanCount, isCodeVisible } = useQRScanner(videoRef)
 */

import { useState, useEffect, useRef, useCallback, type RefObject } from 'react'
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  NotFoundException,
} from '@zxing/library'
import { parseTrackingCode } from '../../domain/rules/parseTrackingCode'
import type { ScannedOrder, ScanFormat } from '../../domain/entities/ScannedOrder'

// ─── Types ──────────────────────────────────────────────────────

interface UseQRScannerOptions {
  /** Scan interval in ms. Default: 100 (10 FPS) */
  scanIntervalMs?: number
  /** Whether scanning is enabled. Default: true */
  enabled?: boolean
  /** Barcode formats to detect. Default: QR_CODE, CODE_128, EAN_13 */
  formats?: BarcodeFormat[]
  /** Maximum scan history entries to keep. Default: 10 */
  maxHistory?: number
  /** Callback invoked on each new successful scan */
  onScan?: (order: ScannedOrder) => void
}

interface UseQRScannerReturn {
  /** Last successfully scanned order, or null */
  lastScan: ScannedOrder | null
  /** Whether the scanner is actively scanning frames */
  isScanning: boolean
  /** Total number of successful scans in this session */
  scanCount: number
  /** History of recent scans (newest first, max entries configurable) */
  scanHistory: ScannedOrder[]
  /** Whether a QR/barcode is currently visible in the camera frame */
  isCodeVisible: boolean
  /** Reset last scan, scan count, and history */
  reset: () => void
}

// ─── Format mapping ─────────────────────────────────────────────

/** Map zxing BarcodeFormat enum to our ScanFormat string */
function toScanFormat(format: BarcodeFormat): ScanFormat {
  switch (format) {
    case BarcodeFormat.QR_CODE:
      return 'QR_CODE'
    case BarcodeFormat.CODE_128:
      return 'CODE_128'
    case BarcodeFormat.EAN_13:
      return 'EAN_13'
    default:
      return 'OTHER'
  }
}

// ─── Default config ─────────────────────────────────────────────

const DEFAULT_FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
  BarcodeFormat.EAN_13,
]

const DEFAULT_SCAN_INTERVAL_MS = 100
const DEFAULT_MAX_HISTORY = 10

/** How long (ms) without a successful decode before isCodeVisible → false */
const VISIBILITY_TIMEOUT_MS = 1000

// ─── Hook ───────────────────────────────────────────────────────

export function useQRScanner(
  videoRef: RefObject<HTMLVideoElement | null>,
  options?: UseQRScannerOptions,
): UseQRScannerReturn {
  const {
    scanIntervalMs = DEFAULT_SCAN_INTERVAL_MS,
    enabled = true,
    formats = DEFAULT_FORMATS,
    maxHistory = DEFAULT_MAX_HISTORY,
    onScan,
  } = options ?? {}

  const [lastScan, setLastScan] = useState<ScannedOrder | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const [scanHistory, setScanHistory] = useState<ScannedOrder[]>([])
  const [isCodeVisible, setIsCodeVisible] = useState(false)

  // Refs for mutable state that shouldn't trigger re-renders
  const readerRef = useRef<MultiFormatReader | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const lastScannedCodeRef = useRef<string>('')
  const visibilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Initialize reader with format hints ────────────────────
  useEffect(() => {
    const reader = new MultiFormatReader()
    const hints = new Map<DecodeHintType, unknown>()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats)
    hints.set(DecodeHintType.TRY_HARDER, true)
    reader.setHints(hints)
    readerRef.current = reader

    return () => {
      reader.reset()
      readerRef.current = null
    }
    // Re-initialize when formats change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formats.map((f) => f.toString()).join(',')])

  // ─── Create offscreen canvas ────────────────────────────────
  useEffect(() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvasRef.current = canvas
    ctxRef.current = ctx

    return () => {
      canvasRef.current = null
      ctxRef.current = null
    }
  }, [])

  // ─── Reset function ─────────────────────────────────────────
  const reset = useCallback(() => {
    setLastScan(null)
    setScanCount(0)
    setScanHistory([])
    setIsCodeVisible(false)
    lastScannedCodeRef.current = ''
    if (visibilityTimerRef.current) {
      clearTimeout(visibilityTimerRef.current)
      visibilityTimerRef.current = null
    }
  }, [])

  // ─── Main scan loop ─────────────────────────────────────────
  useEffect(() => {
    if (!enabled) {
      setIsScanning(false)
      return
    }

    const intervalId = setInterval(() => {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      const reader = readerRef.current

      // Guard: video must be playing and have dimensions
      if (
        !video ||
        !canvas ||
        !ctx ||
        !reader ||
        video.readyState < video.HAVE_CURRENT_DATA ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        setIsScanning(false)
        return
      }

      setIsScanning(true)

      // Resize canvas to match video dimensions
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }

      // Draw current frame to offscreen canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Extract pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const rgba = imageData.data // Uint8ClampedArray: [R,G,B,A, R,G,B,A, ...]

      // Convert RGBA → grayscale luminance (ITU BT.601)
      // RGBLuminanceSource with Uint8ClampedArray expects 1 byte per pixel,
      // but getImageData returns 4 bytes per pixel (RGBA).
      // We must convert manually.
      const numPixels = canvas.width * canvas.height
      const luminances = new Uint8ClampedArray(numPixels)
      for (let i = 0; i < numPixels; i++) {
        const offset = i * 4
        const r = rgba[offset]
        const g = rgba[offset + 1]
        const b = rgba[offset + 2]
        // Green-weighted luminance (matches human perception)
        luminances[i] = ((r + (g << 1) + b) >> 2) & 0xFF
      }

      try {
        // Convert to zxing luminance source (now properly 1 byte per pixel)
        const luminanceSource = new RGBLuminanceSource(
          luminances,
          canvas.width,
          canvas.height,
        )
        const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource))

        // Decode
        const result = reader.decodeWithState(binaryBitmap)
        const text = result.getText()
        const format = result.getBarcodeFormat()

        // Code is visible — reset visibility timeout
        setIsCodeVisible(true)
        if (visibilityTimerRef.current) {
          clearTimeout(visibilityTimerRef.current)
          visibilityTimerRef.current = null
        }

        // Deduplication: same code as last scan → skip (no history entry, no callback)
        if (text === lastScannedCodeRef.current) {
          return
        }

        // New scan — parse and update state
        const scanFormat = toScanFormat(format)
        const scannedOrder = parseTrackingCode(text, scanFormat)

        lastScannedCodeRef.current = text

        setLastScan(scannedOrder)
        setScanCount((prev) => prev + 1)
        setScanHistory((prev) => [scannedOrder, ...prev].slice(0, maxHistory))

        // Notify consumer (e.g. trigger beep)
        onScan?.(scannedOrder)
      } catch (err) {
        // NotFoundException is expected when no code is found in frame
        if (err instanceof NotFoundException) {
          // Start visibility timeout: if no decode for VISIBILITY_TIMEOUT_MS → not visible
          if (!visibilityTimerRef.current) {
            visibilityTimerRef.current = setTimeout(() => {
              setIsCodeVisible(false)
              visibilityTimerRef.current = null
            }, VISIBILITY_TIMEOUT_MS)
          }
        } else {
          // Log unexpected errors but don't crash the scan loop
          console.warn('[useQRScanner] Decode error:', err)
        }
      }
    }, scanIntervalMs)

    return () => {
      clearInterval(intervalId)
      setIsScanning(false)
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current)
        visibilityTimerRef.current = null
      }
    }
  }, [enabled, scanIntervalMs, maxHistory, onScan, videoRef])

  return {
    lastScan,
    isScanning,
    scanCount,
    scanHistory,
    isCodeVisible,
    reset,
  }
}

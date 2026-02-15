/**
 * CameraFeed — Live camera stream display component
 *
 * Renders a <video> element with a live MediaStream, or shows
 * appropriate placeholder/error states. Supports scanner and
 * recorder visual modes with distinct overlays.
 *
 * Recording controls are NOT included here — they belong to
 * Feature 3 (Video Recording).
 *
 * @example
 * <CameraFeed
 *   stream={mediaStream}
 *   role="scanner"
 *   label="Camera 1 — Quét mã"
 *   status="active"
 * />
 */

import { useRef, useEffect } from 'react'
import {
  Camera,
  Wifi,
  WifiOff,
  Circle,
  Loader2,
  VideoOff,
} from 'lucide-react'
import type { CameraRole, CameraStatus } from '../types/camera'

interface CameraFeedProps {
  /** Live camera stream (null when not connected) */
  stream: MediaStream | null
  /** Camera role determines visual overlays */
  role: CameraRole
  /** Display label (Vietnamese) */
  label: string
  /** Current camera status */
  status: CameraStatus
  /** Optional: span full width (single-camera mode) */
  fullWidth?: boolean
  /** Optional: callback to receive the <video> element ref (for QR scanning) */
  onVideoRef?: (el: HTMLVideoElement | null) => void
}

export function CameraFeed({ stream, role, label, status, fullWidth = false, onVideoRef }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // ─── Bind MediaStream to <video> element ────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (stream) {
      video.srcObject = stream
    } else {
      video.srcObject = null
    }

    // Expose video element to parent (for QR scanning)
    onVideoRef?.(video)

    return () => {
      if (video) video.srcObject = null
      onVideoRef?.(null)
    }
  }, [stream, onVideoRef])

  const isActive = status === 'active'
  const isError = status === 'error' || status === 'permission_denied'

  return (
    <div className={`bg-surface-900 rounded-xl border border-surface-800 overflow-hidden group ${fullWidth ? 'col-span-2' : ''}`}>
      {/* Camera viewport */}
      <div className="aspect-video bg-surface-950 relative flex items-center justify-center overflow-hidden">
        {/* Live video feed */}
        {stream && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* State overlays — shown when no stream */}
        {!stream && (
          <>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.3)_0%,_transparent_70%)]" />

            {/* Loading state */}
            {status === 'idle' && (
              <div className="text-center z-10">
                <Camera className="w-10 h-10 text-surface-700 mx-auto mb-2" />
                <p className="text-surface-600 text-xs">Chưa kết nối camera</p>
              </div>
            )}

            {/* Connecting state */}
            {status === 'active' && (
              <div className="text-center z-10">
                <Loader2 className="w-10 h-10 text-surface-500 mx-auto mb-2 animate-spin" />
                <p className="text-surface-500 text-xs">Đang kết nối camera...</p>
              </div>
            )}

            {/* Error state */}
            {isError && (
              <div className="text-center z-10">
                <VideoOff className="w-10 h-10 text-danger-500 mx-auto mb-2" />
                <p className="text-danger-400 text-xs font-medium">
                  {status === 'permission_denied'
                    ? 'Không có quyền truy cập camera'
                    : 'Không thể kết nối camera'}
                </p>
                <p className="text-surface-600 text-[11px] mt-1">
                  {status === 'permission_denied'
                    ? 'Vui lòng cấp quyền trong cài đặt hệ thống'
                    : 'Kiểm tra kết nối và thử lại'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Top-left: Connection badge */}
        <div className="absolute top-3 left-3 z-20">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase
            ${isActive && stream
              ? 'bg-success-500/20 text-success-400'
              : isError
                ? 'bg-danger-500/20 text-danger-400'
                : 'bg-surface-800/80 text-surface-500'
            }`}>
            {isActive && stream ? (
              <>
                <Wifi className="w-3 h-3" />
                Live
              </>
            ) : isError ? (
              <>
                <WifiOff className="w-3 h-3" />
                Lỗi
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                Offline
              </>
            )}
          </span>
        </div>

        {/* Top-right: Recorder standby badge */}
        {role === 'recorder' && (
          <div className="absolute top-3 right-3 z-20">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-900/70 text-surface-400 text-[10px] font-mono uppercase tracking-wider">
              <Circle className="w-2.5 h-2.5 text-surface-600" />
              Standby
            </span>
          </div>
        )}

        {/* Scanner crosshair overlay */}
        {role === 'scanner' && (
          <div className="absolute inset-8 border-2 border-dashed border-white/20 rounded-lg z-10 pointer-events-none" />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-surface-800">
        <span className="text-xs text-surface-400 font-medium">{label}</span>
        {/* Recording controls intentionally omitted — deferred to Feature 3 */}
      </div>
    </div>
  )
}

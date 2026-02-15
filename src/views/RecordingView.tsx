/**
 * RecordingView — Main recording page with live camera feeds
 *
 * Wires useCamera + useCameraSettings + CameraFeed together.
 * Handles:
 * - Loading saved camera assignments
 * - Acquiring streams for assigned cameras
 * - Single-camera mode (1 feed spanning 2 cols)
 * - Hot-plug via useCamera's devicechange listener
 * - Permission flow with clear messaging
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Video, Clock, ChevronRight,
  Scan, CheckCircle2,
  AlertTriangle, Trash2, Play,
  Info, ShieldAlert,
} from 'lucide-react'
import { ProductList } from '../modules/_example/presentation/components/ProductList'
import { CameraFeed } from '../shared/components/CameraFeed'
import { useCamera } from '../shared/hooks/useCamera'
import { useCameraSettings } from '../shared/hooks/useCameraSettings'
import type { CameraStatus } from '../shared/types/camera'

export function RecordingView() {
  const {
    devices,
    permission,
    isLoading: isLoadingDevices,
    requestPermission,
    requestStream,
    releaseStream,
  } = useCamera()

  const {
    assignments,
    isLoading: isLoadingSettings,
  } = useCameraSettings(devices)

  // ─── Stream state ───────────────────────────────────────────
  const [scannerStream, setScannerStream] = useState<MediaStream | null>(null)
  const [recorderStream, setRecorderStream] = useState<MediaStream | null>(null)
  const [scannerStatus, setScannerStatus] = useState<CameraStatus>('idle')
  const [recorderStatus, setRecorderStatus] = useState<CameraStatus>('idle')

  const isSingleCamera = assignments.scanner !== null
    && assignments.scanner === assignments.recorder

  // ─── Acquire streams when assignments change ────────────────
  const acquireStream = useCallback(async (
    deviceId: string | null,
    setStream: (s: MediaStream | null) => void,
    setStatus: (s: CameraStatus) => void,
    oldStream: MediaStream | null,
  ) => {
    // Release old stream
    if (oldStream) {
      releaseStream(oldStream)
      setStream(null)
    }

    if (!deviceId) {
      setStatus('idle')
      return
    }

    setStatus('active') // show "connecting" state
    try {
      const stream = await requestStream(deviceId)
      setStream(stream)
      setStatus('active')
    } catch (err) {
      console.error('[RecordingView] Stream error:', err)
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setStatus('permission_denied')
      } else {
        setStatus('error')
      }
      setStream(null)
    }
  }, [requestStream, releaseStream])

  // Acquire scanner stream
  useEffect(() => {
    if (isLoadingSettings || permission !== 'granted') return

    acquireStream(assignments.scanner, setScannerStream, setScannerStatus, scannerStream)

    // Only re-run when assignment or permission changes, not when stream changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments.scanner, permission, isLoadingSettings])

  // Acquire recorder stream (skip if same device as scanner)
  useEffect(() => {
    if (isLoadingSettings || permission !== 'granted') return

    if (isSingleCamera) {
      // In single-camera mode, reuse scanner stream reference visually
      setRecorderStatus(scannerStatus)
      return
    }

    acquireStream(assignments.recorder, setRecorderStream, setRecorderStatus, recorderStream)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments.recorder, permission, isLoadingSettings, isSingleCamera])

  // ─── Cleanup on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (scannerStream) releaseStream(scannerStream)
      if (recorderStream) releaseStream(recorderStream)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Derived state ─────────────────────────────────────────
  const isLoading = isLoadingDevices || isLoadingSettings
  const noDevices = !isLoading && devices.length === 0 && permission === 'granted'
  const needsPermission = permission === 'denied' || permission === 'prompt'

  return (
    <>
      {/* Permission banner */}
      {needsPermission && permission !== 'denied' && (
        <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-primary-300 text-sm font-medium">Cần cấp quyền camera</p>
              <p className="text-primary-400/70 text-xs mt-1">
                Cho phép ứng dụng truy cập camera để hiển thị video trực tiếp.
              </p>
              <button
                onClick={requestPermission}
                className="mt-3 px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
              >
                Cấp quyền camera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission denied banner */}
      {permission === 'denied' && (
        <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-danger-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-danger-300 text-sm font-medium">Quyền camera bị từ chối</p>
              <p className="text-danger-400/70 text-xs mt-1">
                Vui lòng cấp quyền camera trong Cài đặt hệ thống &gt; Quyền riêng tư &gt; Camera
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Camera grid + Info panel */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {/* Single-camera mode: 1 large feed */}
        {isSingleCamera ? (
          <>
            <CameraFeed
              stream={scannerStream}
              role="scanner"
              label={`Camera — Quét mã & Ghi hình`}
              status={scannerStatus}
              fullWidth
            />
            {/* Info panel (same column layout, takes 1 col) */}
            <InfoPanel />
          </>
        ) : (
          <>
            {/* Camera 1 - Scanner */}
            <CameraFeed
              stream={scannerStream}
              role="scanner"
              label="Camera 1 — Quét mã"
              status={scannerStatus}
            />
            {/* Camera 2 - Recorder */}
            <CameraFeed
              stream={isSingleCamera ? scannerStream : recorderStream}
              role="recorder"
              label="Camera 2 — Ghi hình"
              status={recorderStatus}
            />
            {/* Info panel */}
            <InfoPanel />
          </>
        )}
      </div>

      {/* Single-camera mode indicator */}
      {isSingleCamera && (
        <div className="bg-warning-500/10 border border-warning-500/20 rounded-xl px-4 py-3 mb-6">
          <p className="text-warning-400 text-xs font-medium">
            Chế độ 1 camera — cùng camera quét mã và ghi hình
          </p>
        </div>
      )}

      {/* No devices warning */}
      {noDevices && (
        <div className="bg-surface-900 border border-surface-800 rounded-xl px-4 py-3 mb-6">
          <p className="text-surface-400 text-xs">
            Không tìm thấy camera nào. Vui lòng kết nối camera và thử lại.
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Video className="w-5 h-5" />}
          label="Hôm nay"
          value="24"
          subtitle="video đã quay"
          color="primary"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Thành công"
          value="98%"
          subtitle="tỉ lệ hoàn thành"
          color="success"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Trung bình"
          value="1:42"
          subtitle="thời gian / video"
          color="primary"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Sắp hết hạn"
          value="12"
          subtitle="video (7 ngày)"
          color="warning"
        />
      </div>

      {/* Recent recordings table */}
      <div className="bg-surface-900 rounded-xl border border-surface-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
          <h3 className="text-surface-100 font-semibold text-sm">Video gần đây</h3>
          <button className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 cursor-pointer transition-colors">
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="divide-y divide-surface-800">
          <RecordingRow orderId="SPXVN042891523" time="14:32" duration="1:28" size="45.2 MB" status="saved" />
          <RecordingRow orderId="SPXVN042891498" time="14:29" duration="2:15" size="68.1 MB" status="saved" />
          <RecordingRow orderId="SPXVN042891467" time="14:25" duration="0:55" size="28.7 MB" status="saved" />
          <RecordingRow orderId="SPXVN042891443" time="14:21" duration="1:42" size="52.3 MB" status="expired_soon" />
          <RecordingRow orderId="SPXVN042891412" time="14:17" duration="1:18" size="39.8 MB" status="saved" />
        </div>
      </div>

      {/* Clean Architecture Example Module */}
      <div className="mt-6">
        <ProductList />
      </div>
    </>
  )
}

// ─── Sub-components ──────────────────────────────────────────

function InfoPanel() {
  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800 p-5 flex flex-col">
      <h3 className="text-surface-300 text-xs font-medium uppercase tracking-wider mb-4">
        Đơn hàng hiện tại
      </h3>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-surface-800 rounded-2xl flex items-center justify-center mb-4">
          <Scan className="w-8 h-8 text-surface-500" />
        </div>
        <p className="text-surface-400 text-sm mb-1">Chưa quét mã QR</p>
        <p className="text-surface-600 text-xs">Đưa mã vận đơn vào Camera 1 để bắt đầu</p>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, subtitle, color }: {
  icon: React.ReactNode
  label: string
  value: string
  subtitle: string
  color: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const colorMap = {
    primary: { bg: 'bg-primary-500/10', text: 'text-primary-400', icon: 'text-primary-400' },
    success: { bg: 'bg-success-500/10', text: 'text-success-400', icon: 'text-success-400' },
    warning: { bg: 'bg-warning-500/10', text: 'text-warning-400', icon: 'text-warning-400' },
    danger: { bg: 'bg-danger-500/10', text: 'text-danger-400', icon: 'text-danger-400' },
  }
  const c = colorMap[color]

  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800 p-4 hover:border-surface-700 transition-colors cursor-default">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
        <span className="text-surface-400 text-xs font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${c.text} font-mono`}>{value}</p>
      <p className="text-surface-500 text-xs mt-0.5">{subtitle}</p>
    </div>
  )
}

function RecordingRow({ orderId, time, duration, size, status }: {
  orderId: string
  time: string
  duration: string
  size: string
  status: 'saved' | 'recording' | 'expired_soon'
}) {
  const statusConfig = {
    saved: { label: 'Đã lưu', cls: 'text-success-400 bg-success-500/10' },
    recording: { label: 'Đang quay', cls: 'text-danger-400 bg-danger-500/10' },
    expired_soon: { label: 'Sắp hết hạn', cls: 'text-warning-400 bg-warning-500/10' },
  }
  const s = statusConfig[status]

  return (
    <div className="flex items-center px-5 py-3.5 hover:bg-surface-800/50 transition-colors group/row">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 bg-surface-800 rounded-lg flex items-center justify-center shrink-0">
          <Video className="w-4 h-4 text-surface-500" />
        </div>
        <div className="min-w-0">
          <p className="text-surface-200 text-sm font-mono font-medium truncate">{orderId}</p>
          <p className="text-surface-500 text-xs">Hôm nay, {time}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-surface-400 text-xs font-mono w-12 text-right">{duration}</span>
        <span className="text-surface-500 text-xs font-mono w-16 text-right">{size}</span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${s.cls} w-24 text-center`}>
          {s.label}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button className="p-1.5 hover:bg-surface-700 rounded-md text-surface-400 hover:text-surface-200 cursor-pointer transition-colors" title="Phát">
            <Play className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 hover:bg-surface-700 rounded-md text-surface-400 hover:text-danger-400 cursor-pointer transition-colors" title="Xóa">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

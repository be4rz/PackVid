/**
 * Settings — App configuration page
 *
 * First section: Camera Configuration (from Dual Camera Display feature).
 * Future sections: Storage, Video Lifecycle, etc.
 *
 * Uses useCamera and useCameraSettings hooks for live device management.
 */

import {
  Camera,
  ArrowLeftRight,
  HardDrive,
  Clock,
  ChevronDown,
  RefreshCw,
  Info,
  Volume2,
} from 'lucide-react'
import { useCamera } from '../shared/hooks/useCamera'
import { useCameraSettings } from '../shared/hooks/useCameraSettings'
import { useTTS } from '../shared/hooks/useTTS'
import { getVietnameseVoices, getAvailableVoices } from '../shared/lib/tts'
import { CameraFeed } from '../shared/components/CameraFeed'
import { StorageSettings } from '../modules/video-storage/presentation/components/StorageSettings'
import { LifecycleSettings } from '../modules/video-storage/presentation/components/LifecycleSettings'
import type { CameraRole } from '../shared/types/camera'
import { useState, useEffect } from 'react'

export function Settings() {
  const { devices, permission, isLoading: isLoadingDevices, requestPermission, requestStream, releaseStream, refreshDevices } = useCamera()
  const { assignments, isLoading: isLoadingSettings, assignCamera, swapCameras } = useCameraSettings(devices)
  const { speak, isReady: isTTSReady, config: ttsConfig, updateConfig: updateTTSConfig } = useTTS()

  // Track streams for preview thumbnails
  const [scannerStream, setScannerStream] = useState<MediaStream | null>(null)
  const [recorderStream, setRecorderStream] = useState<MediaStream | null>(null)

  // Acquire preview streams when assignments change
  useEffect(() => {
    let cancelled = false

    async function acquireStreams() {
      // Release old streams
      if (scannerStream) releaseStream(scannerStream)
      if (recorderStream) releaseStream(recorderStream)

      if (!cancelled && assignments.scanner) {
        try {
          const stream = await requestStream(assignments.scanner)
          if (!cancelled) setScannerStream(stream)
        } catch {
          if (!cancelled) setScannerStream(null)
        }
      } else {
        setScannerStream(null)
      }

      // If same device for both roles, reuse the scanner stream
      if (!cancelled && assignments.recorder) {
        if (assignments.recorder === assignments.scanner && scannerStream) {
          // Don't acquire a second stream for the same device
          setRecorderStream(null)
        } else {
          try {
            const stream = await requestStream(assignments.recorder)
            if (!cancelled) setRecorderStream(stream)
          } catch {
            if (!cancelled) setRecorderStream(null)
          }
        }
      } else {
        setRecorderStream(null)
      }
    }

    if (permission === 'granted' && !isLoadingSettings) {
      acquireStreams()
    }

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments.scanner, assignments.recorder, permission, isLoadingSettings])

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      if (scannerStream) releaseStream(scannerStream)
      if (recorderStream) releaseStream(recorderStream)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isLoading = isLoadingDevices || isLoadingSettings
  const isSingleCamera = assignments.scanner === assignments.recorder && assignments.scanner !== null

  return (
    <div className="max-w-4xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-surface-50 text-xl font-bold">Cài đặt</h1>
        <p className="text-surface-500 text-sm mt-1">Quản lý camera, lưu trữ và cài đặt ứng dụng</p>
      </div>

      {/* Camera Configuration Section */}
      <SettingsSection
        icon={<Camera className="w-5 h-5" />}
        title="Camera"
        description="Chọn camera cho quét mã và ghi hình"
      >
        {/* Permission prompt */}
        {permission !== 'granted' && (
          <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4 mb-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-primary-300 text-sm font-medium">Cần cấp quyền camera</p>
                <p className="text-primary-400/70 text-xs mt-1">
                  Ứng dụng cần quyền truy cập camera để hiển thị danh sách thiết bị.
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

        {/* Camera selectors */}
        <div className="space-y-4">
          {/* Scanner select */}
          <CameraSelector
            role="scanner"
            label="Camera quét mã"
            selectedDeviceId={assignments.scanner}
            devices={devices}
            onChange={(deviceId) => assignCamera('scanner', deviceId)}
            disabled={isLoading || permission !== 'granted'}
          />

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              onClick={swapCameras}
              disabled={isLoading || !assignments.scanner || !assignments.recorder || isSingleCamera}
              className="p-2 bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-surface-200 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Hoán đổi camera"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Recorder select */}
          <CameraSelector
            role="recorder"
            label="Camera ghi hình"
            selectedDeviceId={assignments.recorder}
            devices={devices}
            onChange={(deviceId) => assignCamera('recorder', deviceId)}
            disabled={isLoading || permission !== 'granted'}
          />
        </div>

        {/* Single camera mode indicator */}
        {isSingleCamera && (
          <div className="mt-4 bg-warning-500/10 border border-warning-500/20 rounded-lg px-4 py-3">
            <p className="text-warning-400 text-xs font-medium">
              Chế độ 1 camera — cùng thiết bị cho cả quét mã và ghi hình
            </p>
          </div>
        )}

        {/* Preview thumbnails */}
        {permission === 'granted' && (assignments.scanner || assignments.recorder) && (
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-surface-500 text-[11px] font-medium uppercase tracking-wider mb-2">Quét mã</p>
              <CameraFeed
                stream={scannerStream}
                role="scanner"
                label={getDeviceLabel(assignments.scanner, devices)}
                status={scannerStream ? 'active' : 'idle'}
              />
            </div>
            <div>
              <p className="text-surface-500 text-[11px] font-medium uppercase tracking-wider mb-2">Ghi hình</p>
              <CameraFeed
                stream={isSingleCamera ? scannerStream : recorderStream}
                role="recorder"
                label={getDeviceLabel(assignments.recorder, devices)}
                status={(isSingleCamera ? scannerStream : recorderStream) ? 'active' : 'idle'}
              />
            </div>
          </div>
        )}

        {/* Refresh devices button */}
        {permission === 'granted' && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={refreshDevices}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-surface-400 hover:text-surface-200 bg-surface-800 hover:bg-surface-700 rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới danh sách
            </button>
          </div>
        )}
      </SettingsSection>

      {/* TTS Settings */}
      <SettingsSection
        icon={<Volume2 className="w-5 h-5" />}
        title="Thông báo giọng nói"
        description="Cài đặt phản hồi bằng giọng nói khi ghi hình"
      >
        <div className="space-y-5">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-surface-200 text-sm font-medium">Bật thông báo giọng nói</p>
              <p className="text-surface-500 text-xs mt-0.5">Phát giọng nói khi bắt đầu, dừng, hoặc hủy ghi hình</p>
            </div>
            <button
              onClick={() => updateTTSConfig({ enabled: !ttsConfig.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                ttsConfig.enabled ? 'bg-primary-500' : 'bg-surface-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  ttsConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Voice Selector */}
          <div className={ttsConfig.enabled ? '' : 'opacity-40 pointer-events-none'}>
            <label className="block text-surface-200 text-sm font-medium mb-2">Giọng nói</label>
            <div className="relative">
              <select
                value={ttsConfig.voiceURI ?? ''}
                onChange={(e) => updateTTSConfig({ voiceURI: e.target.value || null })}
                disabled={!ttsConfig.enabled || !isTTSReady}
                className="w-full bg-surface-800 border border-surface-700 text-surface-200 text-sm rounded-lg px-3 py-2.5 pr-8
                  appearance-none cursor-pointer transition-colors
                  hover:border-surface-600 focus:border-primary-500 focus:outline-none
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">Tự động (Tiếng Việt)</option>
                {getVietnameseVoices().length > 0 && (
                  <optgroup label="Tiếng Việt">
                    {getVietnameseVoices().map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </optgroup>
                )}
                {getAvailableVoices().filter((v) => !v.lang.startsWith('vi')).length > 0 && (
                  <optgroup label="Ngôn ngữ khác">
                    {getAvailableVoices()
                      .filter((v) => !v.lang.startsWith('vi'))
                      .map((voice) => (
                        <option key={voice.voiceURI} value={voice.voiceURI}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
            </div>
          </div>

          {/* Rate Slider */}
          <div className={ttsConfig.enabled ? '' : 'opacity-40 pointer-events-none'}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-surface-200 text-sm font-medium">Tốc độ giọng nói</label>
              <span className="text-surface-400 text-xs font-mono">{ttsConfig.rate.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-surface-500 text-xs">Chậm</span>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={ttsConfig.rate}
                onChange={(e) => updateTTSConfig({ rate: parseFloat(e.target.value) })}
                disabled={!ttsConfig.enabled}
                className="flex-1 h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500
                  [&::-webkit-slider-thumb]:cursor-pointer
                  disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <span className="text-surface-500 text-xs">Nhanh</span>
            </div>
          </div>

          {/* Volume Slider */}
          <div className={ttsConfig.enabled ? '' : 'opacity-40 pointer-events-none'}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-surface-200 text-sm font-medium">Âm lượng</label>
              <span className="text-surface-400 text-xs font-mono">{Math.round(ttsConfig.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ttsConfig.volume}
              onChange={(e) => updateTTSConfig({ volume: parseFloat(e.target.value) })}
              disabled={!ttsConfig.enabled}
              className="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500
                [&::-webkit-slider-thumb]:cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Test Button */}
          <div className="pt-2">
            <button
              onClick={() => speak('Đây là giọng nói mẫu')}
              disabled={!ttsConfig.enabled || !isTTSReady}
              className="w-full px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg
                transition-colors cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-500"
            >
              Thử giọng nói
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Storage settings */}
      <SettingsSection
        icon={<HardDrive className="w-5 h-5" />}
        title="Lưu trữ"
        description="Quản lý vị trí lưu video và dung lượng"
      >
        <StorageSettings />
      </SettingsSection>

      {/* Video lifecycle */}
      <SettingsSection
        icon={<Clock className="w-5 h-5" />}
        title="Vòng đời video"
        description="Tự động nén video cũ để tiết kiệm dung lượng"
      >
        <LifecycleSettings />
      </SettingsSection>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────

function SettingsSection({
  icon,
  title,
  description,
  children,
  placeholder = false,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children?: React.ReactNode
  placeholder?: boolean
}) {
  return (
    <section className="mb-6">
      <div className="bg-surface-900 rounded-xl border border-surface-800">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-800">
          <div className="text-surface-400">{icon}</div>
          <div>
            <h3 className="text-surface-100 font-semibold text-sm">{title}</h3>
            <p className="text-surface-500 text-xs mt-0.5">{description}</p>
          </div>
        </div>
        <div className="p-5">
          {placeholder ? (
            <p className="text-surface-600 text-sm text-center py-6">Sẽ có trong phiên bản tiếp theo</p>
          ) : (
            children
          )}
        </div>
      </div>
    </section>
  )
}

function CameraSelector({
  role,
  label,
  selectedDeviceId,
  devices,
  onChange,
  disabled,
}: {
  role: CameraRole
  label: string
  selectedDeviceId: string | null
  devices: { deviceId: string; label: string }[]
  onChange: (deviceId: string | null) => void
  disabled: boolean
}) {
  const roleColor = role === 'scanner' ? 'primary' : 'success'
  const badgeBg = role === 'scanner' ? 'bg-primary-500/10 text-primary-400' : 'bg-success-500/10 text-success-400'

  return (
    <div className="flex items-center gap-4">
      <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded ${badgeBg} shrink-0 w-20 text-center`}>
        {role === 'scanner' ? 'Quét mã' : 'Ghi hình'}
      </span>
      <div className="flex-1 relative">
        <select
          value={selectedDeviceId ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={`w-full bg-surface-800 border border-surface-700 text-surface-200 text-sm rounded-lg px-3 py-2.5 pr-8
            appearance-none cursor-pointer transition-colors
            hover:border-surface-600 focus:border-${roleColor}-500 focus:outline-none
            disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <option value="">— Chọn camera —</option>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

function getDeviceLabel(deviceId: string | null, devices: { deviceId: string; label: string }[]): string {
  if (!deviceId) return 'Chưa chọn'
  const device = devices.find((d) => d.deviceId === deviceId)
  return device?.label ?? 'Camera không xác định'
}

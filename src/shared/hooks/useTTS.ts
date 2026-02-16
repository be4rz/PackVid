/**
 * useTTS — Text-to-Speech hook with settings persistence
 *
 * Wraps the TTS utility with user settings loaded from the app_settings table.
 * Provides a simple `speak()` function that applies saved preferences.
 *
 * Settings are stored as individual keys:
 * - tts_enabled: Whether TTS is enabled (default: true)
 * - tts_voice_uri: Selected voice URI (default: null = first Vietnamese voice)
 * - tts_rate: Speech rate 0.5-2.0 (default: 1.0)
 * - tts_volume: Volume 0-1.0 (default: 0.8)
 *
 * @example
 * const { speak, isTTSEnabled, config, updateConfig } = useTTS()
 * speak('Bắt đầu ghi hình')
 * updateConfig({ rate: 1.5 })
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { speak as speakTTS, getVietnameseVoices, getAvailableVoices } from '../lib/tts'
import type { TTSOptions } from '../lib/tts'

// ─── Types ─────────────────────────────────────────────────────

export interface TTSConfig {
  enabled: boolean
  voiceURI: string | null
  rate: number
  volume: number
}

export interface UseTTSReturn {
  /** Speak text with saved settings applied */
  speak: (text: string) => void
  /** Whether TTS is enabled */
  isTTSEnabled: boolean
  /** Whether voices are loaded and ready */
  isReady: boolean
  /** Current TTS configuration */
  config: TTSConfig
  /** Update TTS configuration and persist to settings */
  updateConfig: (updates: Partial<TTSConfig>) => Promise<void>
}

// ─── Constants ─────────────────────────────────────────────────

const DEFAULT_CONFIG: TTSConfig = {
  enabled: true,
  voiceURI: null,
  rate: 1.0,
  volume: 0.8,
}

// ─── Hook ──────────────────────────────────────────────────────

export function useTTS(): UseTTSReturn {
  const [config, setConfig] = useState<TTSConfig>(DEFAULT_CONFIG)
  const [isReady, setIsReady] = useState(false)

  // ─── Load settings on mount ────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function loadConfig() {
      try {
        // Load individual settings
        const enabled = await window.api.settings.get('tts_enabled') as boolean | null
        const voiceURI = await window.api.settings.get('tts_voice_uri') as string | null
        const rate = await window.api.settings.get('tts_rate') as number | null
        const volume = await window.api.settings.get('tts_volume') as number | null

        if (!cancelled) {
          setConfig({
            enabled: enabled ?? DEFAULT_CONFIG.enabled,
            voiceURI: voiceURI ?? DEFAULT_CONFIG.voiceURI,
            rate: rate ?? DEFAULT_CONFIG.rate,
            volume: volume ?? DEFAULT_CONFIG.volume,
          })
        }
      } catch (err) {
        console.error('[useTTS] Failed to load TTS config:', err)
      }
    }

    loadConfig()
    return () => { cancelled = true }
  }, [])

  // ─── Wait for voices to load ───────────────────────────────

  useEffect(() => {
    const checkVoices = () => {
      const voices = getAvailableVoices()
      if (voices.length > 0) {
        setIsReady(true)
      }
    }

    // Check immediately
    checkVoices()

    // Also listen for voiceschanged event
    if (!isReady && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', checkVoices)
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', checkVoices)
      }
    }
  }, [isReady])

  // ─── Memoize voice selection ───────────────────────────────

  const selectedVoice = useMemo(() => {
    if (!isReady) return null

    // If user has selected a voice, use it
    if (config.voiceURI) {
      const voice = getAvailableVoices().find((v) => v.voiceURI === config.voiceURI)
      if (voice) return voice
    }

    // Otherwise, try to find a Vietnamese voice
    const vietnameseVoices = getVietnameseVoices()
    if (vietnameseVoices.length > 0) {
      return vietnameseVoices[0]
    }

    // Fallback to first available voice
    const allVoices = getAvailableVoices()
    return allVoices.length > 0 ? allVoices[0] : null
  }, [config.voiceURI, isReady])

  // ─── Update config ─────────────────────────────────────────

  const updateConfig = useCallback(async (updates: Partial<TTSConfig>) => {
    try {
      // Update local state immediately for UI responsiveness
      setConfig((prev) => ({ ...prev, ...updates }))

      // Persist each changed setting
      if (updates.enabled !== undefined) {
        await window.api.settings.set('tts_enabled', updates.enabled)
      }
      if (updates.voiceURI !== undefined) {
        await window.api.settings.set('tts_voice_uri', updates.voiceURI)
      }
      if (updates.rate !== undefined) {
        await window.api.settings.set('tts_rate', updates.rate)
      }
      if (updates.volume !== undefined) {
        await window.api.settings.set('tts_volume', updates.volume)
      }
    } catch (err) {
      console.error('[useTTS] Failed to update TTS config:', err)
    }
  }, [])

  // ─── Speak function ────────────────────────────────────────

  const speak = useCallback((text: string) => {
    if (!config.enabled) return

    const options: TTSOptions = {
      voice: selectedVoice,
      rate: config.rate,
      volume: config.volume,
    }

    speakTTS(text, options)
  }, [config.enabled, config.rate, config.volume, selectedVoice])

  return {
    speak,
    isTTSEnabled: config.enabled,
    isReady,
    config,
    updateConfig,
  }
}

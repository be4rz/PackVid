/**
 * Text-to-Speech utilities for voice notifications
 *
 * Uses the Web Speech API (SpeechSynthesis) to provide Vietnamese
 * voice feedback during the recording flow.
 *
 * Key features:
 * - Lazy voice loading (handles Chromium's async voiceschanged event)
 * - Silent error handling (TTS failures never break recording flow)
 * - Vietnamese voice filtering with fallback to default
 * - Defensive coding: checks API availability before use
 *
 * @example
 * speak('Bắt đầu ghi hình', { rate: 1.0, volume: 0.8 })
 */

// ─── Types ─────────────────────────────────────────────────────

export interface TTSOptions {
  voice?: SpeechSynthesisVoice | null
  rate?: number    // 0.5 - 2.0, default 1.0
  pitch?: number   // 0 - 2.0, default 1.0
  volume?: number  // 0 - 1.0, default 0.8
}

// ─── State ─────────────────────────────────────────────────────

let voicesLoaded = false
let availableVoices: SpeechSynthesisVoice[] = []

// ─── Voice Loading ─────────────────────────────────────────────

/**
 * Initialize voice list (handles async loading in Chromium)
 *
 * Chromium loads voices asynchronously and fires a 'voiceschanged' event
 * when ready. We need to handle this to get the full voice list.
 */
function initVoices(): void {
  if (!window.speechSynthesis) return

  const loadVoices = () => {
    availableVoices = window.speechSynthesis.getVoices()
    if (availableVoices.length > 0) {
      voicesLoaded = true
    }
  }

  // Load immediately (works in Firefox)
  loadVoices()

  // Also listen for voiceschanged event (Chromium)
  if (!voicesLoaded) {
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true })
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initVoices()
}

// ─── Public API ────────────────────────────────────────────────

/**
 * Get all available voices
 *
 * Returns an empty array if the API is unavailable or voices haven't loaded yet.
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!voicesLoaded) {
    initVoices()
  }
  return availableVoices
}

/**
 * Get Vietnamese voices (lang starts with 'vi')
 *
 * Filters available voices by Vietnamese language code.
 * Returns empty array if no Vietnamese voices are available.
 */
export function getVietnameseVoices(): SpeechSynthesisVoice[] {
  return getAvailableVoices().filter((voice) => voice.lang.startsWith('vi'))
}

/**
 * Cancel current speech utterance
 *
 * Stops any currently playing TTS. Safe to call even if nothing is playing.
 */
export function cancelSpeech(): void {
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  } catch {
    // Silently ignore — TTS is non-critical
  }
}

/**
 * Speak text using Web Speech API
 *
 * Plays the given text with optional voice, rate, pitch, and volume settings.
 * Errors are silently caught to ensure TTS failures never break the app.
 *
 * @param text - Text to speak
 * @param options - Optional TTS settings (voice, rate, pitch, volume)
 *
 * @example
 * speak('Bắt đầu ghi hình', { rate: 1.0, volume: 0.8 })
 */
export function speak(text: string, options?: TTSOptions): void {
  try {
    // Check API availability
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      console.warn('[TTS] SpeechSynthesis API not available')
      return
    }

    // Ensure voices are loaded
    if (!voicesLoaded) {
      initVoices()
    }

    // Cancel any ongoing speech
    cancelSpeech()

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text)

    // Apply options
    if (options?.voice) {
      utterance.voice = options.voice
    }
    if (options?.rate !== undefined) {
      utterance.rate = Math.max(0.5, Math.min(2.0, options.rate))
    }
    if (options?.pitch !== undefined) {
      utterance.pitch = Math.max(0, Math.min(2.0, options.pitch))
    }
    if (options?.volume !== undefined) {
      utterance.volume = Math.max(0, Math.min(1.0, options.volume))
    }

    // Speak
    window.speechSynthesis.speak(utterance)
  } catch (err) {
    // Silently ignore — TTS is non-critical feedback
    console.warn('[TTS] Speech failed:', err)
  }
}

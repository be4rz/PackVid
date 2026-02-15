/**
 * Audio utilities for scan feedback
 *
 * Uses the Web Audio API to generate short beep sounds.
 * AudioContext is lazily created on first use to comply
 * with browser autoplay policies (requires user gesture).
 */

let audioCtx: AudioContext | null = null

/**
 * Play a short beep sound (220Hz sine wave, 200ms)
 *
 * Safe to call repeatedly — creates a new oscillator each time.
 * If the AudioContext cannot be created (e.g. no audio device),
 * the error is silently caught.
 */
export function playBeep(
  frequency = 220,
  durationMs = 200,
  volume = 0.3,
): void {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext()
    }

    // Resume if suspended (happens after page load before user gesture)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }

    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime)

    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime)
    // Fade out to avoid click/pop
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + durationMs / 1000,
    )

    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    oscillator.start(audioCtx.currentTime)
    oscillator.stop(audioCtx.currentTime + durationMs / 1000)
  } catch {
    // Silently ignore — audio is non-critical feedback
  }
}

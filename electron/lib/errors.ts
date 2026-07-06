/**
 * Error helpers — shared across the Electron main process.
 *
 * Centralizes the two error idioms that were previously copy-pasted:
 *  - `toErrorMessage` — safe extraction of a human-readable message from an
 *    `unknown` catch binding.
 *  - `isNativeModuleAbiError` — the heuristic for detecting a native-addon
 *    ABI mismatch (better-sqlite3 built against the wrong Node/Electron ABI).
 */

/** Extract a readable message from an unknown thrown value. */
export function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Detect a native-module ABI mismatch (e.g. better-sqlite3 compiled against a
 * different NODE_MODULE_VERSION than Electron's bundled Node).
 *
 * Node reports these as an `ERR_DLOPEN_FAILED` load failure whose message
 * mentions the version mismatch. We check the error code first (structured,
 * stable) and fall back to message matching for older Node/edge cases where
 * the code isn't set — keeping the fragile string-match contained here.
 */
export function isNativeModuleAbiError(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code
  if (code === 'ERR_DLOPEN_FAILED') return true

  const message = toErrorMessage(err)
  return message.includes('NODE_MODULE_VERSION') || message.includes('was compiled against')
}

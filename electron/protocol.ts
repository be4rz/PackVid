/**
 * Custom Protocol Handler — media://
 *
 * Registers a custom protocol to securely serve local video files
 * to the renderer process without disabling web security.
 *
 * Usage: media://fileKey → streams file from storage base path
 */

import { protocol } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { getStorageBasePath } from './ipc/storage'

/**
 * Register the media:// protocol handler
 * Call this in app.whenReady() BEFORE creating windows
 */
export function registerMediaProtocol() {
  protocol.registerFileProtocol('media', (request, callback) => {
    try {
      // Extract fileKey from media://fileKey
      const url = request.url.replace('media://', '')
      const fileKey = decodeURIComponent(url)

      // Resolve to absolute path
      const basePath = getStorageBasePath()
      const filePath = path.join(basePath, fileKey)

      // Security: ensure path is within storage directory (prevent path traversal)
      const normalizedPath = path.normalize(filePath)
      const normalizedBase = path.normalize(basePath)
      
      if (!normalizedPath.startsWith(normalizedBase)) {
        console.error('[media://] Path traversal attempt blocked:', fileKey)
        callback({ error: -6 }) // ERR_FILE_NOT_FOUND
        return
      }

      // Check file exists
      if (!fs.existsSync(normalizedPath)) {
        console.error('[media://] File not found:', normalizedPath)
        callback({ error: -6 })
        return
      }

      // Serve the file
      callback({ path: normalizedPath })
    } catch (err) {
      console.error('[media://] Protocol error:', err)
      callback({ error: -2 }) // ERR_FAILED
    }
  })
}

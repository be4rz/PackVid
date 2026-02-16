/**
 * FFmpeg Path Resolution — Main Process Utility
 *
 * Resolves the FFmpeg binary path for both development and production.
 * Dev: uses @ffmpeg-installer/ffmpeg npm package path.
 * Prod: resolves from app.asar.unpacked to avoid asar archive issues.
 *
 * @see electron/ipc/thumbnails.ts
 * @see electron/ipc/lifecycle.ts
 */

import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

let cachedPath: string | null = null

export function getFFmpegPath(): string {
  if (cachedPath) return cachedPath

  const isDev = !!process.env['VITE_DEV_SERVER_URL']

  if (isDev) {
    // In dev, use the npm-installed binary directly
    const installer = require('@ffmpeg-installer/ffmpeg')
    cachedPath = installer.path
  } else {
    // In production, the binary must be unpacked from asar.
    // electron-builder should be configured with:
    //   asarUnpack: ["node_modules/@ffmpeg-installer/**"]
    const installerPath = require.resolve('@ffmpeg-installer/ffmpeg')
    cachedPath = installerPath
      .replace('app.asar', 'app.asar.unpacked')
      .replace(/index\.js$/, '')

    // Resolve the actual binary path from the installer
    const installer = require(
      path.join(cachedPath, 'index.js').replace('app.asar.unpacked', 'app.asar')
    )
    cachedPath = installer.path.replace('app.asar', 'app.asar.unpacked')
  }

  return cachedPath!
}

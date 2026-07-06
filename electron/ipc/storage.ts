/**
 * Storage IPC Handlers — Infrastructure Layer
 *
 * Provides file system operations for video recording storage
 * via Electron IPC. Renderer calls these through `window.api.storage.*`.
 *
 * Uses a streaming write approach: chunks are appended to files incrementally
 * to avoid holding entire recordings in memory.
 *
 * Channels:
 * - storage:getBasePath   — Get resolved storage base path
 * - storage:setBasePath   — Update storage base path in app_settings
 * - storage:ensureDir     — Create directory structure for a file key
 * - storage:writeChunk    — Append a video chunk (Uint8Array) to a file
 * - storage:finalize      — Close write stream, return file metadata
 * - storage:deleteFile    — Delete a video file by file key
 * - storage:getFullPath   — Resolve file_key to absolute path
 */

import path from 'node:path'
import fs from 'node:fs'
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { getDb } from '../db'
import { appSettings } from '../../src/db/schema'
import { resolveStorageBasePath, resolveFileKeyPath } from '../lib/storage-path'

/** Active write streams keyed by fileKey */
const activeStreams = new Map<string, fs.WriteStream>()

/**
 * Export for use in other modules (e.g., protocol handler)
 */
export function getStorageBasePath(): string {
  return resolveStorageBasePath()
}

export function registerStorageHandlers() {
  // ─── Get resolved base path ──────────────────────────────────
  ipcMain.handle('storage:getBasePath', async () => {
    return resolveStorageBasePath()
  })

  // ─── Update base path in settings ────────────────────────────
  ipcMain.handle('storage:setBasePath', async (_event, newPath: string) => {
    const db = getDb()
    const now = new Date()
    db.insert(appSettings)
      .values({ key: 'storage_base_path', value: JSON.stringify(newPath), updatedAt: now })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: JSON.stringify(newPath), updatedAt: now },
      })
      .run()
  })

  // ─── Ensure directory exists for a file key ──────────────────
  ipcMain.handle('storage:ensureDir', async (_event, fileKey: string) => {
    const fullPath = resolveFileKeyPath(fileKey)
    const dir = path.dirname(fullPath)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })

  // ─── Append chunk to file (streaming write) ──────────────────
  ipcMain.handle('storage:writeChunk', async (_event, fileKey: string, chunk: Uint8Array) => {
    let stream = activeStreams.get(fileKey)

    if (!stream) {
      const fullPath = resolveFileKeyPath(fileKey)
      const dir = path.dirname(fullPath)

      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      stream = fs.createWriteStream(fullPath, { flags: 'a' })
      activeStreams.set(fileKey, stream)
    }

    // Write chunk as a promise so we can await it
    return new Promise<void>((resolve, reject) => {
      stream!.write(Buffer.from(chunk), (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  })

  // ─── Finalize: close stream, return file metadata ────────────
  ipcMain.handle('storage:finalize', async (_event, fileKey: string) => {
    const stream = activeStreams.get(fileKey)

    if (stream) {
      await new Promise<void>((resolve, reject) => {
        stream.end((err: Error | null) => {
          if (err) reject(err)
          else resolve()
        })
      })
      activeStreams.delete(fileKey)
    }

    // Get file stats
    const fullPath = resolveFileKeyPath(fileKey)

    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath)
      return { fileSize: stats.size }
    }

    return { fileSize: 0 }
  })

  // ─── Delete a video file by file key ─────────────────────────
  ipcMain.handle('storage:deleteFile', async (_event, fileKey: string) => {
    // Close any active stream first
    const stream = activeStreams.get(fileKey)
    if (stream) {
      stream.destroy()
      activeStreams.delete(fileKey)
    }

    const fullPath = resolveFileKeyPath(fileKey)

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  })

  // ─── Resolve file_key to absolute path ───────────────────────
  ipcMain.handle('storage:getFullPath', async (_event, fileKey: string) => {
    return resolveFileKeyPath(fileKey)
  })

  // ─── Pick folder dialog ────────────────────────────────────────
  ipcMain.handle('storage:pickFolder', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Chọn thư mục lưu trữ video',
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })
}

import path from 'node:path'
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { ipcMain } from 'electron'
import { eq } from 'drizzle-orm'
import { getFFmpegPath } from '../lib/ffmpeg'
import { getDb } from '../db'
import { appSettings, recordings } from '../../src/db/schema'
import { generateThumbnailData } from './thumbnails'

/** Track compression progress per recording ID */
const compressionProgress = new Map<string, number>()

/** Resolve storage base path from app_settings */
function resolveBasePath(): string {
  const db = getDb()
  const rows = db.select().from(appSettings)
    .where(eq(appSettings.key, 'storage_base_path'))
    .all()

  if (rows.length === 0) {
    throw new Error('storage_base_path not configured')
  }

  try {
    return JSON.parse(rows[0].value) as string
  } catch {
    return rows[0].value
  }
}

/** Resolve a fileKey to an absolute path (handles both absolute and legacy relative keys) */
function resolveFilePath(basePath: string, fileKey: string): string {
  return path.isAbsolute(fileKey) ? fileKey : path.join(basePath, fileKey)
}

/** Convert a .webm fileKey to its compressed .mp4 fileKey */
function toCompressedKey(fileKey: string): string {
  return fileKey.replace(/\.webm$/, '.mp4')
}

export interface CompressResult {
  newFileKey: string
  newFileSize: number
  originalFileSize: number
}

/**
 * Run FFmpeg via child_process.spawn (avoids fluent-ffmpeg ESM/bundling issues).
 * Parses stderr for progress updates.
 */
function runFFmpeg(
  ffmpegPath: string,
  args: string[],
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] })

    let totalDurationSec = 0
    let stderrData = ''

    proc.stderr.on('data', (chunk: Buffer) => {
      stderrData += chunk.toString()

      // Parse total duration from "Duration: HH:MM:SS.xx"
      if (totalDurationSec === 0) {
        const durMatch = stderrData.match(/Duration:\s+(\d+):(\d+):(\d+)\.(\d+)/)
        if (durMatch) {
          totalDurationSec = parseInt(durMatch[1]) * 3600
            + parseInt(durMatch[2]) * 60
            + parseInt(durMatch[3])
            + parseInt(durMatch[4]) / 100
        }
      }

      // Parse current time from "time=HH:MM:SS.xx"
      if (totalDurationSec > 0 && onProgress) {
        const timeMatch = chunk.toString().match(/time=(\d+):(\d+):(\d+)\.(\d+)/)
        if (timeMatch) {
          const currentSec = parseInt(timeMatch[1]) * 3600
            + parseInt(timeMatch[2]) * 60
            + parseInt(timeMatch[3])
            + parseInt(timeMatch[4]) / 100
          const percent = Math.min(99, Math.round((currentSec / totalDurationSec) * 100))
          onProgress(percent)
        }
      }
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        // Extract last few lines of stderr for error message
        const lines = stderrData.trim().split('\n')
        const errorMsg = lines.slice(-3).join('\n')
        reject(new Error(`ffmpeg exited with code ${code}: ${errorMsg}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn ffmpeg: ${err.message}`))
    })
  })
}

/**
 * Compress a video recording. Used by both the IPC handler and the lifecycle scheduler.
 * Performs FFmpeg compression, replaces original file, and updates DB.
 */
export async function compressRecording(
  recordingId: string,
  fileKey: string,
): Promise<CompressResult> {
  const basePath = resolveBasePath()
  const inputPath = resolveFilePath(basePath, fileKey)
  const newFileKey = toCompressedKey(fileKey)
  const outputPath = resolveFilePath(basePath, newFileKey)
  const tempPath = outputPath.replace(/\.mp4$/, '.tmp.mp4')

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Source video not found: ${inputPath}`)
  }

  // Get original file size before compression
  const originalStats = fs.statSync(inputPath)
  const originalFileSize = originalStats.size

  // Ensure output directory exists
  const dir = path.dirname(outputPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Reset progress
  compressionProgress.set(recordingId, 0)

  // Compress: WebM (VP9/VFR) → MP4 (H.264/AAC) at CRF 28
  // -vsync vfr: preserve original frame timing from VFR WebM (Chrome MediaRecorder)
  // -r 30: cap output frame rate to 30fps (prevents 1000fps timebase inheritance)
  const ffmpegPath = getFFmpegPath()
  const args = [
    '-fflags', '+genpts',  // Regenerate presentation timestamps
    '-i', inputPath,
    '-c:v', 'libx264',
    '-crf', '28',
    '-preset', 'medium',
    '-r', '30',            // Force constant 30fps output
    '-vsync', 'vfr',       // Handle variable frame rate input
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-y',  // Overwrite output file if exists
    tempPath,
  ]

  try {
    await runFFmpeg(ffmpegPath, args, (percent) => {
      compressionProgress.set(recordingId, percent)
    })
    compressionProgress.set(recordingId, 100)
  } catch (err) {
    compressionProgress.delete(recordingId)
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath)
    }
    throw err
  }

  // Get compressed file size
  const newStats = fs.statSync(tempPath)
  const newFileSize = newStats.size

  // Replace: rename temp → final, delete original WebM
  fs.renameSync(tempPath, outputPath)
  if (inputPath !== outputPath && fs.existsSync(inputPath)) {
    fs.unlinkSync(inputPath)
  }

  // Delete old thumbnail file if it exists on disk
  const oldThumbnailKey = fileKey.replace(/\.[^.]+$/, '.jpg')
  const oldThumbnailPath = resolveFilePath(basePath, oldThumbnailKey)
  if (fs.existsSync(oldThumbnailPath)) {
    fs.unlinkSync(oldThumbnailPath)
  }

  // Regenerate thumbnail from the new MP4 file
  let thumbnailData: string | null = null
  try {
    thumbnailData = await generateThumbnailData(outputPath)
  } catch (err) {
    console.error(`[lifecycle] Failed to regenerate thumbnail for ${recordingId}:`, err)
  }

  // Update DB: new fileKey, fileSize, lifecycle stage, archive metadata, thumbnail
  const db = getDb()
  db.update(recordings)
    .set({
      fileKey: newFileKey,
      fileSize: newFileSize,
      originalFileSize,
      lifecycleStage: 'archived',
      archivedAt: new Date(),
      ...(thumbnailData ? { thumbnailData } : {}),
    })
    .where(eq(recordings.id, recordingId))
    .run()

  // Clean up progress tracking
  compressionProgress.delete(recordingId)

  return { newFileKey, newFileSize, originalFileSize }
}

export function registerLifecycleHandlers() {
  ipcMain.handle(
    'lifecycle:compressVideo',
    async (_event, data: { recordingId: string; fileKey: string }) => {
      return compressRecording(data.recordingId, data.fileKey)
    },
  )

  ipcMain.handle('lifecycle:getProgress', async (_event, recordingId: string) => {
    return compressionProgress.get(recordingId) ?? null
  })
}

/**
 * Thumbnails IPC Handlers — Infrastructure Layer
 *
 * Generates video thumbnails using FFmpeg (via child_process.spawn).
 * Extracts a single frame as a 160x90 JPEG, converts to base64 data URI,
 * and stores directly in the database (no file on disk).
 *
 * Channels:
 * - thumbnails:generate — Extract thumbnail, store as base64 in DB
 *
 * @see electron/lib/ffmpeg.ts (FFmpeg path resolution)
 */

import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { spawn } from 'node:child_process'
import { ipcMain } from 'electron'
import { eq } from 'drizzle-orm'
import { getFFmpegPath } from '../lib/ffmpeg'
import { getDb } from '../db'
import { recordings } from '../../src/db/schema'
import { resolveFileKeyPath } from '../lib/storage-path'

/**
 * Extract a single frame from a video to a temp file.
 * Returns true if successful, false if FFmpeg exits with error.
 */
function extractFrame(
  ffmpegPath: string,
  videoPath: string,
  outputPath: string,
  timemark: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    const args = [
      '-ss', timemark,        // Seek to timemark
      '-i', videoPath,
      '-vframes', '1',        // Extract 1 frame
      '-vf', 'scale=160:90',  // Small thumbnail (160x90)
      '-q:v', '6',            // JPEG quality (6 = lightweight, ~2-4KB)
      '-y',                   // Overwrite output
      outputPath,
    ]

    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] })

    proc.on('close', (code) => {
      resolve(code === 0)
    })

    proc.on('error', () => {
      resolve(false)
    })
  })
}

/**
 * Generate a thumbnail data URI from a video file on disk.
 * Extracts a single frame via FFmpeg, returns base64 data URI string.
 * Does NOT write to DB — caller is responsible for persistence.
 */
export async function generateThumbnailData(videoPath: string): Promise<string> {
  const ffmpegPath = getFFmpegPath()
  const tempPath = path.join(os.tmpdir(), `packvid-thumb-${Date.now()}.jpg`)

  try {
    // Try frame at 1s first, fallback to 0s for very short videos
    let success = await extractFrame(ffmpegPath, videoPath, tempPath, '00:00:01')
    if (!success) {
      success = await extractFrame(ffmpegPath, videoPath, tempPath, '00:00:00')
    }

    if (!success) {
      throw new Error(`Failed to generate thumbnail for: ${videoPath}`)
    }

    // Read the thumbnail into a base64 data URI
    const buffer = fs.readFileSync(tempPath)
    return `data:image/jpeg;base64,${buffer.toString('base64')}`
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath)
    }
  }
}

export function registerThumbnailHandlers() {
  ipcMain.handle(
    'thumbnails:generate',
    async (_event, fileKey: string, recordingId?: string): Promise<string> => {
      const videoPath = resolveFileKeyPath(fileKey)

      const dataUri = await generateThumbnailData(videoPath)

      // Persist the data URI on the recording row.
      // Prefer matching by `recordingId` (a unique primary key). `fileKey` is
      // derived from tracking-number + date, so two recordings of the same
      // parcel on the same day collide — matching by path would overwrite the
      // wrong row (or both). We fall back to path matching only when no id is
      // supplied (legacy callers). `videoPath` is the absolute path that
      // `recordings:create` persisted, so it matches `file_key` in that case.
      const db = getDb()
      db.update(recordings)
        .set({ thumbnailData: dataUri })
        .where(recordingId ? eq(recordings.id, recordingId) : eq(recordings.fileKey, videoPath))
        .run()

      return dataUri
    },
  )
}

/**
 * IPC Video File Service — Infrastructure Layer
 *
 * Implements VideoFileService port using Electron IPC calls.
 * Wraps thumbnails and lifecycle IPC handlers.
 *
 * @see src/modules/video-storage/application/ports/VideoFileService.ts
 */

import type { VideoFileService, CompressionResult } from '../application/ports/VideoFileService'

export class IpcVideoFileService implements VideoFileService {
  async compressVideo(fileKey: string): Promise<CompressionResult> {
    // recordingId is needed for progress tracking — caller should use
    // the lifecycle IPC directly for full control. This wraps the basic case.
    const result = await window.api.lifecycle.compressVideo({
      recordingId: '', // progress tracking not needed for direct calls
      fileKey,
    })
    return {
      newFileKey: result.newFileKey,
      newFileSize: result.newFileSize,
    }
  }

  async generateThumbnail(fileKey: string): Promise<string> {
    return await window.api.thumbnails.generate(fileKey)
  }

  async getStorageBasePath(): Promise<string> {
    return await window.api.storage.getBasePath()
  }

  async deleteFile(fileKey: string): Promise<void> {
    await window.api.storage.deleteFile(fileKey)
  }
}

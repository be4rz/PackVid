/**
 * Video File Service Port — Application Layer
 *
 * Defines the contract for video file operations (compression, thumbnails).
 * Infrastructure layer (FFmpeg + IPC) provides the implementation.
 *
 * @see src/modules/video-storage/infrastructure/ffmpeg-video-file-service.ts
 */

export interface CompressionResult {
  newFileKey: string
  newFileSize: number
}

export interface VideoFileService {
  /** Compress video to reduce file size (H.264/AAC MP4, CRF 28) */
  compressVideo(fileKey: string): Promise<CompressionResult>

  /** Generate thumbnail from video (JPEG, 320x180, frame at 1s) */
  generateThumbnail(fileKey: string): Promise<string>

  /** Get the configured storage base path */
  getStorageBasePath(): Promise<string>

  /** Delete a file by its relative key */
  deleteFile(fileKey: string): Promise<void>
}

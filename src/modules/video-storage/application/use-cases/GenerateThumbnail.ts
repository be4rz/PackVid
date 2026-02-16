/**
 * GenerateThumbnail Use Case — Application Layer
 *
 * Generates (or regenerates) a thumbnail for a recording.
 * Delegates to VideoFileService, which calls the FFmpeg IPC handler.
 */

import type { VideoFileService } from '../ports/VideoFileService'

export class GenerateThumbnail {
  constructor(private videoFileService: VideoFileService) {}

  async execute(fileKey: string): Promise<string> {
    return this.videoFileService.generateThumbnail(fileKey)
  }
}

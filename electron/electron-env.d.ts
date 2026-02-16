/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer
  api: {
    settings: {
      get: (key: string) => Promise<unknown>
      set: (key: string, value: unknown) => Promise<void>
      getAll: () => Promise<Record<string, unknown>>
    }
    storage: {
      getBasePath: () => Promise<string>
      setBasePath: (path: string) => Promise<void>
      ensureDir: (fileKey: string) => Promise<void>
      writeChunk: (fileKey: string, chunk: Uint8Array) => Promise<void>
      finalize: (fileKey: string) => Promise<{ fileSize: number }>
      deleteFile: (fileKey: string) => Promise<void>
      getFullPath: (fileKey: string) => Promise<string>
    }
    recordings: {
      create: (data: {
        id: string
        trackingNumber: string
        carrier?: string
        fileKey: string
        status?: string
        startedAt: number
        createdAt: number
      }) => Promise<void>
      update: (id: string, data: {
        status?: string
        fileSize?: number
        duration?: number
        finishedAt?: number
      }) => Promise<void>
      getById: (id: string) => Promise<{
        id: string
        trackingNumber: string
        carrier: string | null
        fileKey: string
        fileSize: number | null
        duration: number | null
        status: string
        lifecycleStage: string
        thumbnailKey: string | null
        thumbnailData: string | null
        originalFileSize: number | null
        startedAt: number
        finishedAt: number | null
        archivedAt: number | null
        createdAt: number
      } | null>
      getAll: (options?: { page?: number; limit?: number }) => Promise<Array<{
        id: string
        trackingNumber: string
        carrier: string | null
        fileKey: string
        fileSize: number | null
        duration: number | null
        status: string
        lifecycleStage: string
        thumbnailKey: string | null
        thumbnailData: string | null
        originalFileSize: number | null
        startedAt: number
        finishedAt: number | null
        archivedAt: number | null
        createdAt: number
      }>>
      delete: (id: string) => Promise<{ fileKey: string } | null>
      getByTracking: (trackingNumber: string) => Promise<{
        id: string
        trackingNumber: string
        carrier: string | null
        fileKey: string
        fileSize: number | null
        duration: number | null
        status: string
        lifecycleStage: string
        thumbnailKey: string | null
        thumbnailData: string | null
        originalFileSize: number | null
        startedAt: number
        finishedAt: number | null
        archivedAt: number | null
        createdAt: number
      } | null>
      search: (filters: {
        dateFrom?: number
        dateTo?: number
        carrier?: string
        trackingNumber?: string
        lifecycleStage?: string
        sortBy?: 'createdAt' | 'fileSize' | 'duration'
        sortOrder?: 'asc' | 'desc'
        limit?: number
        offset?: number
      }) => Promise<{
        recordings: Array<{
          id: string
          trackingNumber: string
          carrier: string | null
          fileKey: string
          fileSize: number | null
          duration: number | null
          status: string
          lifecycleStage: string
          thumbnailKey: string | null
          thumbnailData: string | null
          originalFileSize: number | null
          startedAt: number
          finishedAt: number | null
          archivedAt: number | null
          createdAt: number
        }>
        total: number
      }>
      getStats: () => Promise<{
        totalSize: number
        activeSize: number
        archivedSize: number
        totalCount: number
        activeCount: number
        archivedCount: number
        spaceSaved: number
      }>
    }
    thumbnails: {
      generate: (fileKey: string) => Promise<string>
    }
    lifecycle: {
      compressVideo: (data: { recordingId: string; fileKey: string }) => Promise<{
        newFileKey: string
        newFileSize: number
        originalFileSize: number
      }>
      getProgress: (recordingId: string) => Promise<number | null>
    }
  }
}

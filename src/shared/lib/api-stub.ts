/**
 * Browser-safe stub for window.api
 *
 * In Electron, `window.api` is provided by the preload script via contextBridge.
 * When running on the Vite dev server (browser-only), `window.api` is undefined
 * which crashes the React tree. This module installs no-op stubs so the app can
 * at least render in the browser without Electron — useful for UI development.
 *
 * Import this module ONCE at the top of main.tsx (before React renders).
 */

const noop = () => Promise.resolve(null as any)

if (typeof window !== 'undefined' && !window.api) {
  ;(window as any).api = {
    settings: {
      get: noop,
      set: noop,
      getAll: () => Promise.resolve([]),
    },
    storage: {
      getBasePath: () => Promise.resolve(''),
      setBasePath: noop,
      ensureDir: noop,
      writeChunk: noop,
      finalize: () => Promise.resolve({ fileSize: 0 }),
      deleteFile: noop,
      getFullPath: () => Promise.resolve(''),
      pickFolder: () => Promise.resolve(null),
    },
    recordings: {
      create: noop,
      update: noop,
      getById: noop,
      getAll: () => Promise.resolve([]),
      delete: () => Promise.resolve({ fileKey: '' }),
      getByTracking: noop,
      search: () => Promise.resolve({ recordings: [], total: 0 }),
      getStats: () => Promise.resolve({ totalCount: 0, totalSize: 0 }),
    },
    thumbnails: {
      generate: noop,
    },
    lifecycle: {
      compressVideo: noop,
      getProgress: () => Promise.resolve(0),
    },
  }
  console.warn('[PackVid] Running without Electron — API stubs active')
}

if (typeof window !== 'undefined' && !window.ipcRenderer) {
  ;(window as any).ipcRenderer = {
    on: () => ({ removeListener: noop }),
    off: noop,
    send: noop,
    invoke: noop,
  }
}

import { ipcRenderer, contextBridge } from 'electron'

// --------- Legacy IPC (backward compatibility) ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// --------- Typed API for Renderer process ---------
contextBridge.exposeInMainWorld('api', {
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },

  storage: {
    getBasePath: () => ipcRenderer.invoke('storage:getBasePath'),
    setBasePath: (path: string) => ipcRenderer.invoke('storage:setBasePath', path),
    ensureDir: (fileKey: string) => ipcRenderer.invoke('storage:ensureDir', fileKey),
    writeChunk: (fileKey: string, chunk: Uint8Array) =>
      ipcRenderer.invoke('storage:writeChunk', fileKey, chunk),
    finalize: (fileKey: string) => ipcRenderer.invoke('storage:finalize', fileKey),
    deleteFile: (fileKey: string) => ipcRenderer.invoke('storage:deleteFile', fileKey),
    getFullPath: (fileKey: string) => ipcRenderer.invoke('storage:getFullPath', fileKey),
  },

  recordings: {
    create: (data: {
      id: string
      trackingNumber: string
      carrier?: string
      fileKey: string
      status?: string
      startedAt: number
      createdAt: number
    }) => ipcRenderer.invoke('recordings:create', data),
    update: (id: string, data: {
      status?: string
      fileSize?: number
      duration?: number
      finishedAt?: number
    }) => ipcRenderer.invoke('recordings:update', id, data),
    getById: (id: string) => ipcRenderer.invoke('recordings:getById', id),
    getAll: (options?: { page?: number; limit?: number }) =>
      ipcRenderer.invoke('recordings:getAll', options),
    delete: (id: string) => ipcRenderer.invoke('recordings:delete', id),
    getByTracking: (trackingNumber: string) =>
      ipcRenderer.invoke('recordings:getByTracking', trackingNumber),
  },
})

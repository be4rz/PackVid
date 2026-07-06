import { app, BrowserWindow, systemPreferences, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initDatabase } from './db'
import { toErrorMessage } from './lib/errors'
import { registerSettingsHandlers } from './ipc/settings'
import { registerStorageHandlers } from './ipc/storage'
import { registerRecordingsHandlers } from './ipc/recordings'
import { registerThumbnailHandlers } from './ipc/thumbnails'
import { registerLifecycleHandlers } from './ipc/lifecycle'
import { startLifecycleScheduler } from './lifecycle-scheduler'
import { registerMediaProtocol } from './protocol'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(async () => {
  try {
    initDatabase()
  } catch (err) {
    // A failed DB init leaves the app unusable — surface it and quit cleanly
    // instead of letting it bubble up as an unhandled promise rejection while
    // the window keeps loading against a non-existent database.
    const message = toErrorMessage(err)
    console.error('[main] Database initialization failed:', message)
    // Vietnamese-first message for the user; keep the technical detail below
    // for support/debugging.
    dialog.showErrorBox(
      'Không thể khởi tạo cơ sở dữ liệu',
      `Ứng dụng không thể mở cơ sở dữ liệu và sẽ đóng lại.\n` +
        `Vui lòng khởi động lại ứng dụng; nếu vẫn lỗi, hãy liên hệ bộ phận hỗ trợ.\n\n` +
        `Chi tiết kỹ thuật:\n${message}`,
    )
    app.quit()
    return
  }

  registerMediaProtocol()  // ← Register custom protocol BEFORE creating windows
  registerSettingsHandlers()
  registerStorageHandlers()
  registerRecordingsHandlers()
  registerThumbnailHandlers()
  registerLifecycleHandlers()

  // Request camera permission on macOS (triggers native dialog on first launch)
  if (process.platform === 'darwin') {
    await systemPreferences.askForMediaAccess('camera')
  }

  createWindow()
  startLifecycleScheduler()
})

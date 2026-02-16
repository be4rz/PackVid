/**
 * StorageSettings — Storage path configuration UI
 *
 * Shows current storage path with a "Thay đổi" button to pick a new folder.
 * Metrics are handled by StorageAnalytics in LifecycleSettings — no duplication.
 */

import { FolderOpen } from 'lucide-react'
import { useStoragePath } from '../hooks/useStoragePath'

export function StorageSettings() {
  const { basePath, setBasePath, loading } = useStoragePath()

  async function handlePickFolder() {
    const picked = await window.api.storage.pickFolder()
    if (picked) {
      await setBasePath(picked)
    }
  }

  return (
    <div>
      <label className="block text-surface-200 text-sm font-medium mb-2">
        Thư mục lưu trữ
      </label>
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2.5">
          <FolderOpen className="w-4 h-4 text-surface-500 shrink-0" />
          <span className="text-surface-300 text-sm truncate">
            {loading ? '...' : basePath}
          </span>
        </div>
        <button
          onClick={handlePickFolder}
          className="px-4 py-2.5 bg-surface-800 hover:bg-surface-700 border border-surface-700 text-surface-200 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          Thay đổi
        </button>
      </div>
      <p className="text-surface-600 text-xs mt-2">
        Video cũ vẫn phát được sau khi đổi thư mục (đường dẫn tuyệt đối).
      </p>
    </div>
  )
}

/**
 * App — Root component with react-router setup
 *
 * Defines the application routes with a shared AppLayout.
 * All pages render inside the layout's <Outlet>.
 */

import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './shared/components/AppLayout'
import { RecordingView } from './views/RecordingView'
import { Settings } from './views/Settings'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RecordingView />} />
          <Route path="/settings" element={<Settings />} />
          {/* Future routes */}
          <Route path="/library" element={<PlaceholderView title="Thư viện video" />} />
          <Route path="/stats" element={<PlaceholderView title="Thống kê" />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

/** Temporary placeholder for unimplemented pages */
function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-surface-500 text-sm">{title} — sẽ có trong phiên bản tiếp theo</p>
    </div>
  )
}

export default App

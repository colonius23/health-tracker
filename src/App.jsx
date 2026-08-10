import { HashRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import BloodTests from './pages/BloodTests'
import Activities from './pages/Activities'
import Sleep from './pages/Sleep'
import Upload from './pages/Upload'
import Settings from './pages/Settings'

export default function App() {
  return (
    <HashRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/blood" element={<BloodTests />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/sleep" element={<Sleep />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
      <Analytics />
    </HashRouter>
  )
}

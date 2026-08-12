import { HashRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import BloodTests from './pages/BloodTests'
import Activities from './pages/Activities'
import Sleep from './pages/Sleep'
import Vitals from './pages/Vitals'
import Report from './pages/Report'
import Upload from './pages/Upload'
import Settings from './pages/Settings'

export default function App() {
  return (
    <HashRouter>
      <div className="flex min-h-screen">
        <div className="print:hidden">
          <Sidebar />
        </div>
        <main className="flex-1 p-6 md:p-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<div>Hello</div>} />
            <Route path="/blood" element={<BloodTests />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/sleep" element={<Sleep />} />
            <Route path="/vitals" element={<Vitals />} />
            <Route path="/report" element={<Report />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}

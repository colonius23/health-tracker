import { useEffect, useState } from 'react'
import { supabaseConfigured } from '../lib/supabaseClient'
import { fetchActivities } from '../lib/queries'
import StatCard from '../components/StatCard'
import TrendChart from '../components/TrendChart'

export default function Activities() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }
    fetchActivities(365).then(setRows).finally(() => setLoading(false))
  }, [])

  if (!supabaseConfigured) return <div className="text-muted text-sm">Connect Supabase in Settings first.</div>
  if (loading) return <div className="text-muted text-sm">Loading…</div>

  const totalMin = rows.reduce((s, r) => s + (r.duration_min || 0), 0)
  const totalKm = rows.reduce((s, r) => s + (r.distance_km || 0), 0)
  const avgHr = rows.filter(r => r.avg_hr).length
    ? Math.round(rows.filter(r => r.avg_hr).reduce((s, r) => s + r.avg_hr, 0) / rows.filter(r => r.avg_hr).length)
    : null

  const byWeek = {}
  for (const r of rows) {
    const d = new Date(r.activity_date)
    const week = `${d.getFullYear()}-W${String(Math.ceil((d.getDate()) / 7)).padStart(2, '0')}-${d.getMonth() + 1}`
    byWeek[week] = (byWeek[week] || 0) + (r.duration_min || 0)
  }
  const weekSeries = Object.entries(byWeek).map(([date, value]) => ({ date, value })).slice(-16)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Activities</h1>
        <p className="text-muted text-sm mt-1">{rows.length} sessions logged.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total time" value={Math.round(totalMin / 60)} unit="hrs" accent="amber" />
        <StatCard label="Total distance" value={totalKm.toFixed(0)} unit="km" accent="blue" />
        <StatCard label="Avg heart rate" value={avgHr ?? '–'} unit="bpm" accent="red" />
        <StatCard label="Sessions" value={rows.length} accent="mint" />
      </div>

      {weekSeries.length > 1 && (
        <section className="rounded-xl border border-line bg-surface p-4">
          <h2 className="text-sm text-muted mb-3">Weekly training minutes</h2>
          <TrendChart data={weekSeries} unit="min" color="#F2A93B" />
        </section>
      )}

      <section className="rounded-xl border border-line bg-surface p-4 overflow-x-auto">
        <h2 className="text-sm text-muted mb-3">Recent sessions</h2>
        {rows.length === 0 ? (
          <div className="text-muted text-sm py-6 text-center">No activities yet — upload a Garmin export.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Duration</th>
                <th className="py-2 pr-4">Distance</th>
                <th className="py-2 pr-4">Avg HR</th>
                <th className="py-2 pr-4">Calories</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.slice(0, 50).map((r) => (
                <tr key={r.id} className="border-b border-line/50">
                  <td className="py-2 pr-4">{r.activity_date}</td>
                  <td className="py-2 pr-4 font-sans">{r.type}</td>
                  <td className="py-2 pr-4">{r.duration_min} min</td>
                  <td className="py-2 pr-4">{r.distance_km ? `${r.distance_km} km` : '–'}</td>
                  <td className="py-2 pr-4">{r.avg_hr ?? '–'}</td>
                  <td className="py-2 pr-4">{r.calories ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

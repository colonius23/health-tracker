import { useEffect, useState } from 'react'
import { supabaseConfigured } from '../lib/supabaseClient'
import { fetchVitals } from '../lib/queries'
import StatCard from '../components/StatCard'
import TrendChart from '../components/TrendChart'

export default function Vitals() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }
    fetchVitals().then(setRows).finally(() => setLoading(false))
  }, [])

  if (!supabaseConfigured) return <div className="text-muted text-sm">Connect Supabase in Settings first.</div>
  if (loading) return <div className="text-muted text-sm">Loading…</div>

  const withHr = rows.filter((r) => r.avg_hr != null)
  const withResting = rows.filter((r) => r.resting_hr != null)
  const latest = withHr[withHr.length - 1]
  const avgOverall = withHr.length ? Math.round(withHr.reduce((s, r) => s + r.avg_hr, 0) / withHr.length) : null
  const avgResting = withResting.length ? Math.round(withResting.reduce((s, r) => s + r.resting_hr, 0) / withResting.length) : null
  const lowestMin = rows.filter((r) => r.min_hr != null).reduce((m, r) => (m === null ? r.min_hr : Math.min(m, r.min_hr)), null)
  const highestMax = rows.filter((r) => r.max_hr != null).reduce((m, r) => (m === null ? r.max_hr : Math.max(m, r.max_hr)), null)

  // Monthly average trend
  const byMonth = {}
  for (const r of withHr) {
    const month = r.recorded_date.slice(0, 7)
    if (!byMonth[month]) byMonth[month] = { sum: 0, n: 0 }
    byMonth[month].sum += r.avg_hr
    byMonth[month].n += 1
  }
  const monthlySeries = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { sum, n }]) => ({ date: month, value: Math.round((sum / n) * 10) / 10 }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Vitals</h1>
        <p className="text-muted text-sm mt-1">{rows.length} days of heart rate data.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-muted text-sm">
          No vitals data yet — upload a heart rate export on the Upload Data page.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Latest daily avg" value={latest ? latest.avg_hr : '–'} unit="bpm" accent="red" />
            <StatCard label="Overall avg" value={avgOverall ?? '–'} unit="bpm" accent="blue" />
            {avgResting !== null && <StatCard label="Avg resting" value={avgResting} unit="bpm" accent="mint" />}
            <StatCard label="Range observed" value={lowestMin !== null && highestMax !== null ? `${lowestMin}–${highestMax}` : '–'} unit="bpm" accent="amber" />
          </div>

          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="text-sm text-muted mb-3">Monthly average heart rate</h2>
            <TrendChart data={monthlySeries} unit="bpm" color="#EF5B5B" />
          </section>

          <section className="rounded-xl border border-line bg-surface p-4 overflow-x-auto">
            <h2 className="text-sm text-muted mb-3">Recent days</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-line">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Avg</th>
                  <th className="py-2 pr-4">Min</th>
                  <th className="py-2 pr-4">Max</th>
                  <th className="py-2 pr-4">Resting</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {[...rows].reverse().slice(0, 50).map((r) => (
                  <tr key={r.id} className="border-b border-line/50">
                    <td className="py-2 pr-4">{r.recorded_date}</td>
                    <td className="py-2 pr-4">{r.avg_hr ?? '–'}</td>
                    <td className="py-2 pr-4">{r.min_hr ?? '–'}</td>
                    <td className="py-2 pr-4">{r.max_hr ?? '–'}</td>
                    <td className="py-2 pr-4">{r.resting_hr ?? '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  )
}

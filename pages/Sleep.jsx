import { useEffect, useState } from 'react'
import { supabaseConfigured } from '../lib/supabaseClient'
import { fetchSleep } from '../lib/queries'
import StatCard from '../components/StatCard'
import TrendChart from '../components/TrendChart'

export default function Sleep() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }
    fetchSleep(180).then(setRows).finally(() => setLoading(false))
  }, [])

  if (!supabaseConfigured) return <div className="text-muted text-sm">Connect Supabase in Settings first.</div>
  if (loading) return <div className="text-muted text-sm">Loading…</div>

  const avgHours = rows.length ? (rows.reduce((s, r) => s + (r.duration_min || 0), 0) / rows.length / 60).toFixed(1) : '–'
  const avgScore = rows.filter(r => r.score).length
    ? Math.round(rows.filter(r => r.score).reduce((s, r) => s + r.score, 0) / rows.filter(r => r.score).length) : '–'
  const avgDeep = rows.filter(r => r.deep_min).length
    ? Math.round(rows.filter(r => r.deep_min).reduce((s, r) => s + r.deep_min, 0) / rows.filter(r => r.deep_min).length) : '–'

  const series = [...rows].reverse().slice(-60).map((r) => ({ date: r.sleep_date?.slice(5), value: +(r.duration_min / 60).toFixed(1) }))
  const scoreSeries = [...rows].reverse().slice(-60).filter(r => r.score).map((r) => ({ date: r.sleep_date?.slice(5), value: r.score }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Sleep</h1>
        <p className="text-muted text-sm mt-1">{rows.length} nights logged.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Avg duration" value={avgHours} unit="hrs" accent="blue" />
        <StatCard label="Avg sleep score" value={avgScore} accent="mint" />
        <StatCard label="Avg deep sleep" value={avgDeep} unit="min" accent="amber" />
      </div>

      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm text-muted mb-3">Duration (hrs)</h2>
        <TrendChart data={series} unit="hrs" color="#5B9BD9" />
      </section>

      {scoreSeries.length > 1 && (
        <section className="rounded-xl border border-line bg-surface p-4">
          <h2 className="text-sm text-muted mb-3">Sleep score</h2>
          <TrendChart data={scoreSeries} unit="" color="#35D0A0" />
        </section>
      )}
    </div>
  )
}

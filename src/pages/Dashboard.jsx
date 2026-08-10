import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabaseClient'
import { fetchBloodTests, fetchBodyMetrics, fetchSleep, fetchActivities } from '../lib/queries'
import StatCard from '../components/StatCard'
import RangeBar from '../components/RangeBar'
import TrendChart from '../components/TrendChart'
import { Link } from 'react-router-dom'

const KEY_MARKERS = ['Total Cholesterol', 'LDL', 'HDL', 'Triglycerides']

export default function Dashboard() {
  const [blood, setBlood] = useState([])
  const [weight, setWeight] = useState([])
  const [sleep, setSleep] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }
    Promise.all([fetchBloodTests(), fetchBodyMetrics(), fetchSleep(30), fetchActivities(30)])
      .then(([b, w, s, a]) => { setBlood(b); setWeight(w); setSleep(s); setActivities(a) })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (!supabaseConfigured) {
    return (
      <EmptyState
        title="Not connected yet"
        body="Add your Supabase URL and anon key in Settings to start seeing your data here."
        cta={<Link to="/settings" className="text-mint text-sm underline">Go to Settings</Link>}
      />
    )
  }
  if (loading) return <div className="text-muted text-sm">Loading…</div>
  if (err) return <div className="text-red text-sm">{err}</div>

  const latestWeight = weight[weight.length - 1]
  const prevWeight = weight[weight.length - 8] // ~1 week back if daily
  const weightSeries = weight.slice(-60).map((w) => ({ date: w.metric_date?.slice(5), value: w.weight_kg }))

  const latestByMarker = {}
  for (const row of blood) {
    if (!latestByMarker[row.marker] || row.test_date > latestByMarker[row.marker].test_date) {
      latestByMarker[row.marker] = row
    }
  }
  const prevByMarker = {}
  for (const marker of KEY_MARKERS) {
    const rows = blood.filter((b) => b.marker === marker).sort((a, b) => a.test_date.localeCompare(b.test_date))
    if (rows.length > 1) prevByMarker[marker] = rows[rows.length - 2].value
  }

  const avgSleepScore = sleep.length ? Math.round(sleep.reduce((s, r) => s + (r.score || 0), 0) / sleep.filter(r => r.score).length) : null
  const avgSleepHours = sleep.length ? (sleep.reduce((s, r) => s + (r.duration_min || 0), 0) / sleep.length / 60).toFixed(1) : null
  const activityMinutes = activities.reduce((s, a) => s + (a.duration_min || 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-xl font-semibold">Overview</h1>
        <p className="text-muted text-sm mt-1">Latest snapshot across everything you're tracking.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Weight" value={latestWeight ? latestWeight.weight_kg : '–'} unit="kg"
          sub={latestWeight && prevWeight ? `${(latestWeight.weight_kg - prevWeight.weight_kg).toFixed(1)} kg vs 7 readings ago` : ''} />
        <StatCard label="Avg sleep" value={avgSleepHours ?? '–'} unit="hrs" sub="last 30 days" accent="blue" />
        <StatCard label="Sleep score" value={avgSleepScore ?? '–'} sub="avg, last 30 days" accent="blue" />
        <StatCard label="Activity time" value={activityMinutes} unit="min" sub="last 30 sessions" accent="amber" />
      </div>

      {weightSeries.length > 1 && (
        <section>
          <h2 className="text-sm text-muted mb-3">Weight trend</h2>
          <div className="rounded-xl border border-line bg-surface p-4">
            <TrendChart data={weightSeries} unit="kg" color="#35D0A0" />
          </div>
        </section>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm text-muted">Key lipid markers (latest)</h2>
          <Link to="/blood" className="text-xs text-mint underline">View all markers</Link>
        </div>
        {Object.keys(latestByMarker).length === 0 ? (
          <EmptyState title="No blood test data yet" body="Upload your lab results to see them here." compact
            cta={<Link to="/upload" className="text-mint text-sm underline">Upload data</Link>} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {KEY_MARKERS.filter((m) => latestByMarker[m]).map((m) => (
              <RangeBar key={m} label={m} value={latestByMarker[m].value} unit={latestByMarker[m].unit}
                low={latestByMarker[m].ref_low} high={latestByMarker[m].ref_high} previous={prevByMarker[m]} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function EmptyState({ title, body, cta, compact }) {
  return (
    <div className={`rounded-xl border border-line bg-surface ${compact ? 'p-6' : 'p-10'} text-center`}>
      <div className="font-display text-base font-semibold mb-1">{title}</div>
      <div className="text-muted text-sm mb-3">{body}</div>
      {cta}
    </div>
  )
}

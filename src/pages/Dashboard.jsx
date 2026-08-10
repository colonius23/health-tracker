import { useEffect, useState } from 'react'
import { supabaseConfigured } from '../lib/supabaseClient'
import { fetchBloodTests, fetchBodyMetrics, fetchSleep, fetchActivities } from '../lib/queries'
import MultiTrendChart from '../components/MultiTrendChart'
import TrendChart from '../components/TrendChart'
import { Link } from 'react-router-dom'

const LIPID_SERIES = [
  { key: 'tc', label: 'Total Cholesterol', color: '#EF5B5B' },
  { key: 'ldl', label: 'LDL', color: '#F2A93B' },
  { key: 'hdl', label: 'HDL', color: '#35D0A0' },
  { key: 'tg', label: 'Triglycerides', color: '#5B9BD9' },
]

export default function Dashboard() {
  const [blood, setBlood] = useState([])
  const [weight, setWeight] = useState([])
  const [sleep, setSleep] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }
    Promise.all([fetchBloodTests(), fetchBodyMetrics(), fetchSleep(180), fetchActivities(400)])
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

  // --- Cholesterol panel: TC / LDL / HDL / TG merged by date ---
  const lipidByDate = {}
  for (const row of blood) {
    const map = { 'Total Cholesterol': 'tc', 'LDL': 'ldl', 'HDL': 'hdl', 'Triglycerides': 'tg' }
    const key = map[row.marker]
    if (!key) continue
    if (!lipidByDate[row.test_date]) lipidByDate[row.test_date] = { date: row.test_date }
    lipidByDate[row.test_date][key] = row.value
  }
  const lipidData = Object.values(lipidByDate).sort((a, b) => a.date.localeCompare(b.date))
  const latestLipid = lipidData[lipidData.length - 1]

  // --- Weight trend ---
  const weightData = weight
    .filter((w) => w.weight_kg != null)
    .map((w) => ({ date: w.metric_date, value: w.weight_kg }))
    .sort((a, b) => a.date.localeCompare(b.date))
  const latestWeight = weightData[weightData.length - 1]
  const firstWeight = weightData[0]

  // --- Activity trend: weekly training minutes ---
  const byWeek = {}
  for (const a of activities) {
    const d = new Date(a.activity_date)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const label = weekStart.toISOString().slice(0, 10)
    byWeek[label] = (byWeek[label] || 0) + (a.duration_min || 0)
  }
  const activityData = Object.entries(byWeek)
    .map(([date, value]) => ({ date: date.slice(5), value: Math.round(value) }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-26)

  // --- Sleep trend: nightly duration (hrs) ---
  const sleepData = [...sleep]
    .filter((s) => s.duration_min != null)
    .sort((a, b) => a.sleep_date.localeCompare(b.sleep_date))
    .slice(-60)
    .map((s) => ({ date: s.sleep_date.slice(5), value: +(s.duration_min / 60).toFixed(1) }))

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-xl font-semibold">Overview</h1>
        <p className="text-muted text-sm mt-1">Trends across everything you're tracking.</p>
      </div>

      {/* 1. Cholesterol panel */}
      <Section
        title="Cholesterol panel"
        sub="Total cholesterol, LDL, HDL and triglycerides (mmol/L)"
        emptyLink={lipidData.length === 0 && <Link to="/upload" className="text-mint text-sm underline">Upload blood test data</Link>}
      >
        {lipidData.length > 0 && latestLipid && (
          <div className="flex gap-4 mb-3 text-xs">
            {LIPID_SERIES.map((s) => (
              latestLipid[s.key] != null && (
                <div key={s.key} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-muted">{s.label}</span>
                  <span className="font-mono text-text">{latestLipid[s.key]}</span>
                </div>
              )
            ))}
          </div>
        )}
        <MultiTrendChart data={lipidData} series={LIPID_SERIES} />
      </Section>

      {/* 2. Weight trend */}
      <Section
        title="Weight"
        sub={latestWeight && firstWeight && weightData.length > 1
          ? `${latestWeight.value} kg — ${(latestWeight.value - firstWeight.value).toFixed(1)} kg since first logged reading`
          : 'kg over time'}
        emptyLink={weightData.length === 0 && <Link to="/upload" className="text-mint text-sm underline">Upload body metrics</Link>}
      >
        <TrendChart data={weightData} unit="kg" color="#35D0A0" />
      </Section>

      {/* 3. Activity trend */}
      <Section
        title="Activity"
        sub="Weekly training minutes"
        emptyLink={activityData.length === 0 && <Link to="/upload" className="text-mint text-sm underline">Upload activities</Link>}
      >
        <TrendChart data={activityData} unit="min" color="#F2A93B" />
      </Section>

      {/* 4. Sleep trend */}
      <Section
        title="Sleep"
        sub="Nightly duration (hrs)"
        emptyLink={sleepData.length === 0 && <Link to="/upload" className="text-mint text-sm underline">Upload sleep data</Link>}
      >
        <TrendChart data={sleepData} unit="hrs" color="#5B9BD9" />
      </Section>
    </div>
  )
}

function Section({ title, sub, emptyLink, children }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="font-display text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted mt-0.5">{sub}</p>
        </div>
        {emptyLink}
      </div>
      <div className="rounded-xl border border-line bg-surface p-4">
        {children}
      </div>
    </section>
  )
}

function EmptyState({ title, body, cta }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-10 text-center">
      <div className="font-display text-base font-semibold mb-1">{title}</div>
      <div className="text-muted text-sm mb-3">{body}</div>
      {cta}
    </div>
  )
}

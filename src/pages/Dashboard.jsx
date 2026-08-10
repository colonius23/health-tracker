import { useEffect, useState } from 'react'
import { supabaseConfigured } from '../lib/supabaseClient'
import { fetchBloodTests, fetchBodyMetrics, fetchSleep, fetchActivities, fetchVitals } from '../lib/queries'
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
  const [vitals, setVitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }
    Promise.all([fetchBloodTests(), fetchBodyMetrics(), fetchSleep(3000), fetchActivities(3000), fetchVitals()])
      .then(([b, w, s, a, v]) => { setBlood(b); setWeight(w); setSleep(s); setActivities(a); setVitals(v) })
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

  // --- Activity trend: total minutes per month ---
  const activityByMonth = {}
  for (const a of activities) {
    const month = a.activity_date.slice(0, 7)
    activityByMonth[month] = (activityByMonth[month] || 0) + (a.duration_min || 0)
  }
  const activityData = Object.entries(activityByMonth)
    .map(([date, value]) => ({ date, value: Math.round(value) }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // --- Sleep trend: average nightly duration (hrs) per month ---
  const sleepByMonth = {}
  for (const s of sleep) {
    if (s.duration_min == null) continue
    const month = s.sleep_date.slice(0, 7)
    if (!sleepByMonth[month]) sleepByMonth[month] = { sum: 0, n: 0 }
    sleepByMonth[month].sum += s.duration_min
    sleepByMonth[month].n += 1
  }
  const sleepData = Object.entries(sleepByMonth)
    .map(([date, { sum, n }]) => ({ date, value: +((sum / n) / 60).toFixed(1) }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // --- Vitals trend: average heart rate per month ---
  const vitalsByMonth = {}
  for (const v of vitals) {
    if (v.avg_hr == null) continue
    const month = v.recorded_date.slice(0, 7)
    if (!vitalsByMonth[month]) vitalsByMonth[month] = { sum: 0, n: 0 }
    vitalsByMonth[month].sum += v.avg_hr
    vitalsByMonth[month].n += 1
  }
  const vitalsData = Object.entries(vitalsByMonth)
    .map(([date, { sum, n }]) => ({ date, value: Math.round((sum / n) * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date))

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
        sub="Total training minutes per month"
        emptyLink={activityData.length === 0 && <Link to="/upload" className="text-mint text-sm underline">Upload activities</Link>}
      >
        <TrendChart data={activityData} unit="min" color="#F2A93B" />
      </Section>

      {/* 4. Sleep trend */}
      <Section
        title="Sleep"
        sub="Average nightly duration per month (hrs)"
        emptyLink={sleepData.length === 0 && <Link to="/upload" className="text-mint text-sm underline">Upload sleep data</Link>}
      >
        <TrendChart data={sleepData} unit="hrs" color="#5B9BD9" />
      </Section>

      {/* 5. Vitals trend */}
      <Section
        title="Vitals"
        sub="Average heart rate per month (bpm)"
        emptyLink={vitalsData.length === 0 && <Link to="/upload" className="text-mint text-sm underline">Upload vitals data</Link>}
      >
        <TrendChart data={vitalsData} unit="bpm" color="#EF5B5B" />
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

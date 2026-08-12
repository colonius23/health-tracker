import { useEffect, useState, useMemo } from 'react'
import { supabaseConfigured } from '../lib/supabaseClient'
import { fetchBloodTests, fetchBodyMetrics, fetchSleep, fetchActivities, fetchVitals, fetchSettings } from '../lib/queries'
import MultiTrendChart from '../components/MultiTrendChart'
import TrendChart from '../components/TrendChart'
import RangeSelector, { cutoffDate } from '../components/RangeSelector'
import StatCard from '../components/StatCard'
import { Link } from 'react-router-dom'

const LIPID_SERIES = [
  { key: 'tc', label: 'Total Cholesterol', color: '#EF5B5B' },
  { key: 'ldl', label: 'LDL', color: '#F2A93B' },
  { key: 'hdl', label: 'HDL', color: '#35D0A0' },
  { key: 'tg', label: 'Triglycerides', color: '#5B9BD9' },
]

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000)
}

export default function Dashboard() {
  const [blood, setBlood] = useState([])
  const [weight, setWeight] = useState([])
  const [sleep, setSleep] = useState([])
  const [activities, setActivities] = useState([])
  const [vitals, setVitals] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [range, setRange] = useState('90d')

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }
    Promise.all([fetchBloodTests(), fetchBodyMetrics(), fetchSleep(3000), fetchActivities(3000), fetchVitals(), fetchSettings()])
      .then(([b, w, s, a, v, st]) => { setBlood(b); setWeight(w); setSleep(s); setActivities(a); setVitals(v); setSettings(st) })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [])

  const dietStart = settings.diet_start_date || null
  const goalWeight = settings.goal_weight_kg ? parseFloat(settings.goal_weight_kg) : null

  const chartCutoff = cutoffDate(range)
  const inRange = (d) => !chartCutoff || d >= chartCutoff

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

  // --- Lipid panel: TC / LDL / HDL / TG merged by date, plus Non-HDL & ratio derived ---
  const lipidByDate = {}
  for (const row of blood) {
    const map = { 'Total Cholesterol': 'tc', 'LDL': 'ldl', 'HDL': 'hdl', 'Triglycerides': 'tg' }
    const key = map[row.marker]
    if (!key) continue
    if (!lipidByDate[row.test_date]) lipidByDate[row.test_date] = { date: row.test_date }
    lipidByDate[row.test_date][key] = row.value
  }
  const allLipidData = Object.values(lipidByDate).sort((a, b) => a.date.localeCompare(b.date))
  const lipidData = allLipidData.filter((d) => inRange(d.date))
  const latestLipid = allLipidData[allLipidData.length - 1]

  const derivedRiskData = allLipidData
    .filter((d) => d.tc != null && d.hdl != null)
    .map((d) => ({ date: d.date, nonHdl: +(d.tc - d.hdl).toFixed(2), ratio: +(d.tc / d.hdl).toFixed(2) }))
  const latestRisk = derivedRiskData[derivedRiskData.length - 1]

  // --- Weight trend + projection ---
  const allWeightData = weight
    .filter((w) => w.weight_kg != null)
    .map((w) => ({ date: w.metric_date, value: w.weight_kg }))
    .sort((a, b) => a.date.localeCompare(b.date))
  const weightData = allWeightData.filter((d) => inRange(d.date))
  const latestWeight = allWeightData[allWeightData.length - 1]

  let weightWithProjection = weightData
  if (latestWeight && allWeightData.length > 5) {
    const last30cut = new Date(latestWeight.date); last30cut.setDate(last30cut.getDate() - 30)
    const recent = allWeightData.filter((d) => d.date >= last30cut.toISOString().slice(0, 10))
    if (recent.length >= 2) {
      const first = recent[0], last = recent[recent.length - 1]
      const days = Math.max(daysBetween(first.date, last.date), 1)
      const ratePerDay = (last.value - first.value) / days
      const projPoints = []
      for (let i = 0; i <= 60; i += 7) {
        const d = new Date(latestWeight.date); d.setDate(d.getDate() + i)
        projPoints.push({ date: d.toISOString().slice(0, 10), projected: +(latestWeight.value + ratePerDay * i).toFixed(1) })
      }
      const merged = [...weightData.map((d) => ({ ...d })), ...projPoints]
      // stitch the join point so the dashed line connects to the solid line
      const joinIdx = merged.findIndex((d) => d.date === latestWeight.date)
      if (joinIdx !== -1) merged[joinIdx].projected = merged[joinIdx].value
      weightWithProjection = merged
    }
  }

  // --- Activity: total minutes per month ---
  const activityByMonth = {}
  for (const a of activities) {
    if (!inRange(a.activity_date)) continue
    const month = a.activity_date.slice(0, 7)
    activityByMonth[month] = (activityByMonth[month] || 0) + (a.duration_min || 0)
  }
  const activityData = Object.entries(activityByMonth)
    .map(([date, value]) => ({ date, value: Math.round(value) }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // --- Sleep: average nightly duration (hrs) per month ---
  const sleepByMonth = {}
  for (const s of sleep) {
    if (s.duration_min == null || !inRange(s.sleep_date)) continue
    const month = s.sleep_date.slice(0, 7)
    if (!sleepByMonth[month]) sleepByMonth[month] = { sum: 0, n: 0 }
    sleepByMonth[month].sum += s.duration_min
    sleepByMonth[month].n += 1
  }
  const sleepData = Object.entries(sleepByMonth)
    .map(([date, { sum, n }]) => ({ date, value: +((sum / n) / 60).toFixed(1) }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // --- Vitals: average heart rate per month ---
  const vitalsByMonth = {}
  for (const v of vitals) {
    if (v.avg_hr == null || !inRange(v.recorded_date)) continue
    const month = v.recorded_date.slice(0, 7)
    if (!vitalsByMonth[month]) vitalsByMonth[month] = { sum: 0, n: 0 }
    vitalsByMonth[month].sum += v.avg_hr
    vitalsByMonth[month].n += 1
  }
  const vitalsData = Object.entries(vitalsByMonth)
    .map(([date, { sum, n }]) => ({ date, value: Math.round((sum / n) * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // --- Insights: auto pre/post comparison around dietStart ---
  const insights = useMemo(() => {
    if (!dietStart) return null
    const preStart = new Date(dietStart); preStart.setDate(preStart.getDate() - 60)
    const preStartStr = preStart.toISOString().slice(0, 10)

    const out = {}

    // weight
    const preW = allWeightData.filter((d) => d.date < dietStart)
    const postW = allWeightData.filter((d) => d.date >= dietStart)
    if (preW.length && postW.length) {
      const base = preW[preW.length - 1]
      const latest = postW[postW.length - 1]
      const days = Math.max(daysBetween(base.date, latest.date), 1)
      out.weight = {
        baseline: base.value, latest: latest.value, days,
        totalChange: +(base.value - latest.value).toFixed(1),
        weeklyRate: +((base.value - latest.value) / days * 7).toFixed(2),
      }
    }

    // sleep
    const preS = sleep.filter((s) => s.duration_min != null && s.sleep_date >= preStartStr && s.sleep_date < dietStart)
    const postS = sleep.filter((s) => s.duration_min != null && s.sleep_date >= dietStart)
    if (preS.length && postS.length) {
      const avg = (arr) => arr.reduce((s, r) => s + r.duration_min, 0) / arr.length / 60
      out.sleep = { preAvg: +avg(preS).toFixed(2), postAvg: +avg(postS).toFixed(2), preN: preS.length, postN: postS.length }
    }

    // resting HR
    const preHr = vitals.filter((v) => v.resting_hr != null && v.recorded_date >= preStartStr && v.recorded_date < dietStart)
    const postHr = vitals.filter((v) => v.resting_hr != null && v.recorded_date >= dietStart)
    if (preHr.length && postHr.length) {
      const avg = (arr) => arr.reduce((s, r) => s + Number(r.resting_hr), 0) / arr.length
      out.restingHr = { preAvg: +avg(preHr).toFixed(1), postAvg: +avg(postHr).toFixed(1), preN: preHr.length, postN: postHr.length }
    }

    // activity
    const preA = activities.filter((a) => a.activity_date >= preStartStr && a.activity_date < dietStart)
    const postA = activities.filter((a) => a.activity_date >= dietStart)
    const preWeeks = 60 / 7
    const postWeeks = Math.max(daysBetween(dietStart, new Date().toISOString().slice(0, 10)) / 7, 1)
    out.activity = {
      preSessions: preA.length, postSessions: postA.length,
      preMinPerWeek: Math.round(preA.reduce((s, a) => s + (parseFloat(a.duration_min) || 0), 0) / preWeeks),
      postMinPerWeek: Math.round(postA.reduce((s, a) => s + (parseFloat(a.duration_min) || 0), 0) / postWeeks),
    }

    // lipids
    out.lipids = {}
    for (const marker of ['Total Cholesterol', 'LDL', 'HDL', 'Triglycerides']) {
      const rows = blood.filter((b) => b.marker === marker).sort((a, b) => a.test_date.localeCompare(b.test_date))
      const pre = rows.filter((r) => r.test_date < dietStart)
      const post = rows.filter((r) => r.test_date >= dietStart)
      if (pre.length) {
        out.lipids[marker] = { pre: pre[pre.length - 1].value, preDate: pre[pre.length - 1].test_date,
          post: post.length ? post[post.length - 1].value : null, postDate: post.length ? post[post.length - 1].test_date : null }
      }
    }

    return out
  }, [dietStart, allWeightData, sleep, vitals, activities, blood])

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold">Overview</h1>
          <p className="text-muted text-sm mt-1">Trends across everything you're tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <RangeSelector value={range} onChange={setRange} />
          <Link to="/report" className="text-xs px-3 py-1.5 rounded-lg border border-line text-muted hover:text-text">
            GP Report →
          </Link>
        </div>
      </div>

      {insights && (
        <section className="rounded-xl border border-mint/30 bg-mint/5 p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-sm font-semibold text-mint">Insights since {dietStart}</h2>
            <Link to="/settings" className="text-xs text-muted underline">change date</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {insights.weight && (
              <div>
                <span className="text-muted">Weight: </span>
                <span className="font-mono">{insights.weight.baseline} → {insights.weight.latest} kg</span>
                <span className="text-mint"> ({insights.weight.totalChange > 0 ? '−' : '+'}{Math.abs(insights.weight.totalChange)} kg, {insights.weight.weeklyRate > 0 ? '−' : '+'}{Math.abs(insights.weight.weeklyRate)} kg/wk)</span>
              </div>
            )}
            {insights.sleep && (
              <div>
                <span className="text-muted">Sleep: </span>
                <span className="font-mono">{insights.sleep.preAvg} → {insights.sleep.postAvg} hrs</span>
                <span className="text-muted text-xs"> (n={insights.sleep.preN}→{insights.sleep.postN})</span>
              </div>
            )}
            {insights.restingHr && (
              <div>
                <span className="text-muted">Resting HR: </span>
                <span className="font-mono">{insights.restingHr.preAvg} → {insights.restingHr.postAvg} bpm</span>
                <span className="text-muted text-xs"> (n={insights.restingHr.preN}→{insights.restingHr.postN}{insights.restingHr.postN < 10 ? ', low confidence' : ''})</span>
              </div>
            )}
            {insights.activity && (
              <div>
                <span className="text-muted">Activity: </span>
                <span className="font-mono">{insights.activity.preMinPerWeek} → {insights.activity.postMinPerWeek} min/wk</span>
              </div>
            )}
            {Object.entries(insights.lipids || {}).map(([marker, v]) => v.post != null && (
              <div key={marker}>
                <span className="text-muted">{marker}: </span>
                <span className="font-mono">{v.pre} → {v.post} mmol/L</span>
                <span className={v.post < v.pre ? 'text-mint' : 'text-amber'}> ({v.post < v.pre ? '−' : '+'}{Math.abs(+(v.pre - v.post).toFixed(2))})</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 1. Cholesterol panel */}
      <Section
        title="Cholesterol panel"
        sub="Total cholesterol, LDL, HDL and triglycerides (mmol/L)"
        emptyLink={lipidData.length === 0 && <Link to="/upload" className="text-mint text-sm underline">Upload blood test data</Link>}
      >
        {lipidData.length > 0 && latestLipid && (
          <div className="flex gap-4 mb-3 text-xs flex-wrap">
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
        <MultiTrendChart data={lipidData} series={LIPID_SERIES} referenceDate={dietStart} referenceLabel="Diet start" />
      
      </Section>

      {/* 1b. Risk ratios */}
      {latestRisk && (
        <Section title="Risk ratios" sub="Non-HDL cholesterol and Total/HDL ratio — targets from your lab reports">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="rounded-lg bg-surface-2 p-3">
              <div className="text-xs text-muted mb-1">Non-HDL Cholesterol</div>
              <div className="font-mono text-lg" style={{ color: latestRisk.nonHdl < 3.3 ? '#35D0A0' : latestRisk.nonHdl < 4.0 ? '#F2A93B' : '#EF5B5B' }}>
                {latestRisk.nonHdl} <span className="text-xs text-muted">mmol/L</span>
              </div>
              <div className="text-[10px] text-muted mt-1">target &lt;3.3 (high risk) / &lt;2.5 (very high risk)</div>
            </div>
            <div className="rounded-lg bg-surface-2 p-3">
              <div className="text-xs text-muted mb-1">Total / HDL Ratio</div>
              <div className="font-mono text-lg" style={{ color: latestRisk.ratio < 5.0 ? '#35D0A0' : latestRisk.ratio < 6.0 ? '#F2A93B' : '#EF5B5B' }}>
                {latestRisk.ratio}
              </div>
              <div className="text-[10px] text-muted mt-1">target &lt;5.0</div>
            </div>
          </div>
          <TrendChart data={derivedRiskData.filter((d) => inRange(d.date))} dataKey="nonHdl" unit="mmol/L" color="#EF5B5B" height={160} referenceDate={dietStart} referenceLabel="Diet start" />
        </Section>
      )}

      {/* 2. Weight trend */}
      <Section
        title="Weight"
        sub={latestWeight ? `${latestWeight.value} kg${goalWeight ? ` — goal ${goalWeight} kg` : ''} — dashed line is a 60-day projection from the last 30 days' rate` : 'kg over time'}
        emptyLink={weightData.length === 0 && <Link to="/upload" className="text-mint text-sm underline">Upload body metrics</Link>}
      >
        <TrendChart data={weightWithProjection} unit="kg" color="#35D0A0" projectionKey="projected" referenceDate={dietStart} referenceLabel="Diet start" />
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

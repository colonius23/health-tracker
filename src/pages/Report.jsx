import { useEffect, useState } from 'react'
import { supabaseConfigured } from '../lib/supabaseClient'
import { fetchBloodTests, fetchBodyMetrics, fetchSleep, fetchActivities, fetchSettings } from '../lib/queries'

export default function Report() {
  const [blood, setBlood] = useState([])
  const [weight, setWeight] = useState([])
  const [sleep, setSleep] = useState([])
  const [activities, setActivities] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }
    Promise.all([fetchBloodTests(), fetchBodyMetrics(), fetchSleep(3000), fetchActivities(3000), fetchSettings()])
      .then(([b, w, s, a, st]) => { setBlood(b); setWeight(w); setSleep(s); setActivities(a); setSettings(st) })
      .finally(() => setLoading(false))
  }, [])

  if (!supabaseConfigured) return <div className="text-muted text-sm">Connect Supabase in Settings first.</div>
  if (loading) return <div className="text-muted text-sm">Loading…</div>

  const dietStart = settings.diet_start_date || null
  const today = new Date().toISOString().slice(0, 10)

  const markers = ['Total Cholesterol', 'LDL', 'HDL', 'Triglycerides', 'Non-HDL Cholesterol']
  const byMarker = {}
  for (const m of markers) {
    byMarker[m] = blood.filter((b) => b.marker === m).sort((a, b) => a.test_date.localeCompare(b.test_date))
  }
  const allDates = [...new Set(blood.map((b) => b.test_date))].sort()

  const weightSorted = weight.filter((w) => w.weight_kg != null).sort((a, b) => a.metric_date.localeCompare(b.metric_date))
  const firstW = weightSorted[0]
  const lastW = weightSorted[weightSorted.length - 1]

  const sleepWithData = sleep.filter((s) => s.duration_min != null)
  const avgSleepHrs = sleepWithData.length ? (sleepWithData.reduce((s, r) => s + r.duration_min, 0) / sleepWithData.length / 60).toFixed(1) : null

  const totalActivityMin = activities.reduce((s, a) => s + (parseFloat(a.duration_min) || 0), 0)

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="font-display text-xl font-semibold">GP Summary Report</h1>
        <button onClick={() => window.print()} className="px-4 py-1.5 rounded-lg bg-mint text-bg text-xs font-medium">
          Print / Save as PDF
        </button>
      </div>

      <div className="bg-white text-black rounded-xl p-8 print:p-0 print:rounded-none space-y-6 text-sm leading-relaxed">
        <div className="border-b border-gray-300 pb-4">
          <h2 className="text-lg font-semibold">Health Summary</h2>
          <p className="text-gray-600 text-xs mt-1">Generated {today}{dietStart ? ` · Diet/program start: ${dietStart}` : ''}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Lipid panel history</h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-300 text-left">
                <th className="py-1 pr-3">Date</th>
                {markers.map((m) => <th key={m} className="py-1 pr-3">{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {allDates.map((d) => (
                <tr key={d} className="border-b border-gray-100">
                  <td className="py-1 pr-3 font-mono">{d}</td>
                  {markers.map((m) => {
                    const row = byMarker[m].find((r) => r.test_date === d)
                    return <td key={m} className="py-1 pr-3 font-mono">{row ? `${row.value}` : '–'}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-500 mt-2">All values mmol/L. Non-HDL computed as Total Cholesterol minus HDL where not directly reported.</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Weight</h3>
          {firstW && lastW ? (
            <p>
              {firstW.metric_date}: {firstW.weight_kg} kg → {lastW.metric_date}: {lastW.weight_kg} kg
              {' '}({(firstW.weight_kg - lastW.weight_kg > 0 ? '−' : '+')}{Math.abs(firstW.weight_kg - lastW.weight_kg).toFixed(1)} kg over the tracked period)
            </p>
          ) : <p className="text-gray-500">No weight data.</p>}
        </div>

        <div>
          <h3 className="font-semibold mb-2">Sleep &amp; activity</h3>
          <p>Average nightly sleep: {avgSleepHrs ? `${avgSleepHrs} hrs` : 'no data'} ({sleepWithData.length} nights recorded)</p>
          <p>Total logged activity: {Math.round(totalActivityMin / 60)} hrs across {activities.length} sessions</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Notes for discussion</h3>
          <div className="border border-gray-300 rounded p-4 h-32 print:h-40" />
        </div>
      </div>
    </div>
  )
}

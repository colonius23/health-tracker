import { useEffect, useState, useMemo } from 'react'
import { supabaseConfigured } from '../lib/supabaseClient'
import { fetchBloodTests } from '../lib/queries'
import RangeBar from '../components/RangeBar'
import TrendChart from '../components/TrendChart'

export default function BloodTests() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }
    fetchBloodTests().then(setRows).finally(() => setLoading(false))
  }, [])

  const byMarker = useMemo(() => {
    const map = {}
    for (const r of rows) {
      if (!map[r.marker]) map[r.marker] = []
      map[r.marker].push(r)
    }
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.test_date.localeCompare(b.test_date)))
    return map
  }, [rows])

  const markers = Object.keys(byMarker).sort()
  const active = selected || markers[0]

  if (!supabaseConfigured) return <div className="text-muted text-sm">Connect Supabase in Settings first.</div>
  if (loading) return <div className="text-muted text-sm">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Blood Tests</h1>
        <p className="text-muted text-sm mt-1">{rows.length} results across {markers.length} markers.</p>
      </div>

      {markers.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-muted text-sm">
          No blood test data yet. Upload results on the Upload Data page.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {markers.map((m) => {
              const arr = byMarker[m]
              const latest = arr[arr.length - 1]
              const prev = arr.length > 1 ? arr[arr.length - 2].value : undefined
              return (
                <button key={m} onClick={() => setSelected(m)} className={`text-left rounded-xl transition-all ${active === m ? 'ring-1 ring-mint' : ''}`}>
                  <RangeBar label={m} value={latest.value} unit={latest.unit} low={latest.ref_low} high={latest.ref_high} previous={prev} />
                </button>
              )
            })}
          </div>

          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="text-sm text-muted mb-3">{active} — history</h2>
            <TrendChart
              data={byMarker[active].map((r) => ({ date: r.test_date, value: r.value }))}
              unit={byMarker[active][0]?.unit || ''}
              color="#5B9BD9"
            />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-line">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Value</th>
                    <th className="py-2 pr-4">Range</th>
                    <th className="py-2 pr-4">Panel</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {[...byMarker[active]].reverse().map((r) => (
                    <tr key={r.id} className="border-b border-line/50">
                      <td className="py-2 pr-4">{r.test_date}</td>
                      <td className="py-2 pr-4">{r.value} {r.unit}</td>
                      <td className="py-2 pr-4 text-muted">{r.ref_low ?? '–'}–{r.ref_high ?? '–'}</td>
                      <td className="py-2 pr-4 text-muted font-sans">{r.panel_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

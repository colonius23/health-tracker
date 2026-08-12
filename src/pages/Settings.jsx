import { useEffect, useState } from 'react'
import { supabaseConfigured } from '../lib/supabaseClient'
import { fetchSettings, upsertSetting } from '../lib/queries'

export default function Settings() {
  const [dietStart, setDietStart] = useState('')
  const [goalWeight, setGoalWeight] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }
    fetchSettings().then((s) => {
      setDietStart(s.diet_start_date || '')
      setGoalWeight(s.goal_weight_kg || '')
    }).finally(() => setLoading(false))
  }, [])

  async function save() {
    setStatus('Saving…')
    try {
      if (dietStart) await upsertSetting('diet_start_date', dietStart)
      if (goalWeight) await upsertSetting('goal_weight_kg', goalWeight)
      setStatus('Saved.')
    } catch (e) {
      setStatus(`Error: ${e.message}`)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-xl font-semibold">Settings</h1>
        <p className="text-muted text-sm mt-1">Connection status, goals, and iPhone Shortcut setup.</p>
      </div>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="font-display text-sm font-semibold mb-2">Database connection</h2>
        <div className={`text-sm ${supabaseConfigured ? 'text-mint' : 'text-red'}`}>
          {supabaseConfigured ? '● Connected' : '● Not connected'}
        </div>
        <p className="text-xs text-muted mt-2">
          Set <span className="font-mono">VITE_SUPABASE_URL</span> and <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> as
          environment variables in Vercel (Project → Settings → Environment Variables), then redeploy.
        </p>
      </section>

      {supabaseConfigured && (
        <section className="rounded-xl border border-line bg-surface p-5 space-y-4">
          <h2 className="font-display text-sm font-semibold">Goals</h2>
          <p className="text-xs text-muted">
            Used to draw a reference line on charts and compute the Overview insights panel (before vs. after comparison).
          </p>
          {loading ? (
            <div className="text-muted text-sm">Loading…</div>
          ) : (
            <>
              <div>
                <label className="text-xs text-muted block mb-1">Diet / program start date</label>
                <input
                  type="date"
                  value={dietStart}
                  onChange={(e) => setDietStart(e.target.value)}
                  className="bg-surface-2 border border-line rounded-lg px-3 py-1.5 text-sm text-text w-full"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Goal weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  className="bg-surface-2 border border-line rounded-lg px-3 py-1.5 text-sm text-text w-full font-mono"
                  placeholder="e.g. 80"
                />
              </div>
              <button onClick={save} className="px-4 py-1.5 rounded-lg bg-mint text-bg text-xs font-medium">
                Save
              </button>
              {status && <div className="text-xs text-muted">{status}</div>}
            </>
          )}
        </section>
      )}

      <section className="rounded-xl border border-line bg-surface p-5 space-y-2">
        <h2 className="font-display text-sm font-semibold mb-1">iPhone Shortcut — push data automatically</h2>
        <p className="text-xs text-muted">
          Your Supabase project exposes a REST endpoint automatically. In the Shortcuts app, use
          <span className="font-mono text-text"> Get Contents of URL </span> with:
        </p>
        <ul className="text-xs text-muted list-disc pl-4 space-y-1">
          <li><span className="text-text">URL:</span> <span className="font-mono">https://YOUR-PROJECT.supabase.co/rest/v1/sleep</span> (or activities / body_metrics / vitals)</li>
          <li><span className="text-text">Method:</span> POST</li>
          <li><span className="text-text">Headers:</span> <span className="font-mono">apikey</span> and <span className="font-mono">Authorization: Bearer YOUR_ANON_KEY</span>, plus <span className="font-mono">Content-Type: application/json</span></li>
          <li><span className="text-text">Body:</span> JSON dictionary matching the table's columns, built from Shortcuts' Health actions</li>
        </ul>
      </section>
    </div>
  )
}

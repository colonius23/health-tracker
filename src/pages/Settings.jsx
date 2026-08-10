import { supabaseConfigured } from '../lib/supabaseClient'

export default function Settings() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-xl font-semibold">Settings</h1>
        <p className="text-muted text-sm mt-1">Connection status and iPhone Shortcut setup.</p>
      </div>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="font-display text-sm font-semibold mb-2">Database connection</h2>
        <div className={`text-sm ${supabaseConfigured ? 'text-mint' : 'text-red'}`}>
          {supabaseConfigured ? '● Connected' : '● Not connected'}
        </div>
        <p className="text-xs text-muted mt-2">
          Set <span className="font-mono">VITE_SUPABASE_URL</span> and <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> as
          environment variables in Vercel (Project → Settings → Environment Variables), then redeploy. See the README for the full setup.
        </p>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5 space-y-2">
        <h2 className="font-display text-sm font-semibold mb-1">iPhone Shortcut — push data automatically</h2>
        <p className="text-xs text-muted">
          Your Supabase project exposes a REST endpoint automatically. In the Shortcuts app, use
          <span className="font-mono text-text"> Get Contents of URL </span> with:
        </p>
        <ul className="text-xs text-muted list-disc pl-4 space-y-1">
          <li><span className="text-text">URL:</span> <span className="font-mono">https://YOUR-PROJECT.supabase.co/rest/v1/sleep</span> (or activities / body_metrics)</li>
          <li><span className="text-text">Method:</span> POST</li>
          <li><span className="text-text">Headers:</span> <span className="font-mono">apikey</span> and <span className="font-mono">Authorization: Bearer YOUR_ANON_KEY</span>, plus <span className="font-mono">Content-Type: application/json</span></li>
          <li><span className="text-text">Body:</span> JSON dictionary matching the table's columns, built from Shortcuts' Health actions (e.g. "Get Sleep Analysis", "Get Steps")</li>
        </ul>
        <p className="text-xs text-muted">Full step-by-step build instructions are in the README's "iPhone Shortcut" section.</p>
      </section>
    </div>
  )
}

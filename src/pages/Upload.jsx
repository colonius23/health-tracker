import { useState } from 'react'
import Papa from 'papaparse'
import { supabase, supabaseConfigured } from '../lib/supabaseClient'
import { insertRows } from '../lib/queries'

const TEMPLATES = {
  blood_tests: {
    label: 'Blood Tests',
    columns: ['test_date', 'marker', 'value', 'unit', 'ref_low', 'ref_high', 'panel_name'],
    example: '2026-06-01,LDL,4.2,mmol/L,0,3.4,Lipid Panel',
    numeric: ['value', 'ref_low', 'ref_high'],
  },
  activities: {
    label: 'Activities',
    columns: ['activity_date', 'type', 'duration_min', 'distance_km', 'avg_hr', 'max_hr', 'calories', 'elevation_gain', 'source'],
    example: '2026-06-01,Run,42,7.5,148,171,410,85,Garmin',
    numeric: ['duration_min', 'distance_km', 'avg_hr', 'max_hr', 'calories', 'elevation_gain'],
  },
  sleep: {
    label: 'Sleep',
    columns: ['sleep_date', 'duration_min', 'deep_min', 'light_min', 'rem_min', 'awake_min', 'score', 'source'],
    example: '2026-06-01,435,90,240,80,25,78,Garmin',
    numeric: ['duration_min', 'deep_min', 'light_min', 'rem_min', 'awake_min', 'score'],
  },
  body_metrics: {
    label: 'Body Metrics (weight etc.)',
    columns: ['metric_date', 'weight_kg', 'body_fat_pct', 'source'],
    example: '2026-06-01,97.0,,Manual',
    numeric: ['weight_kg', 'body_fat_pct'],
  },
}

export default function Upload() {
  const [table, setTable] = useState('blood_tests')
  const [status, setStatus] = useState(null)
  const [pdfStatus, setPdfStatus] = useState(null)
  const tpl = TEMPLATES[table]

  function handleCsv(file) {
    setStatus('Parsing…')
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data.map((row) => {
            const clean = {}
            for (const col of tpl.columns) {
              let v = row[col]
              if (v === '' || v === undefined) { clean[col] = null; continue }
              clean[col] = tpl.numeric.includes(col) ? Number(v) : v
            }
            return clean
          })
          await insertRows(table, rows)
          setStatus(`Imported ${rows.length} rows into ${tpl.label}.`)
        } catch (e) {
          setStatus(`Error: ${e.message}`)
        }
      },
      error: (e) => setStatus(`Error: ${e.message}`),
    })
  }

  async function handlePdf(file) {
    if (!supabase) return
    setPdfStatus('Uploading…')
    const path = `blood-tests/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('lab-reports').upload(path, file)
    if (error) setPdfStatus(`Error: ${error.message}`)
    else setPdfStatus(`Stored: ${file.name}. Now add its values via CSV or the values you get from Claude.`)
  }

  if (!supabaseConfigured) return <div className="text-muted text-sm">Connect Supabase in Settings first.</div>

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-xl font-semibold">Upload Data</h1>
        <p className="text-muted text-sm mt-1">Bulk import via CSV, or store original lab PDFs for reference.</p>
      </div>

      <section className="rounded-xl border border-line bg-surface p-5 space-y-4">
        <h2 className="font-display text-sm font-semibold">CSV import</h2>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <button key={key} onClick={() => setTable(key)}
              className={`px-3 py-1.5 rounded-lg text-xs border ${table === key ? 'border-mint text-mint bg-mint/10' : 'border-line text-muted'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted font-mono bg-surface-2 rounded-lg p-3 overflow-x-auto">
          <div className="text-text mb-1">{tpl.columns.join(',')}</div>
          <div>{tpl.example}</div>
        </div>
        <input type="file" accept=".csv" onChange={(e) => e.target.files[0] && handleCsv(e.target.files[0])}
          className="text-sm text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-mint file:text-bg file:text-xs file:font-medium file:cursor-pointer cursor-pointer" />
        {status && <div className="text-xs text-mint">{status}</div>}
      </section>

      <section className="rounded-xl border border-line bg-surface p-5 space-y-3">
        <h2 className="font-display text-sm font-semibold">Store a lab PDF</h2>
        <p className="text-xs text-muted">
          Keeps the original report for reference. To get the actual values into your dashboard, paste the PDF into
          Claude in a chat first and ask it to extract the values as a CSV matching the Blood Tests template above,
          then import that CSV here.
        </p>
        <input type="file" accept=".pdf" onChange={(e) => e.target.files[0] && handlePdf(e.target.files[0])}
          className="text-sm text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-surface-2 file:text-text file:text-xs file:font-medium file:cursor-pointer cursor-pointer" />
        {pdfStatus && <div className="text-xs text-blue">{pdfStatus}</div>}
      </section>
    </div>
  )
}

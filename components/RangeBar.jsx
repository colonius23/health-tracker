// Signature element: shows where a lab value sits relative to its reference
// range, plus how it moved since the previous reading.
export default function RangeBar({ label, value, unit, low, high, previous }) {
  const hasRange = typeof low === 'number' && typeof high === 'number' && high > low
  const span = hasRange ? high - low : 1
  const padded = hasRange ? span * 0.35 : 0
  const min = hasRange ? low - padded : value - 1
  const max = hasRange ? high + padded : value + 1
  const pct = (v) => Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))

  let status = 'mint'
  if (hasRange && (value < low || value > high)) status = 'red'
  else if (hasRange && (value < low + span * 0.08 || value > high - span * 0.08)) status = 'amber'

  const statusColor = { mint: 'var(--color-mint)', amber: 'var(--color-amber)', red: 'var(--color-red)' }[status]

  const delta = typeof previous === 'number' ? value - previous : null

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm text-muted">{label}</span>
        {delta !== null && (
          <span className={`text-xs font-mono ${delta === 0 ? 'text-muted' : delta > 0 ? 'text-amber' : 'text-mint'}`}>
            {delta > 0 ? '▲' : delta < 0 ? '▼' : '–'} {Math.abs(delta).toFixed(2)}
          </span>
        )}
      </div>
      <div className="flex items-end gap-1 mb-3">
        <span className="text-2xl font-mono font-semibold" style={{ color: statusColor }}>{value}</span>
        <span className="text-xs text-muted mb-0.5">{unit}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-surface-2 overflow-visible">
        {hasRange && (
          <div
            className="absolute h-1.5 rounded-full bg-line"
            style={{ left: `${pct(low)}%`, width: `${pct(high) - pct(low)}%` }}
          />
        )}
        <div
          className="absolute -top-1 w-3.5 h-3.5 rounded-full border-2 border-bg"
          style={{ left: `calc(${pct(value)}% - 7px)`, backgroundColor: statusColor }}
        />
      </div>
      {hasRange && (
        <div className="flex justify-between mt-1.5 text-[10px] text-muted font-mono">
          <span>{low}</span>
          <span>{high}</span>
        </div>
      )}
    </div>
  )
}

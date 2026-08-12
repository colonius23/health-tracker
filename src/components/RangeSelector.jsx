const OPTIONS = [
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: '1y', label: '1Y' },
  { key: 'all', label: 'All' },
]

export default function RangeSelector({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-line overflow-hidden text-xs">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`px-2.5 py-1 transition-colors ${value === o.key ? 'bg-mint text-bg font-medium' : 'text-muted hover:text-text'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function cutoffDate(rangeKey) {
  if (rangeKey === 'all') return null
  const days = { '30d': 30, '90d': 90, '1y': 365 }[rangeKey]
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

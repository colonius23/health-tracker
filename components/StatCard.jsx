export default function StatCard({ label, value, unit, sub, accent = 'mint' }) {
  const colorMap = { mint: 'text-mint', amber: 'text-amber', red: 'text-red', blue: 'text-blue' }
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs text-muted mb-2">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-mono font-semibold ${colorMap[accent]}`}>{value}</span>
        {unit && <span className="text-xs text-muted">{unit}</span>}
      </div>
      {sub && <div className="text-[11px] text-muted mt-1">{sub}</div>}
    </div>
  )
}

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

// Multiple series on one chart, e.g. TC / HDL / LDL / TG over time, all in mmol/L.
export default function MultiTrendChart({ data, series, height = 260, referenceDate, referenceLabel }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-muted text-sm">No data yet</div>
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#223049" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" stroke="#8A97AC" fontSize={11} tickLine={false} axisLine={{ stroke: '#223049' }} />
        <YAxis stroke="#8A97AC" fontSize={11} tickLine={false} axisLine={false} width={38} />
        <Tooltip
          contentStyle={{ background: '#121B2E', border: '1px solid #223049', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#8A97AC' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#8A97AC' }} />
        {referenceDate && (
          <ReferenceLine x={referenceDate} stroke="#F2A93B" strokeDasharray="4 4" strokeWidth={1.5}
            label={{ value: referenceLabel || 'Start', position: 'insideTopRight', fill: '#F2A93B', fontSize: 10 }} />
        )}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 2.5, fill: s.color }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

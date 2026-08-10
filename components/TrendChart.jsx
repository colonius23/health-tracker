import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function TrendChart({ data, dataKey = 'value', xKey = 'date', color = '#35D0A0', height = 220, unit = '' }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-muted text-sm">No data yet</div>
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#223049" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} stroke="#8A97AC" fontSize={11} tickLine={false} axisLine={{ stroke: '#223049' }} />
        <YAxis stroke="#8A97AC" fontSize={11} tickLine={false} axisLine={false} width={38} />
        <Tooltip
          contentStyle={{ background: '#121B2E', border: '1px solid #223049', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#8A97AC' }}
          formatter={(v) => [`${v} ${unit}`, dataKey]}
        />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

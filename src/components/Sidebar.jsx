import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Overview', icon: '◆' },
  { to: '/blood', label: 'Blood Tests', icon: '●' },
  { to: '/activities', label: 'Activities', icon: '▲' },
  { to: '/sleep', label: 'Sleep', icon: '☾' },
  { to: '/upload', label: 'Upload Data', icon: '↑' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-line bg-surface/50 flex flex-col">
      <div className="px-5 py-6">
        <div className="font-display font-semibold text-lg tracking-tight">Vitals</div>
        <div className="text-[11px] text-muted font-mono mt-0.5">personal health log</div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-surface-2 text-text' : 'text-muted hover:text-text hover:bg-surface-2/60'
              }`
            }
          >
            <span className="text-mint text-xs">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-[11px] text-muted border-t border-line">
        Data stored in your own Supabase project.
      </div>
    </aside>
  )
}

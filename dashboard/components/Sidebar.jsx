'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, Users, MessageSquare,
  AlertTriangle, Stethoscope, Calendar, ClipboardList,
  Ban, Megaphone, Activity,
} from 'lucide-react'

const NAV = [
  { href: '/analytics',     label: 'Overview',      icon: LayoutDashboard },
  { href: '/appointments',  label: 'Appointments',   icon: CalendarDays },
  { href: '/patients',      label: 'Patients',       icon: Users },
  { href: '/conversations', label: 'Conversations',  icon: MessageSquare },
  { href: '/escalations',   label: 'Escalations',    icon: AlertTriangle },
]

const MANAGE = [
  { href: '/doctors',      label: 'Doctors',    icon: Stethoscope },
  { href: '/schedule',     label: 'Schedule',   icon: Calendar },
  { href: '/services',     label: 'Services',   icon: ClipboardList },
  { href: '/block-dates',  label: 'Block Dates',icon: Ban },
  { href: '/broadcast',    label: 'Broadcast',  icon: Megaphone },
]

function NavItem({ href, label, Icon, active }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-brand/10 text-brand'
          : 'text-ink-secondary hover:text-ink hover:bg-slate-100'
      }`}
    >
      <Icon size={15} strokeWidth={active ? 2.5 : 2} />
      {label}
    </Link>
  )
}

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-56 shrink-0 bg-card border-r border-border flex flex-col shadow-sm">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-sm">
            <Activity size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-ink leading-tight">Entrust Clinic</p>
            <p className="text-[11px] text-ink-muted mt-0.5">WhatsApp Automation</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-ink-muted font-semibold px-3 mb-2">Monitor</p>
        {NAV.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} Icon={Icon} active={path.startsWith(href)} />
        ))}

        <p className="text-[10px] uppercase tracking-widest text-ink-muted font-semibold px-3 mt-5 mb-2">Manage</p>
        {MANAGE.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} Icon={Icon} active={path.startsWith(href)} />
        ))}
      </nav>

      {/* Status */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-ink-muted">Bot active</span>
        </div>
      </div>
    </aside>
  )
}

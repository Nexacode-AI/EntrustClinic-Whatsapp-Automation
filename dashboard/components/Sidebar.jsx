'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, Users, MessageSquare,
  AlertTriangle, Stethoscope, Calendar, ClipboardList,
  Ban, Megaphone, Activity, LogOut,
} from 'lucide-react'

const NAV = [
  { href: '/analytics',     label: 'Overview',      icon: LayoutDashboard },
  { href: '/appointments',  label: 'Appointments',   icon: CalendarDays },
  { href: '/patients',      label: 'Patients',       icon: Users },
  { href: '/conversations', label: 'Conversations',  icon: MessageSquare },
  { href: '/escalations',   label: 'Escalations',    icon: AlertTriangle },
]

const MANAGE = [
  { href: '/doctors',      label: 'Doctors',     icon: Stethoscope },
  { href: '/schedule',     label: 'Schedule',    icon: Calendar },
  { href: '/services',     label: 'Services',    icon: ClipboardList },
  { href: '/block-dates',  label: 'Block Dates', icon: Ban },
  { href: '/broadcast',    label: 'Broadcast',   icon: Megaphone },
]

function NavItem({ href, label, Icon, active }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 outline-none ${
        active
          ? 'bg-teal-50 text-teal-700'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
      }`}
    >
      <Icon size={15} strokeWidth={active ? 2.5 : 2} className={active ? 'text-teal-600' : 'text-slate-400'} />
      {label}
    </Link>
  )
}

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 shrink-0 bg-white flex flex-col h-screen border-r border-slate-200">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shadow-sm">
            <Activity size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">Entrust Clinic</p>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: '11px' }}>WhatsApp Bot</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-slate-400 font-semibold px-3 mb-2" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Monitor
        </p>
        <div className="space-y-0.5 mb-5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <NavItem key={href} href={href} label={label} Icon={Icon} active={path.startsWith(href)} />
          ))}
        </div>

        <p className="text-slate-400 font-semibold px-3 mb-2" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Manage
        </p>
        <div className="space-y-0.5">
          {MANAGE.map(({ href, label, icon: Icon }) => (
            <NavItem key={href} href={href} label={label} Icon={Icon} active={path.startsWith(href)} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-100 space-y-1">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-400">Bot active</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 outline-none"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

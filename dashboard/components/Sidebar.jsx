'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, Users, MessageSquare,
  AlertTriangle, Stethoscope, Calendar, ClipboardList,
  Ban, Megaphone, Activity, LogOut, ChevronRight,
} from 'lucide-react'
import { cn } from '../lib/utils'

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
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
        active
          ? 'bg-white/10 text-white'
          : 'text-slate-400 hover:text-white hover:bg-white/6'
      )}
    >
      <Icon size={15} strokeWidth={active ? 2.5 : 2} className={active ? 'text-teal-400' : ''} />
      <span>{label}</span>
      {active && <ChevronRight size={12} className="ml-auto text-teal-400/60" />}
    </Link>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-3 mb-1.5 mt-5">
      {children}
    </p>
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
    <aside className="w-[220px] shrink-0 bg-[#0F172A] flex flex-col h-screen border-r border-white/5">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <Activity size={14} className="text-teal-400" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Entrust Clinic</p>
            <p className="text-[11px] text-slate-500 mt-0.5">WhatsApp Bot</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <SectionLabel>Monitor</SectionLabel>
        {NAV.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} Icon={Icon} active={path.startsWith(href)} />
        ))}

        <SectionLabel>Manage</SectionLabel>
        {MANAGE.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} Icon={Icon} active={path.startsWith(href)} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/8 space-y-1">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500">Bot active</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all duration-150"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

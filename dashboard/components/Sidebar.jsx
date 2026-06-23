'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ListOrdered, CalendarDays, FileText, Video,
  Users, ShieldCheck, Heart,
  Pill, Package2,
  Receipt, PackageCheck, Building2, Wallet, Banknote,
  BarChart3,
  MessageSquare, AlertTriangle, Megaphone,
  UserCog, Stethoscope, Calendar, ClipboardList, Ban, Star, FileSignature, Settings,
  Activity, LogOut, ChevronRight, X,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/analytics', label: 'Dashboard',   icon: LayoutDashboard },
      { href: '/queue',     label: 'Queue Board',  icon: ListOrdered },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { href: '/appointments',  label: 'Appointments', icon: CalendarDays },
      { href: '/emr',           label: 'EMR / Consult', icon: FileText },
      { href: '/telemedicine',  label: 'Telemedicine',  icon: Video },
    ],
  },
  {
    label: 'Patients',
    items: [
      { href: '/patients', label: 'Patient Registry', icon: Users },
      { href: '/fomema',   label: 'FOMEMA',           icon: ShieldCheck },
      { href: '/loyalty',  label: 'Loyalty',          icon: Heart },
    ],
  },
  {
    label: 'Pharmacy',
    items: [
      { href: '/pharmacy',   label: 'Dispensary', icon: Pill },
      { href: '/inventory',  label: 'Inventory',  icon: Package2 },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/billing',   label: 'Billing',    icon: Receipt },
      { href: '/packages',  label: 'Packages',   icon: PackageCheck },
      { href: '/panel',     label: 'Panel / TPA', icon: Building2 },
      { href: '/expenses',  label: 'Expenses',   icon: Wallet },
      { href: '/payroll',   label: 'Payroll',    icon: Banknote },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Communications',
    items: [
      { href: '/conversations', label: 'Conversations', icon: MessageSquare },
      { href: '/escalations',   label: 'Escalations',   icon: AlertTriangle },
      { href: '/broadcast',     label: 'Broadcast',     icon: Megaphone },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/staff',       label: 'Staff',         icon: UserCog },
      { href: '/doctors',     label: 'Doctors',       icon: Stethoscope },
      { href: '/schedule',    label: 'Schedule',      icon: Calendar },
      { href: '/services',    label: 'Services',      icon: ClipboardList },
      { href: '/block-dates', label: 'Block Dates',   icon: Ban },
      { href: '/consent',     label: 'Consent Forms', icon: FileSignature },
      { href: '/settings',    label: 'Settings',      icon: Settings },
    ],
  },
]

function NavItem({ href, label, Icon, active }) {
  return (
    <Link
      href={href}
      className={active ? 'nav-item-active' : 'nav-item-idle'}
    >
      <Icon size={15} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />
      <span className="truncate">{label}</span>
      {active && <ChevronRight size={12} className="ml-auto opacity-60 flex-shrink-0" />}
    </Link>
  )
}

export default function Sidebar({ open, onClose }) {
  const path   = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50
      lg:relative lg:z-auto lg:translate-x-0
      w-60 shrink-0 flex flex-col h-screen
      bg-sidebar border-r border-white/8 overflow-hidden
      transition-transform duration-300 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Brand */}
      <div className="px-5 py-4 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center shadow-sm flex-shrink-0">
            <Activity size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white leading-tight truncate">Entrust Clinic</p>
            <p className="text-slate-500 mt-0.5 text-2xs">Management System</p>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Nav scroll area */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto sidebar-scroll scrollbar-hide">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="section-label text-slate-600">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => (
                <NavItem
                  key={href}
                  href={href}
                  label={label}
                  Icon={Icon}
                  active={path === href || (href !== '/analytics' && path.startsWith(href))}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/8 flex-shrink-0 space-y-1">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot flex-shrink-0" />
          <span className="text-2xs text-slate-500">Bot active</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 outline-none"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

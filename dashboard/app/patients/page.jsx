import { api } from '../../lib/api'
import dayjs from 'dayjs'
import { Users, Search, MessageSquare } from 'lucide-react'

const LANG = { en: 'English', ms: 'BM', zh: '中文' }

export default async function PatientsPage({ searchParams }) {
  const search = searchParams?.search || ''
  let patients = []
  try { patients = await api.patients({ search, limit: 100 }) } catch {}

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users size={20} className="text-brand" />
          <h1 className="text-2xl font-bold text-ink">Patients</h1>
        </div>
        <p className="text-sm text-ink-secondary ml-7">{patients.length} registered patient{patients.length !== 1 ? 's' : ''}</p>
      </div>

      <form className="mb-5">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by name or phone..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
          />
        </div>
      </form>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Name</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Phone</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Language</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-ink-muted font-semibold">Registered</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {patients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-ink-secondary">
                  {search ? `No patients matching "${search}"` : 'No patients yet'}
                </td>
              </tr>
            ) : patients.map((p) => (
              <tr key={p.id} className="hover:bg-muted/60 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-ink">{p.name || <span className="text-ink-muted font-normal italic">No name</span>}</td>
                <td className="px-5 py-3.5 text-ink-secondary font-mono text-xs">{p.phone}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-ink-secondary border border-border font-medium">
                    {LANG[p.language] || 'English'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-ink-secondary">{dayjs(p.created_at).format('D MMM YYYY')}</td>
                <td className="px-5 py-3.5 text-right">
                  <a
                    href={`/conversations?phone=${encodeURIComponent(p.phone)}`}
                    className="inline-flex items-center gap-1.5 text-xs text-brand hover:text-brand-dark font-semibold transition-colors"
                  >
                    <MessageSquare size={12} />
                    View chat
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

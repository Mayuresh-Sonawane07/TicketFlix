'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '@/lib/api'
import {
  LayoutDashboard, Users, CalendarDays, Ticket, BarChart3,
  ShieldAlert, Bell, Play, CheckCircle2, XCircle, Flag,
  Trash2, Ban, UserCheck, RefreshCw, Send, ChevronDown,
  TrendingUp, AlertTriangle, DollarSign, Activity, Clock,
  Eye, Edit3, X, Check, LogOut,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashStats {
  users: { total: number; customers: number; venue_owners: number; pending_approvals: number; banned: number }
  events: { total: number; pending: number; approved: number; flagged: number }
  bookings: { total: number; cancelled: number }
  revenue: { total: number; last_7_days: number }
  fraud: { suspicious_users: number }
}

type Tab = 'dashboard' | 'venue-owners' | 'users' | 'events' | 'shows' | 'bookings' | 'revenue' | 'fraud' | 'notifications'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const api = (path: string) => `/admin-panel${path}`

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
}

function fmtCurrency(n: number) {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)}`
}

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accent = 'red', sub, onClick }: {
  label: string; value: string | number; icon: React.ReactNode; accent?: string; sub?: string; onClick?: () => void
}) {
  const accents: Record<string, string> = {
    red:    'border-red-500/30 bg-red-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
    green:  'border-emerald-500/30 bg-emerald-500/5',
    blue:   'border-blue-500/30 bg-blue-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
  }
  const iconAccents: Record<string, string> = {
    red:    'text-red-400',
    yellow: 'text-yellow-400',
    green:  'text-emerald-400',
    blue:   'text-blue-400',
    purple: 'text-purple-400',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`border rounded-xl p-5 ${accents[accent]}${onClick ? 'cursor-pointer hover:brightness-125 transition-all' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`${iconAccents[accent]}`}>{icon}</span>
        {sub && <span className="text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">{sub}</span>}
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </motion.div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    green:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    red:    'bg-red-500/15 text-red-400 border-red-500/30',
    yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    gray:   'bg-gray-500/15 text-gray-400 border-gray-500/30',
    blue:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors[color] || colors.gray}`}>
      {label}
    </span>
  )
}

function ActionBtn({ label, icon, onClick, variant = 'ghost', disabled = false }: {
  label: string; icon?: React.ReactNode; onClick: () => void; variant?: 'ghost' | 'danger' | 'success' | 'warn'; disabled?: boolean
}) {
  const variants = {
    ghost:   'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white',
    danger:  'border-red-600/50 text-red-400 hover:bg-red-600/10 hover:border-red-500',
    success: 'border-emerald-600/50 text-emerald-400 hover:bg-emerald-600/10 hover:border-emerald-500',
    warn:    'border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10 hover:border-yellow-500',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition disabled:opacity-40 ${variants[variant]}`}
    >
      {icon}{label}
    </button>
  )
}

function ConfirmModal({ message, onConfirm, onCancel, extraInput }: {
  message: string; onConfirm: (val?: string) => void; onCancel: () => void; extraInput?: string
}) {
  const [val, setVal] = useState('')
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full"
      >
        <p className="text-white mb-4 text-sm leading-relaxed">{message}</p>
        {extraInput && (
          <input
            value={val} onChange={e => setVal(e.target.value)}
            placeholder={extraInput}
            className="w-full mb-4 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-600"
          />
        )}
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2 border border-gray-700 text-gray-400 rounded-lg text-sm hover:border-gray-500 transition">
            Cancel
          </button>
          <button onClick={() => onConfirm(val || undefined)}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500 transition font-semibold">
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Tab: Dashboard ───────────────────────────────────────────────────────────

function DashboardTab({ setTab }: { setTab: (t: Tab) => void }) {
  const [stats, setStats] = useState<DashStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get(api('/dashboard/')).then(r => setStats(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />
  if (!stats) return <Empty text="Failed to load stats" />

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Users</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Users"       value={fmt(stats.users.total)}            icon={<Users size={20}/>}         accent="blue"         onClick={() => setTab('users')} />
          <StatCard label="Customers"         value={fmt(stats.users.customers)}        icon={<Users size={20}/>}         accent="blue"         onClick={() => setTab('users')} />
          <StatCard label="Venue Owners"      value={fmt(stats.users.venue_owners)}     icon={<Users size={20}/>}         accent="purple"         onClick={() => setTab('venue-owners')} />
          <StatCard label="Pending Approvals" value={fmt(stats.users.pending_approvals)} icon={<Clock size={20}/>}        accent="yellow" sub="action needed"         onClick={() => setTab('venue-owners')} />
          <StatCard label="Banned"            value={fmt(stats.users.banned)}           icon={<Ban size={20}/>}           accent="red"         onClick={() => setTab('users')} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Events</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Events"  value={fmt(stats.events.total)}    icon={<CalendarDays size={20}/>} accent="blue" onClick={() => setTab('events')} />
          <StatCard label="Pending"       value={fmt(stats.events.pending)}  icon={<Clock size={20}/>}        accent="yellow" sub="needs review" onClick={() => setTab('events')} />
          <StatCard label="Approved"      value={fmt(stats.events.approved)} icon={<CheckCircle2 size={20}/>} accent="green" onClick={() => setTab('events')} />
          <StatCard label="Flagged"       value={fmt(stats.events.flagged)}  icon={<Flag size={20}/>}         accent="red" onClick={() => setTab('events')} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Revenue & Bookings</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue"   value={fmtCurrency(stats.revenue.total)}        icon={<DollarSign size={20}/>}  accent="green" onClick={() => setTab('revenue')} />
          <StatCard label="Last 7 Days"     value={fmtCurrency(stats.revenue.last_7_days)}  icon={<TrendingUp size={20}/>}  accent="green" onClick={() => setTab('revenue')} />
          <StatCard label="Total Bookings"  value={fmt(stats.bookings.total)}               icon={<Ticket size={20}/>}      accent="blue" onClick={() => setTab('bookings')} />
          <StatCard label="Cancelled"       value={fmt(stats.bookings.cancelled)}           icon={<XCircle size={20}/>}     accent="red" onClick={() => setTab('bookings')} />
        </div>
      </div>

      {stats.fraud.suspicious_users > 0 && (
        <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-5 flex items-center gap-4">
          <AlertTriangle className="text-yellow-400 shrink-0" size={24} />
          <div>
            <p className="text-yellow-300 font-semibold text-sm">Fraud Alert</p>
            <p className="text-yellow-500/70 text-xs mt-0.5">
              {stats.fraud.suspicious_users} user{stats.fraud.suspicious_users > 1 ? 's' : ''} made 5+ bookings in the last 24 hours. Review in the Fraud tab.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Venue Owners ────────────────────────────────────────────────────────

function VenueOwnersTab() {
  const [owners, setOwners] = useState<any[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'banned' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<{ msg: string; action: () => void; input?: string } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    apiClient.get(api(`/venue-owners/?filter=${filter}`))
      .then(r => setOwners(r.data))
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const act = async (userId: number, action: string, reason?: string) => {
    await apiClient.post(api(`/venue-owners/${userId}/`), { action, reason })
    load()
    setConfirm(null)
  }

  const filters: Array<typeof filter> = ['pending', 'approved', 'banned', 'all']

  return (
    <div>
      <AnimatePresence>{confirm && <ConfirmModal message={confirm.msg} onConfirm={(v) => confirm.action()} onCancel={() => setConfirm(null)} extraInput={confirm.input} />}</AnimatePresence>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${filter === f ? 'bg-red-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-600'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : owners.length === 0 ? <Empty text={`No ${filter} venue owners`} /> : (
        <div className="space-y-3">
          {owners.map(o => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-semibold text-sm">{o.name}</p>
                  {o.is_banned    && <Badge label="Banned"    color="red" />}
                  {o.is_suspended && <Badge label="Suspended" color="yellow" />}
                  {o.is_approved && !o.is_banned && <Badge label="Approved" color="green" />}
                  {!o.is_approved && !o.is_banned && <Badge label="Pending" color="yellow" />}
                </div>
                <p className="text-gray-500 text-xs">{o.email}</p>
                <p className="text-gray-600 text-xs mt-0.5">{o.phone} · Joined {fmtDate(o.joined_at)}</p>
                {o.ban_reason && <p className="text-red-400/70 text-xs mt-1">Reason: {o.ban_reason}</p>}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {!o.is_approved && !o.is_banned && (
                  <ActionBtn label="Approve" icon={<Check size={12}/>} variant="success"
                    onClick={() => setConfirm({ msg: `Approve ${o.name} as venue owner?`, action: () => act(o.id, 'approve') })} />
                )}
                {!o.is_approved && !o.is_banned && (
                  <ActionBtn label="Reject" icon={<X size={12}/>} variant="danger"
                    onClick={() => setConfirm({ msg: `Reject ${o.name}?`, action: () => act(o.id, 'reject') })} />
                )}
                {!o.is_banned && (
                  <ActionBtn label="Ban" icon={<Ban size={12}/>} variant="danger"
                    onClick={() => setConfirm({ msg: `Ban ${o.name}? Enter reason:`, input: 'Reason for ban', action: () => act(o.id, 'ban') })} />
                )}
                {o.is_banned && (
                  <ActionBtn label="Unban" icon={<UserCheck size={12}/>} variant="success"
                    onClick={() => setConfirm({ msg: `Unban ${o.name}?`, action: () => act(o.id, 'unban') })} />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: All Users ───────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers]   = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'Customer' | 'VENUE_OWNER'>('all')
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<{ msg: string; action: () => void; input?: string } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const q = filter !== 'all' ? `?role=${filter}` : ''
    apiClient.get(api(`/users/${q}`)).then(r => setUsers(r.data)).finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const act = async (userId: number, action: string, reason?: string) => {
    await apiClient.post(api(`/users/${userId}/`), { action, reason })
    load(); setConfirm(null)
  }

  return (
    <div>
      <AnimatePresence>{confirm && <ConfirmModal message={confirm.msg} onConfirm={() => confirm.action()} onCancel={() => setConfirm(null)} extraInput={confirm.input} />}</AnimatePresence>

      <div className="flex gap-2 mb-6">
        {(['all', 'Customer', 'VENUE_OWNER'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${filter === f ? 'bg-red-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-600'}`}>
            {f === 'VENUE_OWNER' ? 'Venue Owners' : f === 'Customer' ? 'Customers' : 'All'}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : users.length === 0 ? <Empty text="No users" /> : (
        <div className="space-y-2">
          {users.map(u => (
            <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-sm font-medium">{u.name}</p>
                  <Badge label={u.role} color={u.role === 'VENUE_OWNER' ? 'purple' : 'blue'} />
                  {u.is_banned    && <Badge label="Banned"    color="red" />}
                  {u.is_suspended && <Badge label="Suspended" color="yellow" />}
                </div>
                <p className="text-gray-500 text-xs mt-0.5">{u.email} · {u.phone}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!u.is_banned
                  ? <ActionBtn label="Ban" icon={<Ban size={12}/>} variant="danger"
                      onClick={() => setConfirm({ msg: `Ban ${u.name}?`, input: 'Reason', action: () => act(u.id, 'ban') })} />
                  : <ActionBtn label="Unban" icon={<UserCheck size={12}/>} variant="success"
                      onClick={() => setConfirm({ msg: `Unban ${u.name}?`, action: () => act(u.id, 'unban') })} />
                }
                <ActionBtn label="Delete" icon={<Trash2 size={12}/>} variant="danger"
                  onClick={() => setConfirm({ msg: `Permanently delete ${u.name}? This cannot be undone.`, action: () => act(u.id, 'delete') })} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Events ──────────────────────────────────────────────────────────────

function EventsTab() {
  const [events, setEvents]  = useState<any[]>([])
  const [filter, setFilter]  = useState<'all' | 'pending' | 'approved' | 'flagged' | 'removed'>('pending')
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<{ msg: string; action: () => void; input?: string } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const q = filter !== 'all' ? `?status=${filter}` : ''
    apiClient.get(api(`/events/${q}`)).then(r => setEvents(r.data)).finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const act = async (eventId: number, action: string, note?: string) => {
    await apiClient.post(api(`/events/${eventId}/`), { action, note })
    load(); setConfirm(null)
  }

  const statusColor: Record<string, string> = {
    pending: 'yellow', approved: 'green', flagged: 'red', removed: 'gray'
  }

  return (
    <div>
      <AnimatePresence>{confirm && <ConfirmModal message={confirm.msg} onConfirm={() => confirm.action()} onCancel={() => setConfirm(null)} extraInput={confirm.input} />}</AnimatePresence>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['pending', 'approved', 'flagged', 'removed', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${filter === f ? 'bg-red-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-600'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : events.length === 0 ? <Empty text={`No ${filter} events`} /> : (
        <div className="space-y-3">
          {events.map(e => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-white font-semibold text-sm">{e.title}</p>
                  <Badge label={e.status}     color={statusColor[e.status] || 'gray'} />
                  <Badge label={e.event_type} color="blue" />
                </div>
                <p className="text-gray-500 text-xs">By {e.created_by} · {fmtDate(e.created_at)}</p>
                {e.admin_note && <p className="text-yellow-500/70 text-xs mt-1">Note: {e.admin_note}</p>}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {e.status !== 'approved' && (
                  <ActionBtn label="Approve" icon={<Check size={12}/>} variant="success"
                    onClick={() => setConfirm({ msg: `Approve "${e.title}"?`, action: () => act(e.id, 'approve') })} />
                )}
                {e.status !== 'flagged' && (
                  <ActionBtn label="Flag" icon={<Flag size={12}/>} variant="warn"
                    onClick={() => setConfirm({ msg: `Flag "${e.title}"? Add a note:`, input: 'Reason for flagging', action: () => act(e.id, 'flag') })} />
                )}
                {e.status !== 'removed' && (
                  <ActionBtn label="Remove" icon={<XCircle size={12}/>} variant="danger"
                    onClick={() => setConfirm({ msg: `Remove "${e.title}" from platform?`, input: 'Reason', action: () => act(e.id, 'remove') })} />
                )}
                <ActionBtn label="Delete" icon={<Trash2 size={12}/>} variant="danger"
                  onClick={() => setConfirm({ msg: `Permanently delete "${e.title}"? Cannot be undone.`, action: () => act(e.id, 'delete') })} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Shows ───────────────────────────────────────────────────────────────

function ShowsTab() {
  const [shows, setShows]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<{ msg: string; action: () => void } | null>(null)

  const load = () => {
    setLoading(true)
    apiClient.get(api('/shows/')).then(r => setShows(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const act = async (showId: number, action: string, show_time?: string) => {
    await apiClient.post(api(`/shows/${showId}/`), { action, show_time })
    load(); setConfirm(null)
  }

  return (
    <div>
      <AnimatePresence>{confirm && <ConfirmModal message={confirm.msg} onConfirm={() => confirm.action()} onCancel={() => setConfirm(null)} />}</AnimatePresence>

      {loading ? <Loader /> : shows.length === 0 ? <Empty text="No shows" /> : (
        <div className="space-y-2">
          {shows.map(s => (
            <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`bg-gray-900 border rounded-xl p-4 flex items-center justify-between gap-4 ${s.is_cancelled ? 'border-red-600/30 opacity-60' : 'border-gray-800'}`}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-medium">{s.event_title}</p>
                  {s.is_cancelled && <Badge label="Cancelled" color="red" />}
                </div>
                <p className="text-gray-500 text-xs mt-0.5">
                  {s.theater} · Screen {s.screen} · {fmtDate(s.show_time)} · {fmtCurrency(s.price)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!s.is_cancelled && (
                  <ActionBtn label="Cancel" icon={<XCircle size={12}/>} variant="danger"
                    onClick={() => setConfirm({ msg: `Cancel show of "${s.event_title}" at ${fmtDate(s.show_time)}?`, action: () => act(s.id, 'cancel') })} />
                )}
                <ActionBtn label="Delete" icon={<Trash2 size={12}/>} variant="danger"
                  onClick={() => setConfirm({ msg: `Delete this show permanently?`, action: () => act(s.id, 'delete') })} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Bookings ────────────────────────────────────────────────────────────

function BookingsTab() {
  const [bookings, setBookings] = useState<any[]>([])
  const [filter, setFilter]     = useState<'all' | 'Booked' | 'Cancelled'>('all')
  const [loading, setLoading]   = useState(true)
  const [confirm, setConfirm]   = useState<{ msg: string; action: () => void } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const q = filter !== 'all' ? `?status=${filter}` : ''
    apiClient.get(api(`/bookings/${q}`)).then(r => setBookings(r.data)).finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const cancel = async (id: number) => {
    await apiClient.post(api(`/bookings/${id}/cancel/`), {})
    load(); setConfirm(null)
  }

  return (
    <div>
      <AnimatePresence>{confirm && <ConfirmModal message={confirm.msg} onConfirm={() => confirm.action()} onCancel={() => setConfirm(null)} />}</AnimatePresence>

      <div className="flex gap-2 mb-6">
        {(['all', 'Booked', 'Cancelled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${filter === f ? 'bg-red-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-600'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : bookings.length === 0 ? <Empty text="No bookings" /> : (
        <div className="space-y-2">
          {bookings.map(b => (
            <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-sm font-medium">#{b.id} · {b.event}</p>
                  <Badge label={b.status} color={b.status === 'Booked' ? 'green' : 'red'} />
                </div>
                <p className="text-gray-500 text-xs mt-0.5">
                  {b.user} · {b.theater} · {b.seats} seat{b.seats !== 1 ? 's' : ''} · {fmtCurrency(b.total_amount)}
                </p>
                <p className="text-gray-600 text-xs">{b.transaction_id} · {fmtDate(b.booking_time)}</p>
              </div>
              {b.status === 'Booked' && (
                <ActionBtn label="Cancel" icon={<XCircle size={12}/>} variant="danger"
                  onClick={() => setConfirm({ msg: `Cancel booking #${b.id} for ${b.user}?`, action: () => cancel(b.id) })} />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Revenue ─────────────────────────────────────────────────────────────

function RevenueTab() {
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get(api('/revenue/')).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />
  if (!data) return <Empty text="Failed to load revenue" />

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Revenue"     value={fmtCurrency(data.total_revenue)} icon={<DollarSign size={20}/>} accent="green" />
        <StatCard label="Cancelled Bookings" value={fmt(data.cancelled_count)}      icon={<XCircle size={20}/>}   accent="red" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Top Events by Revenue</h3>
        <div className="space-y-2">
          {data.by_event?.map((e: any, i: number) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{e.show__event__title}</p>
                <p className="text-gray-500 text-xs">{fmt(e.bookings)} bookings</p>
              </div>
              <p className="text-emerald-400 font-bold text-sm">{fmtCurrency(e.revenue)}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Daily Revenue (Last 30 Days)</h3>
        <div className="space-y-1.5">
          {data.daily?.slice(-15).map((d: any, i: number) => {
            const max = Math.max(...data.daily.map((x: any) => Number(x.revenue)))
            const pct = max > 0 ? (Number(d.revenue) / max) * 100 : 0
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-gray-500 text-xs w-24 shrink-0">{d.day}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-gray-400 text-xs w-24 text-right">{fmtCurrency(d.revenue)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Fraud ───────────────────────────────────────────────────────────────

function FraudTab() {
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get(api('/fraud/')).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />
  if (!data)   return <Empty text="Failed to load fraud data" />

  const Section = ({ title, items, cols }: { title: string; items: any[]; cols: string[] }) => (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">{title}</h3>
      {items.length === 0
        ? <p className="text-gray-600 text-sm py-4 text-center border border-dashed border-gray-800 rounded-xl">No suspicious activity detected ✓</p>
        : (
          <div className="space-y-2">
            {items.map((item: any, i: number) => (
              <div key={i} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-5 py-3 flex items-center justify-between">
                <p className="text-yellow-300 text-sm font-medium">{item['user__email']}</p>
                <div className="flex gap-4">
                  {cols.map(c => (
                    <div key={c} className="text-right">
                      <p className="text-yellow-400 font-bold text-sm">{item[c]}</p>
                      <p className="text-yellow-600 text-xs">{c.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-xl p-5 flex gap-3">
        <AlertTriangle className="text-yellow-400 shrink-0 mt-0.5" size={18} />
        <p className="text-yellow-400/80 text-sm">Fraud monitoring checks for unusual booking patterns, rapid repeat bookings, and high cancellation rates. Review flagged users and take action from the Users tab.</p>
      </div>
      <Section title="5+ Bookings in Last 24 Hours" items={data.suspicious_24h} cols={['count']} />
      <Section title="3+ Bookings in Last 1 Hour (Rapid)" items={data.rapid_bookings} cols={['count']} />
      <Section title="High Cancellation Rate" items={data.high_cancel_rate} cols={['total', 'cancelled']} />
    </div>
  )
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────

function NotificationsTab() {
  const [notifs, setNotifs]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [form, setForm]       = useState({ title: '', message: '', type: 'announcement', target: 'all' })

  const load = () => {
    setLoading(true)
    apiClient.get(api('/notifications/')).then(r => setNotifs(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const send = async () => {
    if (!form.title || !form.message) return
    setSending(true)
    try {
      await apiClient.post(api('/notifications/'), form)
      setForm({ title: '', message: '', type: 'announcement', target: 'all' })
      load()
    } finally {
      setSending(false)
    }
  }

  const del = async (id: number) => {
    await apiClient.delete(api(`/notifications/${id}/`))
    setNotifs(n => n.filter(x => x.id !== id))
  }

  const typeColor: Record<string, string> = {
    announcement: 'blue', alert: 'red', maintenance: 'yellow', event: 'green'
  }

  const inputCls = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-600 transition"

  return (
    <div className="space-y-8">
      {/* Compose */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-white font-bold mb-5 flex items-center gap-2"><Bell size={16} className="text-red-400"/> Send Platform Notification</h3>
        <div className="space-y-4">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
            placeholder="Notification title" className={inputCls} />
          <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})}
            placeholder="Message..." rows={3} className={`${inputCls} resize-none`} />
          <div className="grid grid-cols-2 gap-4">
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
              className={inputCls}>
              <option value="announcement">Announcement</option>
              <option value="alert">Alert</option>
              <option value="maintenance">Maintenance</option>
              <option value="event">Event Alert</option>
            </select>
            <select value={form.target} onChange={e => setForm({...form, target: e.target.value})}
              className={inputCls}>
              <option value="all">All Users</option>
              <option value="customers">Customers Only</option>
              <option value="venue_owners">Venue Owners Only</option>
            </select>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={send} disabled={sending || !form.title || !form.message}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-500 transition disabled:opacity-50">
            <Send size={14} />{sending ? 'Sending...' : 'Send Notification'}
          </motion.button>
        </div>
      </div>

      {/* History */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Sent Notifications</h3>
        {loading ? <Loader /> : notifs.length === 0 ? <Empty text="No notifications sent yet" /> : (
          <div className="space-y-2">
            {notifs.map(n => (
              <div key={n.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white text-sm font-medium">{n.title}</p>
                    <Badge label={n.type}   color={typeColor[n.type] || 'gray'} />
                    <Badge label={n.target} color="gray" />
                  </div>
                  <p className="text-gray-500 text-xs">{n.message}</p>
                  <p className="text-gray-700 text-xs mt-1">{fmtDate(n.created_at)}</p>
                </div>
                <button onClick={() => del(n.id)} className="text-gray-600 hover:text-red-400 transition shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Utility components ───────────────────────────────────────────────────────

function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-20 text-center border border-dashed border-gray-800 rounded-xl">
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',    label: 'Dashboard',    icon: <LayoutDashboard size={16}/> },
  { id: 'venue-owners', label: 'Venue Owners', icon: <UserCheck size={16}/> },
  { id: 'users',        label: 'Users',        icon: <Users size={16}/> },
  { id: 'events',       label: 'Events',       icon: <CalendarDays size={16}/> },
  { id: 'shows',        label: 'Shows',        icon: <Play size={16}/> },
  { id: 'bookings',     label: 'Bookings',     icon: <Ticket size={16}/> },
  { id: 'revenue',      label: 'Revenue',      icon: <BarChart3 size={16}/> },
  { id: 'fraud',        label: 'Fraud',        icon: <ShieldAlert size={16}/> },
  { id: 'notifications',label: 'Notify',       icon: <Bell size={16}/> },
]

export default function AdminPanelPage() {
  const router   = useRouter()
  const [user, setUser] = useState<any>(null)
  const [tab, setTab]   = useState<Tab>('dashboard')

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/login'); return }
    const parsed = JSON.parse(u)
    if (parsed.role !== 'Admin') { router.push('/'); return }
    setUser(parsed)
  }, [])

  if (!user) return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const tabContent: Record<Tab, React.ReactNode> = {
    'dashboard':     <DashboardTab setTab={setTab} />,
    'venue-owners':  <VenueOwnersTab />,
    'users':         <UsersTab />,
    'events':        <EventsTab />,
    'shows':         <ShowsTab />,
    'bookings':      <BookingsTab />,
    'revenue':       <RevenueTab />,
    'fraud':         <FraudTab />,
    'notifications': <NotificationsTab />,
  }

  return (
    <div className="min-h-screen bg-[#080810] flex">

      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-white/[0.06] bg-[#0b0b14] flex flex-col">
        {/* Brand */}
        <div className="px-5 py-6 border-b border-white/[0.06]">
          <p className="text-white font-bold text-lg tracking-tight">TicketFlix</p>
          <p className="text-red-500 text-[10px] font-semibold tracking-widest uppercase mt-0.5">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition text-left ${
                tab === t.id
                  ? 'bg-red-600/15 text-red-400 font-semibold'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <p className="text-white text-xs font-medium truncate">{user.first_name || user.email}</p>
          <p className="text-red-500 text-[10px]">Administrator</p>
          <button onClick={() => { localStorage.clear(); router.push('/login') }}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-400 text-xs mt-2 transition">
            <LogOut size={11}/> Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white capitalize">
              {TABS.find(t => t.id === tab)?.label}
            </h1>
            <p className="text-gray-600 text-sm mt-0.5">
              {tab === 'dashboard'    && 'Platform overview and key metrics'}
              {tab === 'venue-owners' && 'Approve, reject or ban venue owner accounts'}
              {tab === 'users'        && 'Manage all platform users'}
              {tab === 'events'       && 'Moderate and approve events before publishing'}
              {tab === 'shows'        && 'Cancel or modify show timings'}
              {tab === 'bookings'     && 'View and manage all bookings'}
              {tab === 'revenue'      && 'Platform revenue and transaction analytics'}
              {tab === 'fraud'        && 'Detect suspicious booking patterns'}
              {tab === 'notifications'&& 'Send platform-wide announcements'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}>
              {tabContent[tab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
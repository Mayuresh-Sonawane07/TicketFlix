'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '@/lib/api'
import {
  LayoutDashboard, Users, CalendarDays, Ticket, BarChart3,
  ShieldAlert, Bell, Play, CheckCircle2, XCircle, Flag,
  Trash2, Ban, UserCheck, Send,
  TrendingUp, AlertTriangle, DollarSign, Activity, Clock,
  X, Check, LogOut, Sparkles, Film,
} from 'lucide-react'

interface DashStats {
  users: { total: number; customers: number; venue_owners: number; pending_approvals: number; banned: number }
  events: { total: number; pending: number; approved: number; flagged: number }
  bookings: { total: number; cancelled: number }
  revenue: { total: number; last_7_days: number }
  fraud: { suspicious_users: number }
}

type Tab = 'dashboard' | 'venue-owners' | 'users' | 'events' | 'shows' | 'bookings' | 'revenue' | 'fraud' | 'notifications'

const api = (path: string) => `/admin-panel${path}`

function fmt(n: number) { return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n) }
function fmtCurrency(n: number) { return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)}` }
function fmtDate(d: string) { if (!d) return '—'; return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) }

function StatCard({ label, value, icon, accent = 'red', sub, onClick }: {
  label: string; value: string | number; icon: React.ReactNode; accent?: string; sub?: string; onClick?: () => void
}) {
  const borders: Record<string, string> = { red: 'border-red-500/20 bg-red-500/4', yellow: 'border-yellow-500/20 bg-yellow-500/4', green: 'border-emerald-500/20 bg-emerald-500/4', blue: 'border-blue-500/20 bg-blue-500/4', purple: 'border-purple-500/20 bg-purple-500/4' }
  const iconColors: Record<string, string> = { red: 'text-red-400', yellow: 'text-yellow-400', green: 'text-emerald-400', blue: 'text-blue-400', purple: 'text-purple-400' }
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={onClick ? { y: -2 } : {}}
      onClick={onClick} className={`border rounded-2xl p-5 transition-all duration-200 ${borders[accent]} ${onClick ? 'cursor-pointer hover:brightness-125' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <span className={`${iconColors[accent]} w-9 h-9 rounded-xl bg-white/4 flex items-center justify-center`}>{icon}</span>
        {sub && <span className="text-[9px] text-gray-700 bg-white/4 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{sub}</span>}
      </div>
      <p className="text-2xl font-black text-white mb-0.5">{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </motion.div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = { green: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25', red: 'bg-red-500/12 text-red-400 border-red-500/25', yellow: 'bg-yellow-500/12 text-yellow-400 border-yellow-500/25', gray: 'bg-white/5 text-gray-500 border-white/10', blue: 'bg-blue-500/12 text-blue-400 border-blue-500/25', purple: 'bg-purple-500/12 text-purple-400 border-purple-500/25' }
  return <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-widest ${colors[color] || colors.gray}`}>{label}</span>
}

function ActionBtn({ label, icon, onClick, variant = 'ghost', disabled = false }: {
  label: string; icon?: React.ReactNode; onClick: () => void; variant?: 'ghost' | 'danger' | 'success' | 'warn'; disabled?: boolean
}) {
  const variants = { ghost: 'border-white/10 text-gray-500 hover:border-white/20 hover:text-white', danger: 'border-red-600/30 text-red-400 hover:bg-red-600/8 hover:border-red-500/50', success: 'border-emerald-600/30 text-emerald-400 hover:bg-emerald-600/8 hover:border-emerald-500/50', warn: 'border-yellow-600/30 text-yellow-400 hover:bg-yellow-600/8 hover:border-yellow-500/50' }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-xl transition-all disabled:opacity-40 ${variants[variant]}`}>
      {icon}{label}
    </button>
  )
}

function ConfirmModal({ message, onConfirm, onCancel, extraInput }: { message: string; onConfirm: (val?: string) => void; onCancel: () => void; extraInput?: string }) {
  const [val, setVal] = useState('')
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        className="bg-[#111] border border-white/8 rounded-2xl p-6 max-w-sm w-full">
        <p className="text-white mb-4 text-sm leading-relaxed">{message}</p>
        {extraInput && (
          <input value={val} onChange={e => setVal(e.target.value)} placeholder={extraInput}
            className="w-full mb-4 px-4 py-3 bg-white/4 border border-white/8 rounded-xl text-white text-sm placeholder-gray-700 focus:outline-none focus:border-red-500/50 transition" />
        )}
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border border-white/8 text-gray-500 rounded-xl text-sm hover:border-white/15 transition">Cancel</button>
          <button onClick={() => onConfirm(val || undefined)} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm hover:bg-red-500 transition font-bold">Confirm</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-24">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full" />
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-24 text-center border border-dashed border-white/6 rounded-2xl">
      <p className="text-gray-700 text-sm">{text}</p>
    </div>
  )
}

function DashboardTab({ setTab }: { setTab: (t: Tab) => void }) {
  const [stats, setStats] = useState<DashStats | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { apiClient.get(api('/dashboard/')).then(r => setStats(r.data)).finally(() => setLoading(false)) }, [])
  if (loading) return <Loader />
  if (!stats) return <Empty text="Failed to load stats" />
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-4">Users</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Users" value={fmt(stats.users.total)} icon={<Users size={18}/>} accent="blue" onClick={() => setTab('users')} />
          <StatCard label="Customers" value={fmt(stats.users.customers)} icon={<Users size={18}/>} accent="blue" onClick={() => setTab('users')} />
          <StatCard label="Venue Owners" value={fmt(stats.users.venue_owners)} icon={<Users size={18}/>} accent="purple" onClick={() => setTab('venue-owners')} />
          <StatCard label="Pending Approvals" value={fmt(stats.users.pending_approvals)} icon={<Clock size={18}/>} accent="yellow" sub="action" onClick={() => setTab('venue-owners')} />
          <StatCard label="Banned" value={fmt(stats.users.banned)} icon={<Ban size={18}/>} accent="red" onClick={() => setTab('users')} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-4">Events</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Events" value={fmt(stats.events.total)} icon={<CalendarDays size={18}/>} accent="blue" onClick={() => setTab('events')} />
          <StatCard label="Pending" value={fmt(stats.events.pending)} icon={<Clock size={18}/>} accent="yellow" sub="review" onClick={() => setTab('events')} />
          <StatCard label="Approved" value={fmt(stats.events.approved)} icon={<CheckCircle2 size={18}/>} accent="green" onClick={() => setTab('events')} />
          <StatCard label="Flagged" value={fmt(stats.events.flagged)} icon={<Flag size={18}/>} accent="red" onClick={() => setTab('events')} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-4">Revenue & Bookings</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value={fmtCurrency(stats.revenue.total)} icon={<DollarSign size={18}/>} accent="green" onClick={() => setTab('revenue')} />
          <StatCard label="Last 7 Days" value={fmtCurrency(stats.revenue.last_7_days)} icon={<TrendingUp size={18}/>} accent="green" onClick={() => setTab('revenue')} />
          <StatCard label="Total Bookings" value={fmt(stats.bookings.total)} icon={<Ticket size={18}/>} accent="blue" onClick={() => setTab('bookings')} />
          <StatCard label="Cancelled" value={fmt(stats.bookings.cancelled)} icon={<XCircle size={18}/>} accent="red" onClick={() => setTab('bookings')} />
        </div>
      </div>
      {stats.fraud.suspicious_users > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="border border-yellow-500/25 bg-yellow-500/4 rounded-2xl p-5 flex items-center gap-4">
          <AlertTriangle className="text-yellow-400 shrink-0" size={20} />
          <div>
            <p className="text-yellow-300 font-bold text-sm">Fraud Alert</p>
            <p className="text-yellow-600 text-xs mt-0.5">{stats.fraud.suspicious_users} user{stats.fraud.suspicious_users > 1 ? 's' : ''} made 5+ bookings in the last 24 hours.</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function VenueOwnersTab() {
  const [owners, setOwners] = useState<any[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'banned' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<{ msg: string; action?: () => void; actionWithReason?: (v?: string) => void; input?: string } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    apiClient.get(api(`/venue-owners/?filter=${filter}`)).then(r => setOwners(r.data)).finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const act = async (userId: number, action: string, reason?: string) => {
    await apiClient.post(api(`/venue-owners/${userId}/`), { action, reason }); load(); setConfirm(null)
  }

  return (
    <div>
      <AnimatePresence>{confirm && <ConfirmModal message={confirm.msg} onConfirm={(v) => { if (confirm.actionWithReason) confirm.actionWithReason(v); else confirm.action?.() }} onCancel={() => setConfirm(null)} extraInput={confirm.input} />}</AnimatePresence>
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'banned', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${filter === f ? 'bg-red-600 text-white' : 'bg-white/4 border border-white/8 text-gray-500 hover:text-white hover:border-white/15'}`}>{f}</button>
        ))}
      </div>
      {loading ? <Loader /> : owners.length === 0 ? <Empty text={`No ${filter} venue owners`} /> : (
        <div className="space-y-3">
          {owners.map(o => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.02] border border-white/6 rounded-2xl p-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-white font-bold text-sm">{o.name}</p>
                  {o.is_banned && <Badge label="Banned" color="red" />}
                  {o.is_suspended && <Badge label="Suspended" color="yellow" />}
                  {o.is_approved && !o.is_banned && <Badge label="Approved" color="green" />}
                  {!o.is_approved && !o.is_banned && <Badge label="Pending" color="yellow" />}
                </div>
                <p className="text-gray-600 text-xs">{o.email}</p>
                <p className="text-gray-700 text-xs mt-0.5">{o.phone} · Joined {fmtDate(o.joined_at)}</p>
                {o.ban_reason && <p className="text-red-400/60 text-xs mt-1">Reason: {o.ban_reason}</p>}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {!o.is_approved && !o.is_banned && <ActionBtn label="Approve" icon={<Check size={11}/>} variant="success" onClick={() => setConfirm({ msg: `Approve ${o.name}?`, action: () => act(o.id, 'approve') })} />}
                {!o.is_approved && !o.is_banned && <ActionBtn label="Reject" icon={<X size={11}/>} variant="danger" onClick={() => setConfirm({ msg: `Reject ${o.name}?`, action: () => act(o.id, 'reject') })} />}
                {!o.is_banned && <ActionBtn label="Ban" icon={<Ban size={11}/>} variant="danger" onClick={() => setConfirm({ msg: `Ban ${o.name}?`, input: 'Reason', actionWithReason: (v) => act(o.id, 'ban', v) })} />}
                {o.is_banned && <ActionBtn label="Unban" icon={<UserCheck size={11}/>} variant="success" onClick={() => setConfirm({ msg: `Unban ${o.name}?`, action: () => act(o.id, 'unban') })} />}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<any>(null)
  const load = useCallback(() => { setLoading(true); apiClient.get(api('/users/')).then(r => setUsers(r.data.results ?? r.data)).finally(() => setLoading(false)) }, [])
  useEffect(() => { load() }, [load])
  const act = async (userId: number, action: string, reason?: string) => { await apiClient.post(api(`/users/${userId}/`), { action, reason }); load(); setConfirm(null) }
  return (
    <div>
      <AnimatePresence>{confirm && <ConfirmModal message={confirm.msg} onConfirm={(v) => { if (confirm.actionWithReason) confirm.actionWithReason(v); else confirm.action?.() }} onCancel={() => setConfirm(null)} extraInput={confirm.input} />}</AnimatePresence>
      {loading ? <Loader /> : users.length === 0 ? <Empty text="No users" /> : (
        <div className="space-y-2">
          {users.map(u => (
            <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white/[0.02] border border-white/6 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-sm font-semibold">{u.name}</p>
                  <Badge label={u.role} color={u.role === 'VENUE_OWNER' ? 'purple' : 'blue'} />
                  {u.is_banned && <Badge label="Banned" color="red" />}
                  {u.is_suspended && <Badge label="Suspended" color="yellow" />}
                </div>
                <p className="text-gray-600 text-xs mt-0.5">{u.email}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!u.is_banned ? <ActionBtn label="Ban" icon={<Ban size={11}/>} variant="danger" onClick={() => setConfirm({ msg: `Ban ${u.name}?`, input: 'Reason', actionWithReason: (v: string) => act(u.id, 'ban', v) })} />
                  : <ActionBtn label="Unban" icon={<UserCheck size={11}/>} variant="success" onClick={() => setConfirm({ msg: `Unban ${u.name}?`, action: () => act(u.id, 'unban') })} />}
                <ActionBtn label="Delete" icon={<Trash2 size={11}/>} variant="danger" onClick={() => setConfirm({ msg: `Permanently delete ${u.name}?`, action: () => act(u.id, 'delete') })} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function EventsTab() {
  const [events, setEvents] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'flagged' | 'removed'>('pending')
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<any>(null)
  const load = useCallback(() => { setLoading(true); const q = filter !== 'all' ? `?status=${filter}` : ''; apiClient.get(api(`/events/${q}`)).then(r => setEvents(r.data)).finally(() => setLoading(false)) }, [filter])
  useEffect(() => { load() }, [load])
  const act = async (eventId: number, action: string, note?: string) => { await apiClient.post(api(`/events/${eventId}/`), { action, note }); load(); setConfirm(null) }
  const statusColor: Record<string, string> = { pending: 'yellow', approved: 'green', flagged: 'red', removed: 'gray' }
  return (
    <div>
      <AnimatePresence>{confirm && <ConfirmModal message={confirm.msg} onConfirm={(v) => { if (confirm.actionWithReason) confirm.actionWithReason(v); else confirm.action?.() }} onCancel={() => setConfirm(null)} extraInput={confirm.input} />}</AnimatePresence>
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['pending', 'approved', 'flagged', 'removed', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${filter === f ? 'bg-red-600 text-white' : 'bg-white/4 border border-white/8 text-gray-500 hover:text-white hover:border-white/15'}`}>{f}</button>
        ))}
      </div>
      {loading ? <Loader /> : events.length === 0 ? <Empty text={`No ${filter} events`} /> : (
        <div className="space-y-3">
          {events.map(e => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.02] border border-white/6 rounded-2xl p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-white font-bold text-sm">{e.title}</p>
                  <Badge label={e.status} color={statusColor[e.status] || 'gray'} />
                  <Badge label={e.event_type} color="blue" />
                </div>
                <p className="text-gray-600 text-xs">By {e.created_by} · {fmtDate(e.created_at)}</p>
                {e.admin_note && <p className="text-yellow-500/60 text-xs mt-1">Note: {e.admin_note}</p>}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {e.status !== 'approved' && <ActionBtn label="Approve" icon={<Check size={11}/>} variant="success" onClick={() => setConfirm({ msg: `Approve "${e.title}"?`, action: () => act(e.id, 'approve') })} />}
                {e.status === 'flagged' && <ActionBtn label="Unflag" icon={<CheckCircle2 size={11}/>} variant="success" onClick={() => setConfirm({ msg: `Unflag "${e.title}"?`, action: () => act(e.id, 'unflag') })} />}
                {e.status !== 'flagged' && <ActionBtn label="Flag" icon={<Flag size={11}/>} variant="warn" onClick={() => setConfirm({ msg: `Flag "${e.title}"?`, input: 'Reason', actionWithReason: (v) => act(e.id, 'flag', v) })} />}
                {e.status !== 'removed' && <ActionBtn label="Remove" icon={<XCircle size={11}/>} variant="danger" onClick={() => setConfirm({ msg: `Remove "${e.title}"?`, input: 'Reason', actionWithReason: (v) => act(e.id, 'remove', v) })} />}
                <ActionBtn label="Delete" icon={<Trash2 size={11}/>} variant="danger" onClick={() => setConfirm({ msg: `Delete "${e.title}"?`, action: () => act(e.id, 'delete') })} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function ShowsTab() {
  const [shows, setShows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<any>(null)
  const load = useCallback(() => { setLoading(true); apiClient.get(api('/shows/')).then(r => setShows(r.data)).finally(() => setLoading(false)) }, [])
  useEffect(() => { load() }, [load])
  const act = async (showId: number, action: string) => { await apiClient.post(api(`/shows/${showId}/`), { action }); load(); setConfirm(null) }
  return (
    <div>
      <AnimatePresence>{confirm && <ConfirmModal message={confirm.msg} onConfirm={() => confirm.action()} onCancel={() => setConfirm(null)} />}</AnimatePresence>
      {loading ? <Loader /> : shows.length === 0 ? <Empty text="No shows" /> : (
        <div className="space-y-2">
          {shows.map(s => (
            <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`bg-white/[0.02] border rounded-2xl p-4 flex items-center justify-between gap-4 ${s.is_cancelled ? 'border-red-600/20 opacity-60' : 'border-white/6'}`}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-semibold">{s.event_title}</p>
                  {s.is_cancelled && <Badge label="Cancelled" color="red" />}
                </div>
                <p className="text-gray-600 text-xs mt-0.5">{s.theater} · Screen {s.screen} · {fmtDate(s.show_time)} · {fmtCurrency(s.price)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!s.is_cancelled && <ActionBtn label="Cancel" icon={<XCircle size={11}/>} variant="danger" onClick={() => setConfirm({ msg: `Cancel show of "${s.event_title}"?`, action: () => act(s.id, 'cancel') })} />}
                <ActionBtn label="Delete" icon={<Trash2 size={11}/>} variant="danger" onClick={() => setConfirm({ msg: `Delete this show?`, action: () => act(s.id, 'delete') })} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function BookingsTab() {
  const [bookings, setBookings] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'Booked' | 'Cancelled'>('all')
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<any>(null)
  const load = useCallback(() => { setLoading(true); const q = filter !== 'all' ? `?status=${filter}` : ''; apiClient.get(api(`/bookings/${q}`)).then(r => setBookings(r.data)).finally(() => setLoading(false)) }, [filter])
  useEffect(() => { load() }, [load])
  const cancel = async (id: number) => { await apiClient.post(api(`/bookings/${id}/cancel/`), {}); load(); setConfirm(null) }
  return (
    <div>
      <AnimatePresence>{confirm && <ConfirmModal message={confirm.msg} onConfirm={() => confirm.action()} onCancel={() => setConfirm(null)} />}</AnimatePresence>
      <div className="flex gap-2 mb-6">
        {(['all', 'Booked', 'Cancelled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filter === f ? 'bg-red-600 text-white' : 'bg-white/4 border border-white/8 text-gray-500 hover:text-white hover:border-white/15'}`}>{f}</button>
        ))}
      </div>
      {loading ? <Loader /> : bookings.length === 0 ? <Empty text="No bookings" /> : (
        <div className="space-y-2">
          {bookings.map(b => (
            <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white/[0.02] border border-white/6 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-sm font-semibold">#{b.id} · {b.event}</p>
                  <Badge label={b.status} color={b.status === 'Booked' ? 'green' : 'red'} />
                </div>
                <p className="text-gray-600 text-xs mt-0.5">{b.user} · {b.theater} · {b.seats} seat{b.seats !== 1 ? 's' : ''} · {fmtCurrency(b.total_amount)}</p>
                <p className="text-gray-700 text-xs">{b.transaction_id} · {fmtDate(b.booking_time)}</p>
              </div>
              {b.status === 'Booked' && <ActionBtn label="Cancel" icon={<XCircle size={11}/>} variant="danger" onClick={() => setConfirm({ msg: `Cancel booking #${b.id}?`, action: () => cancel(b.id) })} />}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function RevenueTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { apiClient.get(api('/revenue/')).then(r => setData(r.data)).finally(() => setLoading(false)) }, [])
  if (loading) return <Loader />
  if (!data) return <Empty text="Failed to load revenue" />
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Revenue" value={fmtCurrency(data.total_revenue)} icon={<DollarSign size={18}/>} accent="green" />
        <StatCard label="Cancelled Bookings" value={fmt(data.cancelled_count)} icon={<XCircle size={18}/>} accent="red" />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-4">Top Events by Revenue</p>
        <div className="space-y-2">
          {data.by_event?.map((e: any, i: number) => (
            <div key={i} className="bg-white/[0.02] border border-white/6 rounded-xl px-5 py-3 flex items-center justify-between">
              <div><p className="text-white text-sm font-semibold">{e.show__event__title}</p><p className="text-gray-600 text-xs">{fmt(e.bookings)} bookings</p></div>
              <p className="text-emerald-400 font-black text-sm">{fmtCurrency(e.revenue)}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-4">Daily Revenue (Last 30 Days)</p>
        <div className="space-y-1.5">
          {data.daily?.slice(-15).map((d: any, i: number) => {
            const max = Math.max(...data.daily.map((x: any) => Number(x.revenue)))
            const pct = max > 0 ? (Number(d.revenue) / max) * 100 : 0
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-gray-600 text-xs w-24 shrink-0">{d.day}</span>
                <div className="flex-1 bg-white/4 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                <span className="text-gray-500 text-xs w-24 text-right">{fmtCurrency(d.revenue)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FraudTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { apiClient.get(api('/fraud/')).then(r => setData(r.data)).finally(() => setLoading(false)) }, [])
  if (loading) return <Loader />
  if (!data) return <Empty text="Failed to load fraud data" />
  const Section = ({ title, items, cols }: { title: string; items: any[]; cols: string[] }) => (
    <div>
      <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-3">{title}</p>
      {items.length === 0 ? <div className="py-6 text-center border border-dashed border-white/6 rounded-xl"><p className="text-gray-700 text-xs">No suspicious activity ✓</p></div> : (
        <div className="space-y-2">
          {items.map((item: any, i: number) => (
            <div key={i} className="bg-yellow-500/4 border border-yellow-500/15 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
              <p className="text-yellow-300 text-sm font-medium truncate">{item['user__email']}</p>
              <div className="flex items-center gap-4 shrink-0">
                {cols.map(c => <div key={c} className="text-right"><p className="text-yellow-400 font-black text-sm">{item[c]}</p><p className="text-yellow-700 text-xs">{c.replace(/_/g, ' ')}</p></div>)}
                <ActionBtn label="Ban" icon={<Ban size={11}/>} variant="danger" onClick={async () => {
                  if (!window.confirm(`Ban ${item['user__email']}?`)) return
                  try { await apiClient.post(api(`/users/${item['user__id']}/`), { action: 'ban', reason: 'Suspicious activity' }) } catch { alert('Failed to ban.') }
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
  return (
    <div className="space-y-8">
      <div className="border border-yellow-500/20 bg-yellow-500/4 rounded-2xl p-5 flex gap-3">
        <AlertTriangle className="text-yellow-400 shrink-0 mt-0.5" size={16} />
        <p className="text-yellow-500/70 text-sm">Fraud monitoring checks for unusual booking patterns, rapid repeat bookings, and high cancellation rates.</p>
      </div>
      <Section title="5+ Bookings in Last 24 Hours" items={data.suspicious_24h} cols={['count']} />
      <Section title="3+ Bookings in Last 1 Hour (Rapid)" items={data.rapid_bookings} cols={['count']} />
      <Section title="High Cancellation Rate" items={data.high_cancel_rate} cols={['total', 'cancelled']} />
    </div>
  )
}

function NotificationsTab() {
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', type: 'announcement', target: 'all' })
  const load = useCallback(() => { setLoading(true); apiClient.get(api('/notifications/')).then(r => setNotifs(r.data)).finally(() => setLoading(false)) }, [])
  useEffect(() => { load() }, [load])
  const send = async () => {
    if (!form.title || !form.message) return
    setSending(true)
    try { await apiClient.post(api('/notifications/'), form); setForm({ title: '', message: '', type: 'announcement', target: 'all' }); load() } finally { setSending(false) }
  }
  const del = async (id: number) => { await apiClient.delete(api(`/notifications/${id}/`)); setNotifs(n => n.filter(x => x.id !== id)) }
  const typeColor: Record<string, string> = { announcement: 'blue', alert: 'red', maintenance: 'yellow', event: 'green' }
  const inputCls = "w-full px-4 py-3 bg-white/3 border border-white/8 rounded-2xl text-white text-sm placeholder-gray-700 focus:outline-none focus:border-red-500/50 transition"
  return (
    <div className="space-y-8">
      <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5"><Bell size={14} className="text-red-500" /><h3 className="text-white font-black">Send Platform Notification</h3></div>
        <div className="space-y-4">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Notification title" className={inputCls} />
          <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Message..." rows={3} className={inputCls + ' resize-none'} />
          <div className="grid grid-cols-2 gap-4">
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={inputCls + ' bg-[#111]'}>
              <option value="announcement">Announcement</option><option value="alert">Alert</option><option value="maintenance">Maintenance</option><option value="event">Event Alert</option>
            </select>
            <select value={form.target} onChange={e => setForm({...form, target: e.target.value})} className={inputCls + ' bg-[#111]'}>
              <option value="all">All Users</option><option value="customers">Customers Only</option><option value="venue_owners">Venue Owners Only</option>
            </select>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={send} disabled={sending || !form.title || !form.message}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-500 transition disabled:opacity-50">
            <Send size={13}/>{sending ? 'Sending...' : 'Send Notification'}
          </motion.button>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-4">Sent Notifications</p>
        {loading ? <Loader /> : notifs.length === 0 ? <Empty text="No notifications sent yet" /> : (
          <div className="space-y-2">
            {notifs.map(n => (
              <div key={n.id} className="bg-white/[0.02] border border-white/6 rounded-2xl p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1"><p className="text-white text-sm font-semibold">{n.title}</p><Badge label={n.type} color={typeColor[n.type] || 'gray'} /><Badge label={n.target} color="gray" /></div>
                  <p className="text-gray-600 text-xs">{n.message}</p>
                  <p className="text-gray-700 text-xs mt-1">{fmtDate(n.created_at)}</p>
                </div>
                <button onClick={() => del(n.id)} className="text-gray-700 hover:text-red-400 transition shrink-0"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15}/> },
  { id: 'venue-owners', label: 'Venue Owners', icon: <UserCheck size={15}/> },
  { id: 'users', label: 'Customers', icon: <Users size={15}/> },
  { id: 'events', label: 'Events', icon: <CalendarDays size={15}/> },
  { id: 'shows', label: 'Shows', icon: <Play size={15}/> },
  { id: 'bookings', label: 'Bookings', icon: <Ticket size={15}/> },
  { id: 'revenue', label: 'Revenue', icon: <BarChart3 size={15}/> },
  { id: 'fraud', label: 'Fraud', icon: <ShieldAlert size={15}/> },
  { id: 'notifications', label: 'Notify', icon: <Bell size={15}/> },
]

export default function AdminPanelPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('dashboard')

  useEffect(() => {
    fetch('/api/auth/me').then(res => { if (!res.ok) { router.push('/login'); return null } return res.json() }).then(parsed => { if (!parsed) return; if (parsed.role !== 'Admin') { router.push('/'); return }; setUser(parsed) }).catch(() => router.push('/login'))
  }, [])

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); window.dispatchEvent(new Event('authChange')) }

  if (!user) return (
    <div className="min-h-screen bg-[#070710] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full" />
    </div>
  )

  const tabContent: Record<Tab, React.ReactNode> = {
    'dashboard': <DashboardTab setTab={setTab} />, 'venue-owners': <VenueOwnersTab />, 'users': <UsersTab />, 'events': <EventsTab />,
    'shows': <ShowsTab />, 'bookings': <BookingsTab />, 'revenue': <RevenueTab />, 'fraud': <FraudTab />, 'notifications': <NotificationsTab />,
  }

  return (
    <div className="min-h-screen bg-[#070710] flex">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-white/[0.05] bg-[#08081a]/80 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="relative w-7 h-7 flex items-center justify-center">
              <div className="absolute inset-0 bg-red-600 rounded-lg rotate-6" />
              <Film size={14} className="relative text-white" />
            </div>
            <span className="text-white font-black text-base">TicketFlix</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Sparkles size={10} className="text-red-500" />
            <p className="text-red-500 text-[10px] font-black tracking-[0.2em] uppercase">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition text-left ${tab === t.id ? 'bg-red-600/15 text-red-400 font-bold border border-red-500/15' : 'text-gray-600 hover:text-gray-300 hover:bg-white/[0.03]'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/[0.05]">
          <p className="text-white text-xs font-bold truncate">{user.first_name || 'Admin'}</p>
          <p className="text-red-500/70 text-[10px] uppercase tracking-widest">Administrator</p>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-700 hover:text-gray-400 text-xs mt-2.5 transition">
            <LogOut size={11}/> Sign out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={12} className="text-red-500" />
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Admin</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight capitalize" style={{ fontFamily: "'Georgia', serif" }}>
              {TABS.find(t => t.id === tab)?.label}
            </h1>
            <p className="text-gray-700 text-sm mt-0.5">
              {tab === 'dashboard' && 'Platform overview and key metrics'}
              {tab === 'venue-owners' && 'Approve, reject or ban venue owner accounts'}
              {tab === 'users' && 'Manage all customers'}
              {tab === 'events' && 'Moderate and approve events before publishing'}
              {tab === 'shows' && 'Cancel or modify show timings'}
              {tab === 'bookings' && 'View and manage all bookings'}
              {tab === 'revenue' && 'Platform revenue and transaction analytics'}
              {tab === 'fraud' && 'Detect suspicious booking patterns'}
              {tab === 'notifications' && 'Send platform-wide announcements'}
            </p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              {tabContent[tab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
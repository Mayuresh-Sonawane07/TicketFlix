'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { ArrowLeft, Users, Ticket, ChevronDown, IndianRupee, Clock, Sparkles, TrendingUp, Activity } from 'lucide-react'

function StatCard({ label, value, icon, color, delay }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, ease: [0.23, 1, 0.32, 1] }}
      className="relative rounded-2xl border border-white/6 bg-white/[0.03] p-5 overflow-hidden group hover:border-white/10 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <span className={color}>{icon}</span>
        <span className={`text-[9px] font-black uppercase tracking-widest ${color} opacity-40`}>{label}</span>
      </div>
      <div className="text-3xl font-black text-white tracking-tight">{value}</div>
    </motion.div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = status === 'Booked' ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20'
    : status === 'Cancelled' ? 'bg-red-500/12 text-red-400 border-red-500/20'
    : 'bg-yellow-500/12 text-yellow-400 border-yellow-500/20'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-black uppercase tracking-widest ${cfg}`}>
      <span className="w-1 h-1 rounded-full bg-current" />{status}
    </span>
  )
}

export default function VenueBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) { router.push('/login'); return }
      const user = await res.json()
      if (user.role !== 'VENUE_OWNER') { router.push('/'); return }
      fetchBookings()
    })()
  }, [])

  const fetchBookings = async () => {
    try {
      const res = await apiClient.get('/bookings/venue_analytics/')
      const data = res.data
      setBookings(Array.isArray(data) ? data : data.results ?? [])
    } catch { setError('Failed to load bookings') } finally { setLoading(false) }
  }

  const toggleEvent = (key: string) => {
    setExpandedEvents(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next })
  }

  const groupedByEvent = () => {
    const groups: Record<string, { eventTitle: string; eventType: string; bookings: any[] }> = {}
    bookings.forEach(b => {
      const eventId = String(b.show_details?.event?.id || b.show || 'unknown')
      const eventTitle = b.show_details?.event?.title || `Show #${b.show}`
      const eventType = b.show_details?.event?.event_type || ''
      if (!groups[eventId]) groups[eventId] = { eventTitle, eventType, bookings: [] }
      groups[eventId].bookings.push(b)
    })
    return groups
  }

  const confirmedBookings = bookings.filter(b => b.status === 'Booked')
  const cancelledBookings = bookings.filter(b => b.status === 'Cancelled')
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_amount), 0)
  const groups = groupedByEvent()

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div animate={{ x: [0, 20, 0], y: [0, -15, 0] }} transition={{ duration: 18, repeat: Infinity }}
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-red-900/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-4 mb-10">
          <Link href="/venue-dashboard">
            <motion.div whileHover={{ scale: 1.1, x: -2 }} className="w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-gray-600 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft size={16} />
            </motion.div>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1"><Sparkles size={12} className="text-red-500" /><span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Venue Analytics</span></div>
            <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Bookings</h1>
            <p className="text-gray-600 text-sm mt-0.5">All bookings across your events</p>
          </div>
        </motion.div>

        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <StatCard icon={<Ticket size={18}/>} label="Total" value={bookings.length} color="text-red-400" delay={0.1} />
            <StatCard icon={<Activity size={18}/>} label="Confirmed" value={confirmedBookings.length} color="text-emerald-400" delay={0.15} />
            <StatCard icon={<TrendingUp size={18}/>} label="Cancelled" value={cancelledBookings.length} color="text-orange-400" delay={0.2} />
            <StatCard icon={<IndianRupee size={18}/>} label="Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} color="text-yellow-400" delay={0.25} />
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} className="h-20 rounded-2xl bg-white/3" />)}
          </div>
        )}
        {error && <p className="text-center text-red-500 py-16">{error}</p>}

        {!loading && !error && bookings.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 border border-dashed border-white/6 rounded-3xl">
            <Ticket size={48} className="mx-auto text-gray-800 mb-4" />
            <p className="text-gray-500 text-lg font-black mb-2">No bookings yet</p>
            <p className="text-gray-700 text-sm">Customer bookings will appear here</p>
          </motion.div>
        )}

        <div className="space-y-3">
          {Object.entries(groups).map(([eventId, group], gi) => {
            const isExpanded = expandedEvents.has(eventId)
            const confirmed = group.bookings.filter(b => b.status === 'Booked')
            const cancelled = group.bookings.filter(b => b.status === 'Cancelled')
            const revenue = confirmed.reduce((s, b) => s + Number(b.total_amount), 0)
            return (
              <motion.div key={eventId} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + gi * 0.05 }}
                className="bg-white/[0.02] border border-white/6 hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-300">
                <button onClick={() => toggleEvent(eventId)} className="w-full p-5 flex items-center justify-between text-left hover:bg-white/2 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-600/12 border border-red-500/20 flex items-center justify-center shrink-0">
                      <Ticket size={16} className="text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-white font-black">{group.eventTitle}</h2>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-gray-700 text-xs">{group.eventType}</span>
                        <span className="text-gray-500 text-xs flex items-center gap-1"><Users size={10} /> {group.bookings.length}</span>
                        <span className="text-emerald-500 text-xs font-bold">{confirmed.length} confirmed</span>
                        {cancelled.length > 0 && <span className="text-red-500 text-xs">{cancelled.length} cancelled</span>}
                        <span className="text-white text-xs font-black">₹{revenue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} className="text-gray-600" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                      className="border-t border-white/5 overflow-hidden">
                      <div className="max-h-72 overflow-y-auto">
                        {group.bookings.map((booking, i) => (
                          <div key={booking.id} className={`px-5 py-4 flex items-center justify-between ${i < group.bookings.length - 1 ? 'border-b border-white/4' : ''}`}>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-gray-300 text-sm font-mono font-bold">#{booking.id}</span>
                                <StatusBadge status={booking.status} />
                              </div>
                              <div className="flex items-center gap-3 text-gray-700 text-xs">
                                <span className="flex items-center gap-1"><Ticket size={10} /> {booking.seats.length} seat{booking.seats.length > 1 ? 's' : ''}</span>
                                <span className="flex items-center gap-1"><Clock size={10} />{new Date(booking.booking_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                {booking.user_email && <span>{booking.user_email}</span>}
                              </div>
                            </div>
                            <p className="text-white font-black">₹{booking.total_amount}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
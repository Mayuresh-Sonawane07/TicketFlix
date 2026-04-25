'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { apiClient, eventAPI, Event } from '@/lib/api'
import { ArrowLeft, TrendingUp, Ticket, Star, IndianRupee, Calendar, BarChart2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#16a34a', '#dc2626', '#eab308', '#3b82f6']

function StatCard({ label, value, icon, color, sub, delay }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, ease: [0.23, 1, 0.32, 1] }}
      className="bg-white/[0.02] border border-white/6 rounded-2xl p-5 hover:border-white/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-white/4 flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <p className="text-white font-black text-2xl mb-0.5">{value}</p>
      <p className="text-gray-600 text-xs">{label}</p>
      {sub && <p className="text-gray-700 text-[10px] mt-0.5">{sub}</p>}
    </motion.div>
  )
}

const chartTooltipStyle = { contentStyle: { backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: 12 }, labelStyle: { color: '#f9fafb' } }

export default function AnalyticsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) { router.push('/login'); return }
      const user = await res.json()
      if (user.role !== 'VENUE_OWNER') { router.push('/'); return }
      fetchData()
    })()
  }, [])

  const fetchData = async () => {
    try {
      const [eventsRes, bookingsRes] = await Promise.all([eventAPI.getMyEvents(), apiClient.get('/bookings/venue_analytics/')])
      const eventsData = eventsRes.data
      setEvents(Array.isArray(eventsData) ? eventsData : (eventsData as any).results ?? [])
      const bookingsData = bookingsRes.data
      setBookings(Array.isArray(bookingsData) ? bookingsData : bookingsData.results ?? [])
      console.log("BOOKINGS DATA:", bookingsData)
    } catch {} finally { setLoading(false) }
  }

  const confirmedBookings = bookings.filter(b => b.status === 'Booked')
  const cancelledBookings = bookings.filter(b => b.status === 'Cancelled')
  const pendingBookings = bookings.filter(b => b.status === 'Pending')
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_amount), 0)
  const cancellationRate = bookings.length > 0 ? ((cancelledBookings.length / bookings.length) * 100).toFixed(1) : '0'
  const avgBookingValue = confirmedBookings.length > 0 ? (totalRevenue / confirmedBookings.length).toFixed(0) : '0'

  const revenueByMonth = () => {
    const months: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months[d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })] = 0 }
    confirmedBookings.forEach(b => { const key = new Date(b.booking_time).toLocaleString('en-IN', { month: 'short', year: '2-digit' }); if (key in months) months[key] += Number(b.total_amount) })
    return Object.entries(months).map(([month, revenue]) => ({ month, revenue }))
  }

  const bookingsByDay = () => {
    const days: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days[d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })] = 0 }
    bookings.forEach(b => { const key = new Date(b.booking_time).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }); if (key in days) days[key]++ })
    return Object.entries(days).map(([day, count]) => ({ day, count }))
  }

  const statusData = [{ name: 'Booked', value: confirmedBookings.length }, { name: 'Cancelled', value: cancelledBookings.length }, { name: 'Pending', value: pendingBookings.length }].filter(d => d.value > 0)
  const topEvents = events.map(event => {
    const eb = bookings.filter(
      b =>
        b.show_details &&
        b.show_details.event &&
        Number(b.show_details.event.id) === Number(event.id)
    )
    const rev = eb.filter(b => b.status === 'Booked').reduce((s, b) => s + Number(b.total_amount), 0)
    return { ...event, bookingCount: eb.length, revenue: rev }
  }).sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 5)

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-7 h-7 border-2 border-red-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div animate={{ x: [0, 25, 0], y: [0, -20, 0] }} transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-900/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-4 mb-10">
          <Link href="/venue-dashboard">
            <motion.div whileHover={{ scale: 1.1, x: -2 }} className="w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-gray-600 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft size={16} />
            </motion.div>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1"><Sparkles size={12} className="text-red-500" /><span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Performance</span></div>
            <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Analytics</h1>
            <p className="text-gray-600 text-sm mt-0.5">Overview of your venue performance</p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon={<IndianRupee size={18}/>} color="text-emerald-400" sub={`Avg ₹${avgBookingValue}/booking`} delay={0.1} />
          <StatCard label="Total Bookings" value={bookings.length} icon={<Ticket size={18}/>} color="text-red-400" sub={`${confirmedBookings.length} confirmed`} delay={0.15} />
          <StatCard label="Total Events" value={events.length} icon={<Star size={18}/>} color="text-yellow-400" sub="All time" delay={0.2} />
          <StatCard label="Cancellation Rate" value={`${cancellationRate}%`} icon={<TrendingUp size={18}/>} color="text-blue-400" sub={`${cancelledBookings.length} cancelled`} delay={0.25} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white/[0.02] border border-white/6 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <IndianRupee size={15} className="text-emerald-400" />
              <h2 className="text-white font-black text-sm uppercase tracking-widest">Revenue — Last 6 Months</h2>
            </div>
            {totalRevenue === 0 ? (
              <div className="h-48 flex items-center justify-center"><p className="text-gray-700 text-sm">No revenue data yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueByMonth()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip {...chartTooltipStyle} formatter={(v: any) => [`₹${v}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#dc2626" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white/[0.02] border border-white/6 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Calendar size={15} className="text-blue-400" />
              <h2 className="text-white font-black text-sm uppercase tracking-widest">Bookings — Last 7 Days</h2>
            </div>
            {bookings.length === 0 ? (
              <div className="h-48 flex items-center justify-center"><p className="text-gray-700 text-sm">No booking data yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={bookingsByDay()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip {...chartTooltipStyle} formatter={(v: any) => [v, 'Bookings']} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white/[0.02] border border-white/6 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 size={15} className="text-yellow-400" />
              <h2 className="text-white font-black text-sm uppercase tracking-widest">Booking Status</h2>
            </div>
            {bookings.length === 0 ? (
              <div className="h-48 flex items-center justify-center"><p className="text-gray-700 text-sm">No data yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...chartTooltipStyle} />
                  <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-white/[0.02] border border-white/6 rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <Star size={15} className="text-yellow-400" />
              <h2 className="text-white font-black text-sm uppercase tracking-widest">Your Events</h2>
            </div>
            {events.length === 0 ? <p className="text-gray-700 text-sm">No events created yet</p> : (
              <div className="space-y-3">
                {topEvents.map((event, i) => (
                  <div key={event.id} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                    <span className="text-gray-700 text-sm font-mono w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{event.title}</p>
                      <p className="text-gray-600 text-xs">{event.event_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm font-black">{event.bookingCount} bookings</p>
                      <p className="text-emerald-400 text-xs">₹{event.revenue.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-white/[0.02] border border-white/6 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={14} className="text-red-500" />
            <h2 className="text-white font-black">Booking Breakdown</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Confirmed', count: confirmedBookings.length, color: 'bg-emerald-500', pct: bookings.length > 0 ? (confirmedBookings.length / bookings.length) * 100 : 0 },
              { label: 'Cancelled', count: cancelledBookings.length, color: 'bg-red-500', pct: bookings.length > 0 ? (cancelledBookings.length / bookings.length) * 100 : 0 },
              { label: 'Pending', count: pendingBookings.length, color: 'bg-yellow-500', pct: bookings.length > 0 ? (pendingBookings.length / bookings.length) * 100 : 0 },
            ].map(({ label, count, color, pct }) => (
              <div key={label}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500 text-sm">{label}</span>
                  <span className="text-white font-black text-sm">{count} <span className="text-gray-700 font-normal">({pct.toFixed(1)}%)</span></span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.7 }} className={`${color} h-2 rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
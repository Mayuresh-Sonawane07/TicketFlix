'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { apiClient, eventAPI, Event } from '@/lib/api'
import { ArrowLeft, TrendingUp, Ticket, Users, Star, IndianRupee, Calendar, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#16a34a', '#dc2626', '#eab308', '#3b82f6']

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
      const [eventsRes, bookingsRes] = await Promise.all([
        eventAPI.getMyEvents(),
        apiClient.get('/bookings/venue_analytics/'),
      ])
      const eventsData = eventsRes.data
      setEvents(Array.isArray(eventsData) ? eventsData : (eventsData as any).results ?? [])
      const bookingsData = bookingsRes.data
      setBookings(Array.isArray(bookingsData) ? bookingsData : bookingsData.results ?? [])
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }

  // Stats
  const confirmedBookings = bookings.filter(b => b.status === 'Booked')
  const cancelledBookings = bookings.filter(b => b.status === 'Cancelled')
  const pendingBookings = bookings.filter(b => b.status === 'Pending')
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_amount), 0)
  const cancellationRate = bookings.length > 0
    ? ((cancelledBookings.length / bookings.length) * 100).toFixed(1)
    : '0'
  const avgBookingValue = confirmedBookings.length > 0
    ? (totalRevenue / confirmedBookings.length).toFixed(0)
    : '0'

  // Revenue by month (last 6 months)
  const revenueByMonth = () => {
    const months: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
      months[key] = 0
    }
    confirmedBookings.forEach(b => {
      const d = new Date(b.booking_time)
      const key = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
      if (key in months) months[key] += Number(b.total_amount)
    })
    return Object.entries(months).map(([month, revenue]) => ({ month, revenue }))
  }

  // Bookings by day (last 7 days)
  const bookingsByDay = () => {
    const days: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
      days[key] = 0
    }
    bookings.forEach(b => {
      const d = new Date(b.booking_time)
      const key = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
      if (key in days) days[key]++
    })
    return Object.entries(days).map(([day, count]) => ({ day, count }))
  }

  // Booking status pie
  const statusData = [
    { name: 'Confirmed', value: confirmedBookings.length },
    { name: 'Cancelled', value: cancelledBookings.length },
    { name: 'Pending', value: pendingBookings.length },
  ].filter(d => d.value > 0)

  // Top events by bookings
  const topEvents = events.map(event => {
    const eventBookings = bookings.filter(
      b => Number(b.show_details?.event?.id) === Number(event.id)
    )
    const revenue = eventBookings
      .filter(b => b.status === 'Booked')
      .reduce((sum, b) => sum + Number(b.total_amount), 0)
    return { ...event, bookingCount: eventBookings.length, revenue }
  }).sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 5)

  const stats = [
    {
      label: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: <IndianRupee size={22} className="text-green-400" />,
      color: 'border-green-500/30 bg-green-500/5',
      sub: `Avg ₹${avgBookingValue} per booking`
    },
    {
      label: 'Total Bookings',
      value: bookings.length,
      icon: <Ticket size={22} className="text-red-400" />,
      color: 'border-red-500/30 bg-red-500/5',
      sub: `${confirmedBookings.length} confirmed`
    },
    {
      label: 'Total Events',
      value: events.length,
      icon: <Star size={22} className="text-yellow-400" />,
      color: 'border-yellow-500/30 bg-yellow-500/5',
      sub: 'All time'
    },
    {
      label: 'Cancellation Rate',
      value: `${cancellationRate}%`,
      icon: <TrendingUp size={22} className="text-blue-400" />,
      color: 'border-blue-500/30 bg-blue-500/5',
      sub: `${cancelledBookings.length} cancelled`
    },
  ]

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-gray-400">Loading analytics...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/venue-dashboard" className="text-gray-400 hover:text-white transition">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">Overview of your venue performance</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-gray-900 border ${stat.color} rounded-xl p-6`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-gray-800 rounded-lg">{stat.icon}</div>
              </div>
              <p className="text-white font-bold text-2xl mb-1">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className="text-gray-600 text-xs mt-1">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Revenue by Month */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <IndianRupee size={18} className="text-green-400" />
              <h2 className="text-white font-bold">Revenue — Last 6 Months</h2>
            </div>
            {totalRevenue === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-500 text-sm">No revenue data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueByMonth()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#f9fafb' }}
                    formatter={(value: any) => [`₹${value}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Bookings by Day */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Calendar size={18} className="text-blue-400" />
              <h2 className="text-white font-bold">Bookings — Last 7 Days</h2>
            </div>
            {bookings.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-500 text-sm">No booking data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={bookingsByDay()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#f9fafb' }}
                    formatter={(value: any) => [value, 'Bookings']}
                  />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>

        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Booking Status Pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 size={18} className="text-yellow-400" />
              <h2 className="text-white font-bold">Booking Status</h2>
            </div>
            {bookings.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-500 text-sm">No data yet</p>
              </div>
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
                  >
                    {statusData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value: any, name: any) => [value, name]}
                  />
                  <Legend
                    formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Top Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 lg:col-span-2"
          >
            <div className="flex items-center gap-2 mb-6">
              <Star size={18} className="text-yellow-400" />
              <h2 className="text-white font-bold">Your Events</h2>
            </div>
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm">No events created yet</p>
            ) : (
              <div className="space-y-3">
                {topEvents.map((event, i) => (
                  <div key={event.id} className="flex items-center gap-4 py-3 border-b border-gray-800/50 last:border-0">
                    <span className="text-gray-600 text-sm font-mono w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{event.title}</p>
                      <p className="text-gray-500 text-xs">{event.event_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm font-semibold">{event.bookingCount} bookings</p>
                      <p className="text-green-400 text-xs">₹{event.revenue.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        </div>

        {/* Booking Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6"
        >
          <h2 className="text-white font-bold text-lg mb-6">Booking Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Confirmed', count: confirmedBookings.length, color: 'bg-green-500', pct: bookings.length > 0 ? (confirmedBookings.length / bookings.length) * 100 : 0 },
              { label: 'Cancelled', count: cancelledBookings.length, color: 'bg-red-500', pct: bookings.length > 0 ? (cancelledBookings.length / bookings.length) * 100 : 0 },
              { label: 'Pending', count: pendingBookings.length, color: 'bg-yellow-500', pct: bookings.length > 0 ? (pendingBookings.length / bookings.length) * 100 : 0 },
            ].map(({ label, count, color, pct }) => (
              <div key={label}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400 text-sm">{label}</span>
                  <span className="text-white font-semibold text-sm">{count} ({pct.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
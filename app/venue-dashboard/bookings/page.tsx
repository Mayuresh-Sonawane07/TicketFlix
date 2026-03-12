'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { ArrowLeft, Users, Ticket, ChevronDown, ChevronUp, IndianRupee, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function VenueBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'VENUE_OWNER') { router.push('/'); return }
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const res = await apiClient.get('/bookings/venue_analytics/')
      const data = res.data
      setBookings(Array.isArray(data) ? data : data.results ?? [])
    } catch {
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const toggleEvent = (key: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // Group bookings by event
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
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_amount), 0)
  const groups = groupedByEvent()

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/venue-dashboard" className="text-gray-400 hover:text-white transition">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Bookings</h1>
            <p className="text-gray-400 text-sm mt-1">All bookings across your events</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Total Bookings', value: bookings.length, icon: <Ticket size={20} className="text-red-500" /> },
            { label: 'Active Bookings', value: confirmedBookings.length, icon: <Users size={20} className="text-green-500" /> },
            { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: <IndianRupee size={20} className="text-yellow-500" /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                {stat.icon}
                <span className="text-gray-400 text-sm">{stat.label}</span>
              </div>
              <p className="text-white font-bold text-2xl">{stat.value}</p>
            </div>
          ))}
        </div>

        {loading && <div className="text-center text-gray-400 py-16">Loading...</div>}
        {error && <div className="text-center text-red-500 py-16">{error}</div>}

        {!loading && !error && bookings.length === 0 && (
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-xl">
            <Ticket className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400">No bookings yet for your events</p>
          </div>
        )}

        {/* Grouped by Event */}
        <div className="space-y-4">
          {Object.entries(groups).map(([eventId, group]) => {
            const isExpanded = expandedEvents.has(eventId)
            const confirmed = group.bookings.filter(b => b.status === 'Booked')
            const cancelled = group.bookings.filter(b => b.status === 'Cancelled')
            const revenue = confirmed.reduce((sum, b) => sum + Number(b.total_amount), 0)

            return (
              <motion.div
                key={eventId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
              >
                {/* Event Header Row */}
                <button
                  onClick={() => toggleEvent(eventId)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-800/50 transition text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-600/10 rounded-lg">
                      <Ticket className="text-red-500" size={20} />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-lg">{group.eventTitle}</h2>
                      <p className="text-gray-500 text-xs mt-0.5">{group.eventType}</p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Users size={13} /> {group.bookings.length} total
                        </span>
                        <span className="text-green-400 text-sm">{confirmed.length} confirmed</span>
                        {cancelled.length > 0 && (
                          <span className="text-red-400 text-sm">{cancelled.length} cancelled</span>
                        )}
                        <span className="text-white text-sm font-semibold">
                          ₹{revenue.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="text-gray-400 shrink-0" size={20} />
                    : <ChevronDown className="text-gray-400 shrink-0" size={20} />}
                </button>

                {/* Bookings Table */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-800 overflow-hidden"
                    >
                      <div className="max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-800/50">
                            <th className="text-left text-gray-500 text-xs font-medium px-6 py-3">Booking ID</th>
                            <th className="text-left text-gray-500 text-xs font-medium px-6 py-3">Customer</th>
                            <th className="text-left text-gray-500 text-xs font-medium px-6 py-3">Show Time</th>
                            <th className="text-left text-gray-500 text-xs font-medium px-6 py-3">Seats</th>
                            <th className="text-left text-gray-500 text-xs font-medium px-6 py-3">Amount</th>
                            <th className="text-left text-gray-500 text-xs font-medium px-6 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.bookings.map((booking) => (
                            <motion.tr
                              key={booking.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border-b border-gray-800/30 hover:bg-gray-800/20 transition"
                            >
                              <td className="px-6 py-4 text-white font-mono text-sm">#{booking.id}</td>
                              <td className="px-6 py-4 text-gray-300 text-sm">
                                {booking.user_email || `User #${booking.user}`}
                              </td>
                              <td className="px-6 py-4 text-gray-400 text-sm">
                                {booking.show_details?.show_time
                                  ? new Date(booking.show_details.show_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                                  : '-'}
                              </td>
                              <td className="px-6 py-4 text-gray-300 text-sm">{booking.seats.length} seats</td>
                              <td className="px-6 py-4 text-green-400 font-semibold">₹{Number(booking.total_amount).toLocaleString('en-IN')}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  booking.status === 'Booked' ? 'bg-green-600/20 text-green-400' :
                                  booking.status === 'Cancelled' ? 'bg-red-600/20 text-red-400' :
                                  'bg-yellow-600/20 text-yellow-400'
                                }`}>
                                  {booking.status}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
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
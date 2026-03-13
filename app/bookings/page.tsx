'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { bookingAPI, apiClient, Booking } from '@/lib/api'
import { Ticket, CheckCircle, XCircle, Clock, Users, ChevronDown, ChevronUp, IndianRupee, Download } from 'lucide-react'

function BookingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState<number | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [generatingPDF, setGeneratingPDF] = useState<number | null>(null)
  const showSuccess = searchParams.get('success') === 'true'

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) { router.push('/login'); return }
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setUserRole(user.role)
    }
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const userData = localStorage.getItem('user')
      const user = userData ? JSON.parse(userData) : null
      const endpoint = user?.role === 'VENUE_OWNER' ? '/bookings/venue_analytics/' : '/bookings/'
      const res = await apiClient.get(endpoint)
      const data = res.data
      setBookings(Array.isArray(data) ? data : (data as any).results ?? [])
    } catch {
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this booking?')) return
    setCancelling(id)
    try {
      await bookingAPI.cancel(id)
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Cannot cancel this booking')
    } finally {
      setCancelling(null)
    }
  }

  const handleDownloadTicket = async (booking: any) => {
    setGeneratingPDF(booking.id)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210
      const pageH = 297

      const eventTitle = booking.show_details?.event?.title || `Show #${booking.show}`
      const eventType = booking.show_details?.event?.event_type || 'EVENT'
      const showTime = booking.show_details?.show_time || ''
      const theaterName = booking.show_details?.theater_name || 'Venue'
      const QRCode = await import('qrcode')
      
      // Background
      doc.setFillColor(10, 10, 15)
      doc.rect(0, 0, W, pageH, 'F')

      // Red header
      doc.setFillColor(220, 38, 38)
      doc.rect(0, 0, W, 42, 'F')

      // Branding
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(26)
      doc.setFont('helvetica', 'bold')
      doc.text('TicketFlix', 14, 20)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(255, 200, 200)
      doc.text('Your Official Booking Ticket', 14, 30)

      // Booking ID
      doc.setFontSize(10)
      doc.setTextColor(255, 200, 200)
      doc.text(`Booking #${booking.id}`, W - 14, 20, { align: 'right' })
      doc.setFontSize(8)
      doc.text(new Date(booking.booking_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), W - 14, 28, { align: 'right' })

      // Status badge
      doc.setFillColor(22, 163, 74)
      doc.roundedRect(W - 46, 34, 32, 7, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('CONFIRMED', W - 30, 39.5, { align: 'center' })

      // Event card
      doc.setFillColor(20, 20, 30)
      doc.roundedRect(12, 50, W - 24, 55, 4, 4, 'F')
      doc.setDrawColor(60, 60, 80)
      doc.setLineWidth(0.3)
      doc.roundedRect(12, 50, W - 24, 55, 4, 4, 'S')

      // Event type badge
      doc.setFillColor(220, 38, 38)
      doc.roundedRect(18, 56, 22, 6, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text(eventType, 29, 60.5, { align: 'center' })

      // Event title
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(eventTitle, 18, 74)

      // Show time
      if (showTime) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(180, 180, 200)
        const showDate = new Date(showTime).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })
        doc.text(`Date: ${showDate}`, 18, 84)
      }

      // Theater
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 170)
      doc.text(`Venue: ${theaterName}`, 18, 93)

      // Divider
      doc.setDrawColor(60, 60, 80)
      doc.setLineWidth(0.5)
      doc.setLineDashPattern([3, 3], 0)
      doc.line(12, 116, W - 12, 116)
      doc.setLineDashPattern([], 0)
      doc.setFillColor(10, 10, 15)
      doc.circle(12, 116, 3, 'F')
      doc.circle(W - 12, 116, 3, 'F')

      // Info grid
      const infoY = 125
      const colW = (W - 24) / 3
      const infoCols = [
        { label: 'SEATS', value: `${booking.seats.length} Seat${booking.seats.length > 1 ? 's' : ''}` },
        { label: 'AMOUNT PAID', value: `Rs.${Number(booking.total_amount).toLocaleString('en-IN')}` },
        { label: 'PAYMENT', value: 'Confirmed' },
      ]
      infoCols.forEach((col, i) => {
        const x = 14 + i * colW
        doc.setFillColor(20, 20, 30)
        doc.roundedRect(x, infoY, colW - 4, 22, 3, 3, 'F')
        doc.setDrawColor(60, 60, 80)
        doc.setLineWidth(0.3)
        doc.roundedRect(x, infoY, colW - 4, 22, 3, 3, 'S')
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(120, 120, 140)
        doc.text(col.label, x + (colW - 4) / 2, infoY + 7, { align: 'center' })
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text(col.value, x + (colW - 4) / 2, infoY + 16, { align: 'center' })
      })

      // Transaction ID
      if (booking.transaction_id) {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 120)
        doc.text(`Transaction ID: ${booking.transaction_id}`, W / 2, 158, { align: 'center' })
      }

      // QR placeholder
      // Real QR Code
      const verifyUrl = `${window.location.origin}/verify/${booking.id}?token=${booking.qr_token}`
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      })
      const qrY = 163
      doc.setFillColor(20, 20, 30)
      doc.roundedRect(W / 2 - 27, qrY, 54, 60, 4, 4, 'F')
      doc.setDrawColor(80, 80, 100)
      doc.setLineWidth(0.5)
      doc.roundedRect(W / 2 - 27, qrY, 54, 60, 4, 4, 'S')
      doc.addImage(qrDataUrl, 'PNG', W / 2 - 23, qrY + 4, 46, 46)
      doc.setFontSize(7)
      doc.setTextColor(100, 100, 120)
      doc.text('Scan at Entry', W / 2, qrY + 54, { align: 'center' })
      doc.setFontSize(6)
      doc.setTextColor(80, 80, 100)
      doc.text(`#TF${String(booking.id).padStart(6, '0')}`, W / 2, qrY + 58, { align: 'center' })

      // Footer
      doc.setFillColor(20, 20, 30)
      doc.rect(0, pageH - 20, W, 20, 'F')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 100)
      doc.text('This is an official TicketFlix booking confirmation. Please carry this ticket to the venue.', W / 2, pageH - 12, { align: 'center' })
      doc.setTextColor(220, 38, 38)
      doc.text('www.ticketflix.com', W / 2, pageH - 5, { align: 'center' })

      doc.save(`TicketFlix-Booking-${booking.id}.pdf`)
    } catch (err) {
      alert('Failed to generate ticket. Please try again.')
    } finally {
      setGeneratingPDF(null)
    }
  }

  const toggleEvent = (key: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const groupedByEvent = () => {
    const groups: Record<string, { eventTitle: string; eventType: string; bookings: Booking[] }> = {}
    bookings.forEach(b => {
      const eventId = String((b as any).show_details?.event?.id || (b as any).show || 'unknown')
      const eventTitle = (b as any).show_details?.event?.title || `Show #${(b as any).show}`
      const eventType = (b as any).show_details?.event?.event_type || ''
      if (!groups[eventId]) groups[eventId] = { eventTitle, eventType, bookings: [] }
      groups[eventId].bookings.push(b)
    })
    return groups
  }

  // ─── VENUE OWNER VIEW ───
  if (userRole === 'VENUE_OWNER') {
    const groups = groupedByEvent()
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-white mb-2">Venue Bookings</h1>
          <p className="text-gray-400 text-sm mb-8">All bookings across your events</p>

          {loading && <div className="text-center text-gray-400 py-16">Loading bookings...</div>}
          {error && <div className="text-center text-red-500 py-16">{error}</div>}

          {!loading && !error && bookings.length === 0 && (
            <div className="text-center py-24 border border-dashed border-gray-800 rounded-xl">
              <Ticket className="mx-auto text-gray-600 mb-4" size={48} />
              <p className="text-gray-400 text-lg mb-2">No bookings yet</p>
              <p className="text-gray-500 text-sm">Bookings from customers will appear here</p>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(groups).map(([eventId, group]) => {
              const isExpanded = expandedEvents.has(eventId)
              const confirmed = group.bookings.filter(b => b.status === 'Booked')
              const cancelled = group.bookings.filter(b => b.status === 'Cancelled')
              const revenue = confirmed.reduce((sum, b) => sum + Number(b.total_amount), 0)
              return (
                <motion.div key={eventId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <button onClick={() => toggleEvent(eventId)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-800/50 transition">
                    <div className="flex items-start gap-4 text-left">
                      <div className="p-2 bg-red-600/10 rounded-lg"><Ticket className="text-red-500" size={20} /></div>
                      <div>
                        <h2 className="text-white font-bold text-lg">{group.eventTitle}</h2>
                        <p className="text-gray-500 text-xs mt-0.5">{group.eventType}</p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-gray-400 text-sm flex items-center gap-1"><Users size={13} /> {group.bookings.length} total</span>
                          <span className="text-green-400 text-sm">{confirmed.length} confirmed</span>
                          {cancelled.length > 0 && <span className="text-red-400 text-sm">{cancelled.length} cancelled</span>}
                          <span className="text-white text-sm font-semibold flex items-center gap-1"><IndianRupee size={13} />₹{revenue.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="text-gray-400" size={20} /> : <ChevronDown className="text-gray-400" size={20} />}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="border-t border-gray-800 overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                          {group.bookings.map((booking, i) => (
                            <div key={booking.id}
                              className={`px-6 py-4 flex items-center justify-between ${i !== group.bookings.length - 1 ? 'border-b border-gray-800/50' : ''}`}>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-gray-300 text-sm font-medium">Booking #{booking.id}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    booking.status === 'Booked' ? 'bg-green-600/20 text-green-400' :
                                    booking.status === 'Cancelled' ? 'bg-red-600/20 text-red-400' :
                                    'bg-yellow-600/20 text-yellow-400'}`}>{booking.status}</span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-500 text-xs">
                                  <span className="flex items-center gap-1"><Ticket size={11} /> {booking.seats.length} seat{booking.seats.length > 1 ? 's' : ''}</span>
                                  <span className="flex items-center gap-1"><Clock size={11} />{new Date(booking.booking_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                  {(booking as any).user_email && <span>{(booking as any).user_email}</span>}
                                </div>
                              </div>
                              <p className="text-white font-bold">₹{booking.total_amount}</p>
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

  // ─── CUSTOMER VIEW ───
  const groups = groupedByEvent()

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <AnimatePresence>
          {showSuccess && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-green-600/10 border border-green-600/50 rounded-lg flex items-center gap-3">
              <CheckCircle className="text-green-500" size={20} />
              <p className="text-green-400 font-semibold">Booking confirmed successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <h1 className="text-3xl font-bold text-white mb-8">My Bookings</h1>

        {loading && <div className="text-center text-gray-400 py-16">Loading bookings...</div>}
        {error && <div className="text-center text-red-500 py-16">{error}</div>}

        {!loading && !error && bookings.length === 0 && (
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-xl">
            <Ticket className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400 text-lg mb-2">No bookings yet</p>
            <p className="text-gray-500 text-sm mb-6">Browse events and book your first ticket</p>
            <button onClick={() => router.push('/')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold">
              Browse Events →
            </button>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(groups).map(([eventId, group]) => {
            const isExpanded = expandedEvents.has(eventId)
            const confirmed = group.bookings.filter(b => b.status === 'Booked')
            return (
              <motion.div key={eventId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

                {/* Event Header */}
                <button onClick={() => toggleEvent(eventId)}
                  className="w-full p-5 flex items-center justify-between hover:bg-gray-800/50 transition text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-600/10 rounded-lg"><Ticket className="text-red-500" size={18} /></div>
                    <div>
                      <h2 className="text-white font-bold">{group.eventTitle}</h2>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {group.eventType} · {group.bookings.length} booking{group.bookings.length > 1 ? 's' : ''} · {confirmed.length} confirmed
                      </p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="text-gray-400 shrink-0" size={18} /> : <ChevronDown className="text-gray-400 shrink-0" size={18} />}
                </button>

                {/* Booking Cards */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="border-t border-gray-800 overflow-hidden">
                      <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                        {group.bookings.map((booking) => (
                          <div key={booking.id}
                            className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-white font-semibold text-sm">Booking #{booking.id}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    booking.status === 'Booked' ? 'bg-green-600/20 text-green-400' :
                                    booking.status === 'Cancelled' ? 'bg-red-600/20 text-red-400' :
                                    'bg-yellow-600/20 text-yellow-400'}`}>{booking.status}</span>
                                </div>
                                <div className="text-gray-400 text-xs space-y-1">
                                  <p className="flex items-center gap-1.5">
                                    <Ticket size={11} /> {booking.seats.length} seat{booking.seats.length > 1 ? 's' : ''}
                                  </p>
                                  <p className="flex items-center gap-1.5">
                                    <Clock size={11} />
                                    {new Date(booking.booking_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                  </p>
                                  {(booking as any).show_details?.show_time && (
                                    <p className="text-gray-500">
                                      Show: {new Date((booking as any).show_details.show_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <p className="text-red-400 font-bold text-lg">₹{booking.total_amount}</p>
                            </div>

                            {/* Action Buttons */}
                            {booking.status === 'Booked' && (
                              <div className="flex items-center gap-2 pt-3 border-t border-gray-700/50">
                                <motion.button
                                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                  onClick={() => handleDownloadTicket(booking)}
                                  disabled={generatingPDF === booking.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-green-600/40 text-green-400 rounded-lg hover:bg-green-600/10 transition text-xs font-medium disabled:opacity-50"
                                >
                                  <Download size={12} />
                                  {generatingPDF === booking.id ? 'Generating...' : 'Download Ticket'}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                  onClick={() => handleCancel(booking.id)}
                                  disabled={cancelling === booking.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-red-600/30 text-red-500 rounded-lg hover:bg-red-600/10 transition text-xs disabled:opacity-50"
                                >
                                  <XCircle size={12} />
                                  {cancelling === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                                </motion.button>
                              </div>
                            )}
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

export default function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        Loading...
      </div>
    }>
      <BookingsContent />
    </Suspense>
  )
}
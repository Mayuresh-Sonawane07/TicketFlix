'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { bookingAPI, apiClient, Booking } from '@/lib/api'
import {
  Ticket, CheckCircle2, XCircle, Clock, Users, ChevronDown, ChevronUp,
  IndianRupee, Download, Sparkles, Calendar, MapPin, Activity, TrendingUp,
} from 'lucide-react'
import DownloadTicket from '@/components/DownloadTicket'

// Reusable ambient background
function AmbientBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <motion.div animate={{ x: [0, 20, 0], y: [0, -15, 0] }} transition={{ duration: 18, repeat: Infinity }} className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-red-900/8 blur-[100px]" />
      <motion.div animate={{ x: [0, -15, 0], y: [0, 20, 0] }} transition={{ duration: 22, repeat: Infinity, delay: 4 }} className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-900/6 blur-[100px]" />
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, delay }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, ease: [0.23, 1, 0.32, 1] }}
      className="relative rounded-2xl border border-white/6 bg-white/[0.03] p-5 overflow-hidden group hover:border-white/10 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <Icon size={18} className={color} />
        <span className={`text-[9px] font-black uppercase tracking-widest ${color} opacity-40`}>{label}</span>
      </div>
      <div className="text-3xl font-black text-white tracking-tight">{value}</div>
      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    </motion.div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = status === 'Booked' ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20'
    : status === 'Cancelled' ? 'bg-red-500/12 text-red-400 border-red-500/20'
    : 'bg-yellow-500/12 text-yellow-400 border-yellow-500/20'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-bold uppercase tracking-widest ${cfg}`}>
      <span className="w-1 h-1 rounded-full bg-current" />{status}
    </span>
  )
}

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
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(user => {
      if (!user) { router.push('/login'); return }
      setUserRole(user.role); fetchBookings(user.role)
    })
  }, [])

  const fetchBookings = async (role: string) => {
    try {
      const endpoint = role === 'VENUE_OWNER' ? '/bookings/venue_analytics/' : '/bookings/'
      const res = await apiClient.get(endpoint)
      const data = res.data
      setBookings(Array.isArray(data) ? data : (data as any).results ?? [])
    } catch { setError('Failed to load bookings') } finally { setLoading(false) }
  }

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this booking?')) return
    setCancelling(id)
    try {
      await bookingAPI.cancel(id)
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b))
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Cannot cancel this booking')
    } finally { setCancelling(null) }
  }

  interface BookingDetail extends Booking {
    show_details?: { event?: { title?: string; event_type?: string }; show_time?: string; theater_name?: string }
    qr_token?: string; user_email?: string
  }

  const handleDownloadTicket = async (booking: BookingDetail) => {
    setGeneratingPDF(booking.id)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210; const pageH = 297
      const eventTitle = booking.show_details?.event?.title || `Show #${booking.show}`
      const eventType = booking.show_details?.event?.event_type || 'EVENT'
      const showTime = booking.show_details?.show_time || ''
      const theaterName = booking.show_details?.theater_name || 'Venue'
      const QRCode = await import('qrcode')
      doc.setFillColor(10, 10, 15); doc.rect(0, 0, W, pageH, 'F')
      doc.setFillColor(220, 38, 38); doc.rect(0, 0, W, 42, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(26); doc.setFont('helvetica', 'bold'); doc.text('TicketFlix', 14, 20)
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 200, 200); doc.text('Your Official Booking Ticket', 14, 30)
      doc.setFontSize(10); doc.setTextColor(255, 200, 200); doc.text(`Booking #${booking.id}`, W - 14, 20, { align: 'right' })
      doc.setFontSize(8); doc.text(new Date(booking.booking_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), W - 14, 28, { align: 'right' })
      doc.setFillColor(22, 163, 74); doc.roundedRect(W - 46, 34, 32, 7, 2, 2, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.text('CONFIRMED', W - 30, 39.5, { align: 'center' })
      doc.setFillColor(20, 20, 30); doc.roundedRect(12, 50, W - 24, 55, 4, 4, 'F')
      doc.setDrawColor(60, 60, 80); doc.setLineWidth(0.3); doc.roundedRect(12, 50, W - 24, 55, 4, 4, 'S')
      doc.setFillColor(220, 38, 38); doc.roundedRect(18, 56, 22, 6, 2, 2, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.text(eventType, 29, 60.5, { align: 'center' })
      doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255); doc.text(eventTitle, 18, 74)
      if (showTime) { doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 180, 200); doc.text(`Date: ${new Date(showTime).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}`, 18, 84) }
      doc.setFontSize(10); doc.setTextColor(150, 150, 170); doc.text(`Venue: ${theaterName}`, 18, 93)
      doc.setDrawColor(60, 60, 80); doc.setLineWidth(0.5); doc.setLineDashPattern([3, 3], 0); doc.line(12, 116, W - 12, 116); doc.setLineDashPattern([], 0)
      doc.setFillColor(10, 10, 15); doc.circle(12, 116, 3, 'F'); doc.circle(W - 12, 116, 3, 'F')
      const infoY = 125; const colW = (W - 24) / 3
      const infoCols = [{ label: 'SEATS', value: `${booking.seats.length} Seat${booking.seats.length > 1 ? 's' : ''}` }, { label: 'AMOUNT PAID', value: `Rs.${Number(booking.total_amount).toLocaleString('en-IN')}` }, { label: 'PAYMENT', value: 'Confirmed' }]
      infoCols.forEach((col, i) => {
        const x = 14 + i * colW; doc.setFillColor(20, 20, 30); doc.roundedRect(x, infoY, colW - 4, 22, 3, 3, 'F')
        doc.setDrawColor(60, 60, 80); doc.setLineWidth(0.3); doc.roundedRect(x, infoY, colW - 4, 22, 3, 3, 'S')
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 140); doc.text(col.label, x + (colW - 4) / 2, infoY + 7, { align: 'center' })
        doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255); doc.text(col.value, x + (colW - 4) / 2, infoY + 16, { align: 'center' })
      })
      if (booking.transaction_id) { doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 120); doc.text(`Transaction ID: ${booking.transaction_id}`, W / 2, 158, { align: 'center' }) }
      const verifyUrl = `${window.location.origin}/verify/${booking.id}?token=${booking.qr_token}`
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' }, errorCorrectionLevel: 'H' })
      const qrY = 163; doc.setFillColor(20, 20, 30); doc.roundedRect(W / 2 - 27, qrY, 54, 60, 4, 4, 'F')
      doc.setDrawColor(80, 80, 100); doc.setLineWidth(0.5); doc.roundedRect(W / 2 - 27, qrY, 54, 60, 4, 4, 'S')
      doc.addImage(qrDataUrl, 'PNG', W / 2 - 23, qrY + 4, 46, 46)
      doc.setFontSize(7); doc.setTextColor(100, 100, 120); doc.text('Scan at Entry', W / 2, qrY + 54, { align: 'center' })
      doc.setFontSize(6); doc.setTextColor(80, 80, 100); doc.text(`#TF${String(booking.id).padStart(6, '0')}`, W / 2, qrY + 58, { align: 'center' })
      doc.setFillColor(20, 20, 30); doc.rect(0, pageH - 20, W, 20, 'F')
      doc.setFontSize(8); doc.setTextColor(80, 80, 100); doc.text('This is an official TicketFlix booking confirmation. Please carry this ticket to the venue.', W / 2, pageH - 12, { align: 'center' })
      doc.setTextColor(220, 38, 38); doc.text('https://ticketflix-ten.vercel.app', W / 2, pageH - 5, { align: 'center' })
      doc.save(`TicketFlix-Booking-${booking.id}.pdf`)
    } catch { alert('Failed to generate ticket. Please try again.') }
    finally { setGeneratingPDF(null) }
  }

  const toggleEvent = (key: string) => {
    setExpandedEvents(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
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

  const confirmedCount = bookings.filter(b => b.status === 'Booked').length
  const totalSpent = bookings.filter(b => b.status === 'Booked').reduce((s, b) => s + Number(b.total_amount), 0)
  const groups = groupedByEvent()

  // ── VENUE OWNER VIEW ──
  if (userRole === 'VENUE_OWNER') {
    return (
      <div className="min-h-screen bg-[#080808]">
        <AmbientBg />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
            <div className="flex items-center gap-2 mb-2"><Sparkles size={13} className="text-red-500" /><span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Venue Analytics</span></div>
            <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Bookings</h1>
            <p className="text-gray-600 text-sm mt-1">All bookings across your events</p>
          </motion.div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[...Array(3)].map((_, i) => <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} className="h-24 rounded-2xl bg-white/3" />)}
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              <StatCard icon={Ticket} label="Total" value={bookings.length} color="text-red-400" delay={0.1} />
              <StatCard icon={CheckCircle2} label="Confirmed" value={confirmedCount} color="text-emerald-400" delay={0.15} />
              <StatCard icon={Activity} label="Events" value={Object.keys(groups).length} color="text-blue-400" delay={0.2} />
              <StatCard icon={TrendingUp} label="Revenue" value={`₹${totalSpent.toLocaleString('en-IN')}`} color="text-yellow-400" delay={0.25} />
            </div>
          )}

          {error && <p className="text-red-500 text-center py-16">{error}</p>}

          {!loading && !error && bookings.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 border border-dashed border-white/6 rounded-3xl">
              <Ticket size={48} className="mx-auto text-gray-800 mb-4" />
              <p className="text-gray-500 text-lg font-semibold mb-2">No bookings yet</p>
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
                        <h2 className="text-white font-bold">{group.eventTitle}</h2>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-gray-600 text-xs">{group.eventType}</span>
                          <span className="text-gray-500 text-xs flex items-center gap-1"><Users size={10} /> {group.bookings.length}</span>
                          <span className="text-emerald-500 text-xs font-semibold">{confirmed.length} confirmed</span>
                          {cancelled.length > 0 && <span className="text-red-500 text-xs">{cancelled.length} cancelled</span>}
                          <span className="text-white text-xs font-bold">₹{revenue.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} className="text-gray-600" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="border-t border-white/5 overflow-hidden">
                        <div className="max-h-72 overflow-y-auto">
                          {group.bookings.map((booking, i) => (
                            <div key={booking.id} className={`px-5 py-4 flex items-center justify-between ${i < group.bookings.length - 1 ? 'border-b border-white/4' : ''}`}>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-gray-300 text-sm font-mono font-medium">#{i + 1}</span>
                                  <StatusBadge status={booking.status} />
                                </div>
                                <div className="flex items-center gap-3 text-gray-600 text-xs">
                                  <span className="flex items-center gap-1"><Ticket size={10} /> {booking.seats.length} seat{booking.seats.length > 1 ? 's' : ''}</span>
                                  <span className="flex items-center gap-1"><Clock size={10} />{new Date(booking.booking_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
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

  // ── CUSTOMER VIEW ──
  return (
    <div className="min-h-screen bg-[#080808]">
      <AmbientBg />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <AnimatePresence>
          {showSuccess && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <div><p className="text-emerald-300 font-bold text-sm">Booking confirmed!</p><p className="text-emerald-600 text-xs">Your ticket is ready to download.</p></div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <div className="flex items-center gap-2 mb-2"><Ticket size={13} className="text-red-500" /><span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Your Tickets</span></div>
          <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>My Bookings</h1>
        </motion.div>

        {!loading && !error && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
            <StatCard icon={Ticket} label="Total" value={bookings.length} color="text-red-400" delay={0.1} />
            <StatCard icon={CheckCircle2} label="Active" value={confirmedCount} color="text-emerald-400" delay={0.15} />
            <StatCard icon={IndianRupee} label="Total Spent" value={`₹${totalSpent.toLocaleString('en-IN')}`} color="text-yellow-400" delay={0.2} />
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} className="h-20 rounded-2xl bg-white/3" />)}
          </div>
        )}
        {error && <p className="text-red-500 text-center py-16">{error}</p>}

        {!loading && !error && bookings.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 border border-dashed border-white/6 rounded-3xl">
            <Ticket size={48} className="mx-auto text-gray-800 mb-4" />
            <p className="text-gray-500 text-lg font-semibold mb-2">No bookings yet</p>
            <p className="text-gray-700 text-sm mb-8">Browse events and book your first ticket</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => router.push('/')}
              className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-500 transition-colors">
              Browse Events →
            </motion.button>
          </motion.div>
        )}

        <div className="space-y-3">
          {Object.entries(groups).map(([eventId, group], gi) => {
            const isExpanded = expandedEvents.has(eventId)
            const confirmed = group.bookings.filter(b => b.status === 'Booked')
            return (
              <motion.div key={eventId} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + gi * 0.06 }}
                className="bg-white/[0.02] border border-white/6 hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-300">
                <button onClick={() => toggleEvent(eventId)} className="w-full p-5 flex items-center justify-between text-left hover:bg-white/2 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-600/12 border border-red-500/20 flex items-center justify-center shrink-0">
                      <Ticket size={16} className="text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-white font-bold">{group.eventTitle}</h2>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {group.eventType} · {group.bookings.length} booking{group.bookings.length > 1 ? 's' : ''} · {confirmed.length} confirmed
                      </p>
                    </div>
                  </div>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} className="text-gray-600" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="border-t border-white/5 overflow-hidden">
                      <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                        {group.bookings.map((booking, i) => (
                          <motion.div key={booking.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="relative bg-white/[0.03] border border-white/6 rounded-2xl p-4 overflow-hidden">
                            {/* Ticket stub line */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-600 via-red-500/50 to-transparent rounded-l-2xl" />
                            <div className="pl-3">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-white font-mono text-sm font-bold">#{i + 1}</span>
                                    <StatusBadge status={booking.status} />
                                  </div>
                                  <div className="space-y-1 text-gray-600 text-xs">
                                    <p className="flex items-center gap-1.5"><Ticket size={10} /> {booking.seats.length} seat{booking.seats.length > 1 ? 's' : ''}</p>
                                    <p className="flex items-center gap-1.5"><Clock size={10} />{new Date(booking.booking_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                    {(booking as any).show_details?.show_time && (
                                      <p className="flex items-center gap-1.5"><Calendar size={10} /> Show: {new Date((booking as any).show_details.show_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                    )}
                                  </div>
                                </div>
                                <p className="text-2xl font-black text-white">₹{booking.total_amount}</p>
                              </div>
                              {booking.status === 'Booked' && (
                                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                                  <DownloadTicket booking={booking} />
                                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleCancel(booking.id)} disabled={cancelling === booking.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/8 transition text-xs font-semibold disabled:opacity-50">
                                    <XCircle size={12} />{cancelling === booking.id ? 'Cancelling...' : 'Cancel'}
                                  </motion.button>
                                </div>
                              )}
                            </div>
                          </motion.div>
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
    <Suspense fallback={<div className="min-h-screen bg-[#080808] flex items-center justify-center"><motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-gray-600 text-sm">Loading...</motion.div></div>}>
      <BookingsContent />
    </Suspense>
  )
}
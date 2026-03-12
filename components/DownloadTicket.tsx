'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { motion } from 'framer-motion'

interface TicketData {
  bookingId: number
  eventTitle: string
  eventType: string
  showTime: string
  theaterName?: string
  seats: number[]
  totalAmount: number
  status: string
  bookingTime: string
  userEmail?: string
  transactionId?: string
}

export default function DownloadTicket({ booking }: { booking: any }) {
  const [generating, setGenerating] = useState(false)

  const generatePDF = async () => {
    setGenerating(true)
    try {
      // Build ticket data from booking
      const ticket: TicketData = {
        bookingId: booking.id,
        eventTitle: booking.show_details?.event?.title || `Show #${booking.show}`,
        eventType: booking.show_details?.event?.event_type || 'EVENT',
        showTime: booking.show_details?.show_time || '',
        theaterName: booking.show_details?.theater_name || 'Venue',
        seats: booking.seats || [],
        totalAmount: booking.total_amount,
        status: booking.status,
        bookingTime: booking.booking_time,
        userEmail: booking.user_email || '',
        transactionId: booking.transaction_id || '',
      }

      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const W = 210
      const pageH = 297

      // ── Background ──
      doc.setFillColor(10, 10, 15)
      doc.rect(0, 0, W, pageH, 'F')

      // ── Red header bar ──
      doc.setFillColor(220, 38, 38)
      doc.rect(0, 0, W, 42, 'F')

      // ── TicketFlix branding ──
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(26)
      doc.setFont('helvetica', 'bold')
      doc.text('TicketFlix', 14, 20)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(255, 200, 200)
      doc.text('Your Official Booking Ticket', 14, 30)

      // Booking ID top right
      doc.setFontSize(10)
      doc.setTextColor(255, 200, 200)
      doc.text(`Booking #${ticket.bookingId}`, W - 14, 20, { align: 'right' })
      doc.setFontSize(8)
      doc.text(new Date(ticket.bookingTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), W - 14, 28, { align: 'right' })

      // ── Status badge ──
      const statusColor = ticket.status === 'Booked' ? [22, 163, 74] : [220, 38, 38]
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
      doc.roundedRect(W - 46, 34, 32, 7, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(ticket.status.toUpperCase(), W - 30, 39.5, { align: 'center' })

      // ── Event card ──
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
      doc.text(ticket.eventType, 29, 60.5, { align: 'center' })

      // Event title
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(ticket.eventTitle, 18, 74)

      // Show time
      if (ticket.showTime) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(180, 180, 200)
        const showDate = new Date(ticket.showTime).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })
        doc.text(`📅  ${showDate}`, 18, 84)
      }

      // Theater
      if (ticket.theaterName) {
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 170)
        doc.text(`📍  ${ticket.theaterName}`, 18, 93)
      }

      // ── Divider with circles (ticket tear effect) ──
      doc.setDrawColor(60, 60, 80)
      doc.setLineWidth(0.5)
      doc.setLineDashPattern([3, 3], 0)
      doc.line(12, 116, W - 12, 116)
      doc.setLineDashPattern([], 0)
      doc.setFillColor(10, 10, 15)
      doc.circle(12, 116, 3, 'F')
      doc.circle(W - 12, 116, 3, 'F')

      // ── Info grid ──
      const infoY = 125
      const colW = (W - 24) / 3
      const infoCols = [
        { label: 'SEATS', value: `${ticket.seats.length} Seat${ticket.seats.length > 1 ? 's' : ''}` },
        { label: 'AMOUNT PAID', value: `Rs.${Number(ticket.totalAmount).toLocaleString('en-IN')}` },
        { label: 'PAYMENT', value: ticket.status === 'Booked' ? 'Confirmed' : ticket.status },
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

      // ── Transaction ID ──
      if (ticket.transactionId) {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 120)
        doc.text(`Transaction ID: ${ticket.transactionId}`, W / 2, 158, { align: 'center' })
      }

      // ── QR code placeholder ──
      const qrY = 165
      doc.setFillColor(20, 20, 30)
      doc.roundedRect(W / 2 - 25, qrY, 50, 50, 4, 4, 'F')
      doc.setDrawColor(80, 80, 100)
      doc.setLineWidth(0.5)
      doc.roundedRect(W / 2 - 25, qrY, 50, 50, 4, 4, 'S')

      // Draw QR pattern (decorative)
      doc.setFillColor(220, 38, 38)
      ;[[0,0],[0,1],[0,2],[1,0],[2,0],[2,1],[2,2],[1,2],
        [4,0],[5,0],[6,0],[4,1],[6,1],[4,2],[5,2],[6,2],
        [0,4],[1,4],[2,4],[0,5],[2,5],[0,6],[1,6],[2,6],
        [3,3],[4,4],[5,5],[3,5],[5,3]
      ].forEach(([col, row]) => {
        doc.rect(W/2 - 22 + col * 5, qrY + 7 + row * 5, 4, 4, 'F')
      })

      doc.setFontSize(7)
      doc.setTextColor(100, 100, 120)
      doc.text(`#TF${String(ticket.bookingId).padStart(6, '0')}`, W / 2, qrY + 46, { align: 'center' })

      // ── Footer ──
      doc.setFillColor(20, 20, 30)
      doc.rect(0, pageH - 20, W, 20, 'F')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 100)
      doc.text('This is an official TicketFlix booking confirmation. Please carry this ticket to the venue.', W / 2, pageH - 12, { align: 'center' })
      doc.setTextColor(220, 38, 38)
      doc.text('www.ticketflix.com', W / 2, pageH - 5, { align: 'center' })

      // Save
      doc.save(`TicketFlix-Booking-${ticket.bookingId}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('Failed to generate ticket. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (booking.status !== 'Booked') return null

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={generatePDF}
      disabled={generating}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-green-600/40 text-green-400 rounded-lg hover:bg-green-600/10 transition text-xs font-medium disabled:opacity-50"
    >
      <Download size={13} />
      {generating ? 'Generating...' : 'Download Ticket'}
    </motion.button>
  )
}
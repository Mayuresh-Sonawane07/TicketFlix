'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { motion } from 'framer-motion'

export default function DownloadTicket({ booking }: { booking: any }) {
  const [generating, setGenerating] = useState(false)

  const generatePDF = async () => {
    setGenerating(true)
    try {
      const show    = booking.show_details
      const event   = show?.event
      const ticket  = {
        bookingId:     booking.id,
        eventTitle:    event?.title        || `Show #${booking.show}`,
        eventType:     event?.event_type   || 'EVENT',
        showTime:      show?.show_time     || '',
        theaterName:   show?.theater_name  || 'Venue',
        screenNumber:  show?.screen_number || '',
        seats:         booking.seats       || [],
        totalAmount:   booking.total_amount,
        status:        booking.status,
        bookingTime:   booking.booking_time,
        transactionId: booking.transaction_id || '',
        // ── QR comes pre-generated from the serializer as a data URI ──
        qrBase64:      booking.qr_code_base64 || '',
      }

      const { jsPDF } = await import('jspdf')
      const W = 210, H = 297
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      // ── Background ────────────────────────────────────────────────────────
      doc.setFillColor(8, 8, 12)
      doc.rect(0, 0, W, H, 'F')
      doc.setDrawColor(18, 18, 28)
      doc.setLineWidth(0.15)
      for (let i = 0; i < H; i += 8) doc.line(0, i, W, i)
      for (let i = 0; i < W; i += 8) doc.line(i, 0, i, H)

      // ── Card ──────────────────────────────────────────────────────────────
      const cardX = 12, cardY = 14, cardW = W - 24, cardH = H - 28
      doc.setFillColor(220, 38, 38)
      doc.setGState(doc.GState({ opacity: 0.08 }))
      doc.roundedRect(cardX - 1, cardY - 1, cardW + 2, cardH + 2, 6, 6, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))
      doc.setFillColor(13, 13, 20)
      doc.roundedRect(cardX, cardY, cardW, cardH, 5, 5, 'F')
      doc.setDrawColor(35, 35, 52)
      doc.setLineWidth(0.4)
      doc.roundedRect(cardX, cardY, cardW, cardH, 5, 5, 'S')

      // ── Header ────────────────────────────────────────────────────────────
      const hdrH = 38
      doc.setFillColor(180, 22, 22)
      doc.roundedRect(cardX, cardY, cardW, hdrH, 5, 5, 'F')
      doc.rect(cardX, cardY + hdrH - 6, cardW, 6, 'F')
      doc.setFillColor(220, 38, 38)
      doc.setGState(doc.GState({ opacity: 0.4 }))
      doc.triangle(cardX + cardW - 50, cardY, cardX + cardW, cardY, cardX + cardW, cardY + hdrH, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22); doc.setFont('helvetica', 'bold')
      doc.text('TicketFlix', cardX + 10, cardY + 17)
      doc.setFontSize(8); doc.setFont('helvetica', 'normal')
      doc.setTextColor(255, 190, 190)
      doc.text('Your Official Booking Ticket', cardX + 10, cardY + 27)

      doc.setFontSize(11); doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(`Booking #${ticket.bookingId}`, cardX + cardW - 10, cardY + 15, { align: 'right' })
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
      doc.setTextColor(255, 200, 200)
      const bTime = ticket.bookingTime
        ? new Date(ticket.bookingTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        : ''
      doc.text(bTime, cardX + cardW - 10, cardY + 24, { align: 'right' })

      const isConfirmed = ticket.status === 'Booked' || ticket.status === 'confirmed'
      doc.setFillColor(isConfirmed ? 22 : 220, isConfirmed ? 163 : 38, isConfirmed ? 74 : 38)
      doc.roundedRect(cardX + cardW - 38, cardY + 27, 28, 8, 2, 2, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'bold')
      doc.text(ticket.status.toUpperCase(), cardX + cardW - 24, cardY + 33, { align: 'center' })

      // ── Event section ─────────────────────────────────────────────────────
      let y = cardY + hdrH + 10
      doc.setFillColor(220, 38, 38)
      doc.roundedRect(cardX + 10, y, 26, 6.5, 1.5, 1.5, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold')
      doc.text(ticket.eventType.toUpperCase(), cardX + 23, y + 4.5, { align: 'center' })

      y += 12
      doc.setFontSize(24); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
      const maxW = cardW - 20
      let titleText = ticket.eventTitle
      while (doc.getTextWidth(titleText) > maxW && titleText.length > 4)
        titleText = titleText.slice(0, -1)
      if (titleText !== ticket.eventTitle) titleText += '…'
      doc.text(titleText, cardX + 10, y)

      y += 5
      doc.setDrawColor(220, 38, 38); doc.setLineWidth(1.2)
      doc.line(cardX + 10, y, cardX + 10 + Math.min(doc.getTextWidth(ticket.eventTitle), maxW), y)
      doc.setLineWidth(0.3)

      y += 10
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 200, 220)
      if (ticket.showTime) {
        doc.text(
          new Date(ticket.showTime).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }),
          cardX + 10, y
        )
        y += 9
      }
      doc.setFontSize(9.5); doc.setTextColor(140, 140, 165)
      const venueStr = [ticket.theaterName, ticket.screenNumber ? `Screen ${ticket.screenNumber}` : '']
        .filter(Boolean).join('  ·  ')
      doc.text(venueStr, cardX + 10, y)

      // ── Perforated divider ────────────────────────────────────────────────
      y += 14
      doc.setFillColor(8, 8, 12)
      doc.circle(cardX, y, 4, 'F')
      doc.circle(cardX + cardW, y, 4, 'F')
      doc.setDrawColor(40, 40, 60); doc.setLineWidth(0.6)
      doc.setLineDashPattern([2.5, 2.5], 0)
      doc.line(cardX + 4, y, cardX + cardW - 4, y)
      doc.setLineDashPattern([], 0)

      // ── Stats strip ───────────────────────────────────────────────────────
      y += 10
      const colW = (cardW - 20) / 3
      const statCols = [
        { label: 'SEATS',       value: `${ticket.seats.length} Seat${ticket.seats.length !== 1 ? 's' : ''}` },
        { label: 'AMOUNT PAID', value: `₹${Number(ticket.totalAmount).toLocaleString('en-IN')}` },
        { label: 'PAYMENT',     value: isConfirmed ? 'Confirmed' : ticket.status },
      ]
      statCols.forEach((col, i) => {
        const cx = cardX + 10 + i * colW
        doc.setFillColor(20, 20, 32)
        doc.roundedRect(cx, y, colW - 4, 22, 3, 3, 'F')
        doc.setDrawColor(38, 38, 58); doc.setLineWidth(0.3)
        doc.roundedRect(cx, y, colW - 4, 22, 3, 3, 'S')
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 130)
        doc.text(col.label, cx + (colW - 4) / 2, y + 7.5, { align: 'center' })
        doc.setFontSize(11); doc.setFont('helvetica', 'bold')
        doc.setTextColor(
          i === 2 && isConfirmed ? 74  : 255,
          i === 2 && isConfirmed ? 222 : 255,
          i === 2 && isConfirmed ? 128 : 255,
        )
        doc.text(col.value, cx + (colW - 4) / 2, y + 17, { align: 'center' })
      })

      // ── Transaction ID ────────────────────────────────────────────────────
      y += 30
      if (ticket.transactionId) {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(70, 70, 95)
        doc.text(`Transaction ID: ${ticket.transactionId}`, W / 2, y, { align: 'center' })
        y += 8
      }

      // ── QR Code ───────────────────────────────────────────────────────────
      const qrSize = 52
      const qrX   = W / 2 - qrSize / 2
      const qrY   = y + 4

      doc.setFillColor(255, 255, 255)
      doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 18, 4, 4, 'F')

      if (ticket.qrBase64) {
        // qrBase64 is already a full data URI from the serializer
        // Strip the prefix to get raw base64, then embed
        const raw = ticket.qrBase64.replace(/^data:image\/png;base64,/, '')
        doc.addImage(raw, 'PNG', qrX, qrY, qrSize, qrSize)
      } else {
        doc.setFillColor(240, 240, 240)
        doc.rect(qrX, qrY, qrSize, qrSize, 'F')
        doc.setTextColor(150, 150, 150); doc.setFontSize(8)
        doc.text('QR Code', qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' })
      }

      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
      doc.text('Scan at Entry', W / 2, qrY + qrSize + 5, { align: 'center' })
      doc.setFontSize(6.5); doc.setTextColor(150, 150, 150)
      doc.text(`#TF${String(ticket.bookingId).padStart(6, '0')}`, W / 2, qrY + qrSize + 11, { align: 'center' })

      // ── Seat numbers ──────────────────────────────────────────────────────
      const seatNums = ticket.seats
        .map((s: any) => s?.seat_number || s?.seatNumber || (typeof s === 'string' ? s : null))
        .filter(Boolean)
      if (seatNums.length > 0) {
        const sY = qrY + qrSize + 22
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(70, 70, 95)
        doc.text('SEAT(S):', W / 2, sY, { align: 'center' })
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 200, 220)
        doc.text(seatNums.join('  ·  '), W / 2, sY + 7, { align: 'center' })
      }

      // ── Footer ────────────────────────────────────────────────────────────
      const ftY = cardY + cardH - 14
      doc.setDrawColor(28, 28, 42); doc.setLineWidth(0.3)
      doc.line(cardX + 10, ftY - 3, cardX + cardW - 10, ftY - 3)
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 80)
      doc.text(
        'This is an official TicketFlix booking confirmation. Please carry this ticket to the venue.',
        W / 2, ftY + 3, { align: 'center' }
      )
      doc.setTextColor(220, 38, 38); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.text('www.ticketflix.com', W / 2, ftY + 10, { align: 'center' })

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
      {generating ? 'Generating…' : 'Download Ticket'}
    </motion.button>
  )
}
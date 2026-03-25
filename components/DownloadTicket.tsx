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
  screenNumber?: string | number
  seats: any[]
  totalAmount: number
  status: string
  bookingTime: string
  userEmail?: string
  transactionId?: string
  qrCodeUrl?: string
}

export default function DownloadTicket({ booking }: { booking: any }) {
  const [generating, setGenerating] = useState(false)

  const generatePDF = async () => {
    setGenerating(true)
    try {
      const ticket: TicketData = {
        bookingId: booking.id,
        eventTitle: booking.show_details?.event?.title || `Show #${booking.show}`,
        eventType: booking.show_details?.event?.event_type || 'EVENT',
        showTime: booking.show_details?.show_time || '',
        theaterName: booking.show_details?.theater_name || 'Venue',
        screenNumber: booking.show_details?.screen_number || '',
        seats: booking.seats || [],
        totalAmount: booking.total_amount,
        status: booking.status,
        bookingTime: booking.booking_time,
        userEmail: booking.user_email || '',
        transactionId: booking.transaction_id || '',
        qrCodeUrl: booking.qr_code || booking.qrCode || booking.qr_code_url || '',
      }

      const { jsPDF } = await import('jspdf')

      // ── Canvas dimensions: tall ticket format ──
      const W = 210
      const H = 297
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      // ── Helper: rounded rect with gradient simulation ──
      const fillRect = (x: number, y: number, w: number, h: number, r: number, fill: number[]) => {
        doc.setFillColor(fill[0], fill[1], fill[2])
        doc.roundedRect(x, y, w, h, r, r, 'F')
      }

      // ════════════════════════════════════════════════════
      //  BACKGROUND — deep charcoal with subtle texture
      // ════════════════════════════════════════════════════
      doc.setFillColor(8, 8, 12)
      doc.rect(0, 0, W, H, 'F')

      // Subtle grid lines for texture
      doc.setDrawColor(18, 18, 28)
      doc.setLineWidth(0.15)
      for (let i = 0; i < H; i += 8) doc.line(0, i, W, i)
      for (let i = 0; i < W; i += 8) doc.line(i, 0, i, H)

      // ════════════════════════════════════════════════════
      //  MAIN TICKET CARD — centered, with soft border glow
      // ════════════════════════════════════════════════════
      const cardX = 12
      const cardY = 14
      const cardW = W - 24
      const cardH = H - 28

      // Outer glow layer
      doc.setFillColor(220, 38, 38)
      doc.setGState(doc.GState({ opacity: 0.08 }))
      doc.roundedRect(cardX - 1, cardY - 1, cardW + 2, cardH + 2, 6, 6, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

      // Card body
      doc.setFillColor(13, 13, 20)
      doc.roundedRect(cardX, cardY, cardW, cardH, 5, 5, 'F')
      doc.setDrawColor(35, 35, 52)
      doc.setLineWidth(0.4)
      doc.roundedRect(cardX, cardY, cardW, cardH, 5, 5, 'S')

      // ════════════════════════════════════════════════════
      //  HEADER STRIP — cinematic red gradient
      // ════════════════════════════════════════════════════
      const hdrY = cardY
      const hdrH = 38

      // Red header fill
      doc.setFillColor(180, 22, 22)
      doc.roundedRect(cardX, hdrY, cardW, hdrH, 5, 5, 'F')
      // Flatten bottom corners
      doc.setFillColor(180, 22, 22)
      doc.rect(cardX, hdrY + hdrH - 6, cardW, 6, 'F')

      // Diagonal accent stripe
      doc.setFillColor(220, 38, 38)
      doc.setGState(doc.GState({ opacity: 0.4 }))
      doc.triangle(cardX + cardW - 50, hdrY, cardX + cardW, hdrY, cardX + cardW, hdrY + hdrH, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

      // Brand name
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('TicketFlix', cardX + 10, hdrY + 17)

      // Tagline
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(255, 190, 190)
      doc.text('Your Official Booking Ticket', cardX + 10, hdrY + 27)

      // Booking # and date (top right)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(`Booking #${ticket.bookingId}`, cardX + cardW - 10, hdrY + 15, { align: 'right' })

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(255, 200, 200)
      const bTime = ticket.bookingTime
        ? new Date(ticket.bookingTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        : ''
      doc.text(bTime, cardX + cardW - 10, hdrY + 24, { align: 'right' })

      // Status pill
      const isConfirmed = ticket.status === 'Booked' || ticket.status === 'confirmed'
      doc.setFillColor(isConfirmed ? 22 : 220, isConfirmed ? 163 : 38, isConfirmed ? 74 : 38)
      doc.roundedRect(cardX + cardW - 38, hdrY + 27, 28, 8, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text(ticket.status.toUpperCase(), cardX + cardW - 24, hdrY + 33, { align: 'center' })

      // ════════════════════════════════════════════════════
      //  EVENT SECTION
      // ════════════════════════════════════════════════════
      let y = hdrY + hdrH + 10

      // Event type badge
      doc.setFillColor(220, 38, 38)
      doc.roundedRect(cardX + 10, y, 26, 6.5, 1.5, 1.5, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'bold')
      doc.text(ticket.eventType.toUpperCase(), cardX + 23, y + 4.5, { align: 'center' })

      y += 12
      // Event title — large, bold
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      // Truncate long titles
      const maxTitleW = cardW - 20
      let title = ticket.eventTitle
      while (doc.getTextWidth(title) > maxTitleW && title.length > 4) title = title.slice(0, -1)
      if (title !== ticket.eventTitle) title += '…'
      doc.text(title, cardX + 10, y)

      y += 5
      // Decorative red underline
      doc.setDrawColor(220, 38, 38)
      doc.setLineWidth(1.2)
      doc.line(cardX + 10, y, cardX + 10 + Math.min(doc.getTextWidth(ticket.eventTitle), maxTitleW), y)
      doc.setLineWidth(0.3)

      y += 10
      // Date & time row
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(200, 200, 220)
      if (ticket.showTime) {
        const showDate = new Date(ticket.showTime).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })
        doc.text(`${showDate}`, cardX + 10, y)
        y += 9
      }

      // Venue row
      doc.setFontSize(9.5)
      doc.setTextColor(140, 140, 165)
      const venueStr = [ticket.theaterName, ticket.screenNumber ? `Screen ${ticket.screenNumber}` : ''].filter(Boolean).join('  ·  ')
      doc.text(venueStr, cardX + 10, y)

      // ════════════════════════════════════════════════════
      //  PERFORATED DIVIDER
      // ════════════════════════════════════════════════════
      y += 14
      const divY = y
      // Left notch
      doc.setFillColor(8, 8, 12)
      doc.circle(cardX, divY, 4, 'F')
      // Right notch
      doc.circle(cardX + cardW, divY, 4, 'F')
      // Dashed line
      doc.setDrawColor(40, 40, 60)
      doc.setLineWidth(0.6)
      doc.setLineDashPattern([2.5, 2.5], 0)
      doc.line(cardX + 4, divY, cardX + cardW - 4, divY)
      doc.setLineDashPattern([], 0)

      // ════════════════════════════════════════════════════
      //  STATS STRIP  (seats / amount / payment)
      // ════════════════════════════════════════════════════
      y = divY + 10
      const statsW = cardW - 20
      const statCols = [
        { label: 'SEATS',       value: `${ticket.seats.length} Seat${ticket.seats.length !== 1 ? 's' : ''}` },
        { label: 'AMOUNT PAID', value: `₹${Number(ticket.totalAmount).toLocaleString('en-IN')}` },
        { label: 'PAYMENT',     value: isConfirmed ? 'Confirmed' : ticket.status },
      ]
      const colW = statsW / 3

      statCols.forEach((col, i) => {
        const cx = cardX + 10 + i * colW
        // Card bg
        doc.setFillColor(20, 20, 32)
        doc.roundedRect(cx, y, colW - 4, 22, 3, 3, 'F')
        doc.setDrawColor(38, 38, 58)
        doc.setLineWidth(0.3)
        doc.roundedRect(cx, y, colW - 4, 22, 3, 3, 'S')
        // Label
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 130)
        doc.text(col.label, cx + (colW - 4) / 2, y + 7.5, { align: 'center' })
        // Value
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(i === 2 && isConfirmed ? 74 : 255, i === 2 && isConfirmed ? 222 : 255, i === 2 && isConfirmed ? 128 : 255)
        doc.text(col.value, cx + (colW - 4) / 2, y + 17, { align: 'center' })
      })

      // ════════════════════════════════════════════════════
      //  TRANSACTION ID
      // ════════════════════════════════════════════════════
      y += 30
      if (ticket.transactionId) {
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(70, 70, 95)
        doc.text(`Transaction ID: ${ticket.transactionId}`, W / 2, y, { align: 'center' })
        y += 8
      }

      // ════════════════════════════════════════════════════
      //  QR CODE — embed the real QR image
      // ════════════════════════════════════════════════════
      const qrSize = 52
      const qrX = W / 2 - qrSize / 2
      const qrY2 = y + 4

      // QR card background
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(qrX - 5, qrY2 - 5, qrSize + 10, qrSize + 18, 4, 4, 'F')

      // Embed real QR if available
      if (ticket.qrCodeUrl) {
        try {
          // Fetch QR as base64
          const res = await fetch(ticket.qrCodeUrl)
          const blob = await res.blob()
          const b64: string = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
          const ext = blob.type.includes('png') ? 'PNG' : 'JPEG'
          doc.addImage(b64, ext, qrX, qrY2, qrSize, qrSize)
        } catch {
          // Fallback: draw placeholder
          doc.setFillColor(240, 240, 240)
          doc.rect(qrX, qrY2, qrSize, qrSize, 'F')
          doc.setTextColor(150, 150, 150)
          doc.setFontSize(8)
          doc.text('QR Code', qrX + qrSize / 2, qrY2 + qrSize / 2, { align: 'center' })
        }
      } else {
        doc.setFillColor(240, 240, 240)
        doc.rect(qrX, qrY2, qrSize, qrSize, 'F')
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(8)
        doc.text('QR Code', qrX + qrSize / 2, qrY2 + qrSize / 2, { align: 'center' })
      }

      // QR label inside white card
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text('Scan at Entry', W / 2, qrY2 + qrSize + 5, { align: 'center' })
      doc.setFontSize(6.5)
      doc.setTextColor(150, 150, 150)
      doc.text(`#TF${String(ticket.bookingId).padStart(6, '0')}`, W / 2, qrY2 + qrSize + 11, { align: 'center' })

      // ════════════════════════════════════════════════════
      //  SEAT LIST (if seats have numbers)
      // ════════════════════════════════════════════════════
      const seatNums = ticket.seats
        .map((s: any) => s?.seat_number || s?.seatNumber || (typeof s === 'string' ? s : null))
        .filter(Boolean)

      if (seatNums.length > 0) {
        const seatY = qrY2 + qrSize + 22
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(70, 70, 95)
        doc.text('SEAT(S):', W / 2, seatY, { align: 'center' })
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(200, 200, 220)
        doc.text(seatNums.join('  ·  '), W / 2, seatY + 7, { align: 'center' })
      }

      // ════════════════════════════════════════════════════
      //  FOOTER
      // ════════════════════════════════════════════════════
      const ftY = cardY + cardH - 14
      doc.setDrawColor(28, 28, 42)
      doc.setLineWidth(0.3)
      doc.line(cardX + 10, ftY - 3, cardX + cardW - 10, ftY - 3)

      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 80)
      doc.text(
        'This is an official TicketFlix booking confirmation. Please carry this ticket to the venue.',
        W / 2, ftY + 3, { align: 'center' }
      )
      doc.setTextColor(220, 38, 38)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
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
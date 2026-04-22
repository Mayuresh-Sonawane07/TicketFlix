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
      const event = show?.event || {}
      const posterUrl = event?.image || booking?.event_image || null

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
        qrBase64:      booking.qr_code_base64 || '',
      }

      const { jsPDF } = await import('jspdf')
      const W = 210, H = 297
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      // ── Background ─────────────────────────
      doc.setFillColor(8, 8, 12)
      doc.rect(0, 0, W, H, 'F')

      // grid pattern
      doc.setDrawColor(18, 18, 28)
      doc.setLineWidth(0.15)
      for (let i = 0; i < H; i += 8) doc.line(0, i, W, i)
      for (let i = 0; i < W; i += 8) doc.line(i, 0, i, H)

      // ── Card ───────────────────────────────
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

      // ── Poster (FIXED) ─────────────────────
      let posterHeight = 0
      if (posterUrl) {
        try {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.src = posterUrl
          img.referrerPolicy = "no-referrer"

          await new Promise((resolve) => {
            img.onload = resolve
          })

          doc.addImage(img, 'JPEG', cardX, cardY, cardW, 50)
          posterHeight = 50
        } catch {
          console.log('Image failed')
        }
      }

      // ── Header (below poster) ──────────────
      const hdrH = 42
      const hdrY = cardY + posterHeight

      doc.setFillColor(220, 38, 38)
      doc.rect(cardX, hdrY, cardW, hdrH, 'F')

      // glow effect
      doc.setFillColor(255, 80, 80)
      doc.setGState(doc.GState({ opacity: 0.15 }))
      doc.circle(cardX + cardW - 30, hdrY + 20, 30, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

      // header text
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('TicketFlix', cardX + 10, hdrY + 16)

      doc.setFontSize(8)
      doc.setTextColor(255, 190, 190)
      doc.text('Premium Booking Ticket', cardX + 10, hdrY + 26)

      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255)
      doc.text(`Booking #${ticket.bookingId}`, cardX + cardW - 10, hdrY + 14, { align: 'right' })

      // status badge
      const isConfirmed = ticket.status === 'Booked'
      doc.setFillColor(isConfirmed ? 22 : 220, isConfirmed ? 163 : 38, isConfirmed ? 74 : 38)
      doc.roundedRect(cardX + cardW - 38, hdrY + 24, 28, 8, 2, 2, 'F')

      doc.setFontSize(7)
      doc.setTextColor(255, 255, 255)
      doc.text(ticket.status.toUpperCase(), cardX + cardW - 24, hdrY + 30, { align: 'center' })

      // ── Event Section ──────────────────────
      let y = hdrY + hdrH + 10

      doc.setFillColor(220, 38, 38)
      doc.roundedRect(cardX + 10, y, 26, 6.5, 1.5, 1.5, 'F')

      doc.setFontSize(6.5)
      doc.setTextColor(255, 255, 255)
      doc.text(ticket.eventType.toUpperCase(), cardX + 23, y + 4.5, { align: 'center' })

      y += 12

      doc.setFontSize(24)
      doc.setTextColor(255, 255, 255)
      doc.text(ticket.eventTitle, cardX + 10, y)

      y += 10

      if (ticket.showTime) {
        doc.setFontSize(10)
        doc.setTextColor(200, 200, 220)
        doc.text(
          new Date(ticket.showTime).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }),
          cardX + 10, y
        )
        y += 10
      }

      // venue
      const venueStr = `${ticket.theaterName}\nScreen ${ticket.screenNumber || '-'}`
      doc.setFontSize(9.5)
      doc.setTextColor(140, 140, 165)
      doc.text(doc.splitTextToSize(venueStr, cardW - 20), cardX + 10, y)

      // ── Stats ──────────────────────────────
      y += 18

      const colW = (cardW - 20) / 3
      const stats = [
        { label: 'SEATS', value: ticket.seats.map((s: any) => s.seat_number || s).join(', ') },
        { label: 'AMOUNT', value: `₹${Number(ticket.totalAmount).toLocaleString('en-IN')}` },
        { label: 'STATUS', value: ticket.status },
      ]

      stats.forEach((col, i) => {
        const cx = cardX + 10 + i * colW

        doc.setFillColor(20, 20, 32)
        doc.roundedRect(cx, y, colW - 4, 20, 3, 3, 'F')

        doc.setFontSize(6.5)
        doc.setTextColor(100, 100, 130)
        doc.text(col.label, cx + (colW - 4) / 2, y + 6, { align: 'center' })

        doc.setFontSize(11)
        doc.setTextColor(255, 255, 255)
        doc.text(col.value, cx + (colW - 4) / 2, y + 14, { align: 'center' })
      })

      // ── QR ─────────────────────────────────
      const qrSize = 52
      const qrX = W / 2 - qrSize / 2
      const qrY = y + 30

      doc.setFillColor(255, 255, 255)
      doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 18, 4, 4, 'F')

      if (ticket.qrBase64) {
        const raw = ticket.qrBase64.replace(/^data:image\/png;base64,/, '')
        doc.addImage(raw, 'PNG', qrX, qrY, qrSize, qrSize)
      }

      doc.setFontSize(7)
      doc.setTextColor(100, 100, 100)
      doc.text('Scan at Entry', W / 2, qrY + qrSize + 5, { align: 'center' })

      // ── Seat Details (SAFE) ────────────────
      const groupedSeats = ticket.seats.reduce((acc: any, s: any) => {
        const cat = s?.category || 'Other'
        const seat = s?.seat_number || s
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(seat)
        return acc
      }, {})

      let sY = qrY + qrSize + 20

      doc.setFontSize(7)
      doc.setTextColor(120, 120, 150)
      doc.text('SEAT DETAILS', W / 2, sY, { align: 'center' })

      sY += 8

      Object.entries(groupedSeats).forEach(([cat, seats]: any) => {
        doc.setFontSize(8.5)
        doc.setTextColor(220, 220, 255)
        doc.text(`${cat}: ${seats.join(', ')}`, W / 2, sY, { align: 'center' })
        sY += 6
      })

      // ── Premium Strip ──────────────────────
      doc.setFillColor(220, 38, 38)
      doc.rect(cardX, cardY + cardH - 22, cardW, 3, 'F')

      doc.setFillColor(255, 120, 0)
      doc.rect(cardX, cardY + cardH - 19, cardW, 2, 'F')

      // ── Footer ─────────────────────────────
      const ftY = cardY + cardH - 14

      doc.setFontSize(8)
      doc.setTextColor(120, 120, 150)
      doc.text('Powered by TicketFlix • Premium Booking Experience', W / 2, ftY, { align: 'center' })

      doc.setFontSize(7)
      doc.setTextColor(80, 80, 100)
      doc.text('Valid only for this show • Non-transferable', W / 2, ftY + 6, { align: 'center' })

      doc.setFontSize(8)
      doc.setTextColor(220, 38, 38)
      doc.textWithLink(
        'https://ticketflix-ten.vercel.app',
        W / 2,
        ftY + 12,
        { url: 'https://ticketflix-ten.vercel.app', align: 'center' }
      )
      
      doc.save(`TicketFlix-${ticket.bookingId}.pdf`)
    } catch (err) {
      console.error(err)
      alert('Failed to generate ticket')
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
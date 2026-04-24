'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { motion } from 'framer-motion'

export default function DownloadTicket({ booking }: { booking: any }) {
  const [generating, setGenerating] = useState(false)

  const generatePDF = async () => {
    setGenerating(true)

    try {
      const show = booking.show_details || {}
      const event = show?.event || {}

      const ticket = {
        bookingId: booking.id,
        eventTitle: event?.title || 'Untitled Event',
        eventType: event?.event_type || 'EVENT',
        posterUrl: event?.image,

        showTime: show?.show_time,
        theaterName: show?.theater_name,
        screenNumber: show?.screen_number,

        seats: booking.seats || [],
        totalAmount: booking.total_amount,
        status: booking.status,
        bookingTime: booking.booking_time,
        transactionId: booking.transaction_id,

        qrBase64: booking.qr_code_base64,
      }

      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })

      const W = 210
      const H = 297

      // 🌈 BACKGROUND (Neon Gradient Feel)
      doc.setFillColor(15, 10, 35)
      doc.rect(0, 0, W, H, 'F')

      doc.setFillColor(60, 0, 120)
      doc.setGState(doc.GState({ opacity: 0.4 }))
      doc.rect(0, 0, W, 120, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

      // 💎 GLASS CARD
      const cardX = 8
      const cardY = 8
      const cardW = W - 16
      const cardH = H - 16

      doc.setFillColor(255, 255, 255)
      doc.setGState(doc.GState({ opacity: 0.08 }))
      doc.roundedRect(cardX, cardY, cardW, cardH, 8, 8, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

      doc.setDrawColor(255, 255, 255)
      doc.setGState(doc.GState({ opacity: 0.2 }))
      doc.roundedRect(cardX, cardY, cardW, cardH, 8, 8, 'S')
      doc.setGState(doc.GState({ opacity: 1 }))

      let y = cardY + 5

      // 🎬 POSTER (CINEMATIC)
      if (ticket.posterUrl) {
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.src = ticket.posterUrl

          await new Promise((res) => (img.onload = res))

          doc.addImage(img, 'JPEG', cardX, y, cardW, 80)

          // gradient overlay bottom
          doc.setFillColor(0, 0, 0)
          doc.setGState(doc.GState({ opacity: 0.6 }))
          doc.rect(cardX, y + 45, cardW, 35, 'F')
          doc.setGState(doc.GState({ opacity: 1 }))

          y += 85
        } catch {
          y += 10
        }
      }

      // 🎟️ TITLE (NEON WHITE)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(24)
      doc.setTextColor(255, 255, 255)
      doc.text(ticket.eventTitle, cardX + 10, y)

      y += 8

      // TYPE CHIP
      doc.setFillColor(255, 0, 120)
      doc.roundedRect(cardX + 10, y, 28, 7, 3, 3, 'F')

      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      doc.text(ticket.eventType, cardX + 24, y + 4.5, { align: 'center' })

      y += 14

      // 📅 DATE
      const formattedDate = ticket.showTime
        ? new Date(ticket.showTime).toLocaleString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
          })
        : '-'

      doc.setFontSize(11)
      doc.setTextColor(200, 200, 255)
      doc.text(`📅 ${formattedDate}`, cardX + 10, y)

      y += 8

      // 📍 VENUE
      doc.text(
        `📍 ${ticket.theaterName} • Screen ${ticket.screenNumber}`,
        cardX + 10,
        y
      )

      y += 12

      // 🎫 SEATS (GLASS BOX)
      doc.setFillColor(255, 255, 255)
      doc.setGState(doc.GState({ opacity: 0.06 }))
      doc.roundedRect(cardX + 10, y, cardW - 20, 25, 4, 4, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

      const grouped: any = {}
      ticket.seats.forEach((s: any) => {
        const cat = s.category || 'Other'
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(s.seat_number)
      })

      let seatY = y + 7

      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text('Seats', cardX + 15, seatY)

      seatY += 6

      Object.entries(grouped).forEach(([cat, seats]: any) => {
        doc.setFontSize(9)
        doc.setTextColor(180, 180, 255)
        doc.text(`${cat}: ${seats.join(', ')}`, cardX + 15, seatY)
        seatY += 5
      })

      y += 32

      // 💰 PAYMENT CARD
      doc.setFillColor(255, 0, 120)
      doc.setGState(doc.GState({ opacity: 0.15 }))
      doc.roundedRect(cardX + 10, y, cardW - 20, 22, 4, 4, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

      doc.setFontSize(12)
      doc.setTextColor(255, 255, 255)
      doc.text(
        `₹${Number(ticket.totalAmount).toFixed(2)}`,
        cardX + 15,
        y + 8
      )

      doc.setFontSize(9)
      doc.text(
        `Txn: ${ticket.transactionId || '-'}`,
        cardX + 15,
        y + 16
      )

      y += 30

      // 🟢 STATUS CHIP
      const status =
        ticket.status === 'Booked' ? 'CONFIRMED' : ticket.status

      doc.setFillColor(34, 197, 94)
      doc.roundedRect(cardX + 10, y, 40, 9, 3, 3, 'F')

      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text(status, cardX + 30, y + 6, { align: 'center' })

      y += 18

      // 🔳 QR (CENTER FOCUS)
      const qrSize = 55
      const qrX = W / 2 - qrSize / 2

      doc.setFillColor(255, 255, 255)
      doc.roundedRect(qrX - 6, y - 6, qrSize + 12, qrSize + 12, 5, 5, 'F')

      if (ticket.qrBase64) {
        const raw = ticket.qrBase64.replace(
          /^data:image\/png;base64,/,
          ''
        )
        doc.addImage(raw, 'PNG', qrX, y, qrSize, qrSize)
      }

      y += qrSize + 8

      doc.setFontSize(10)
      doc.setTextColor(180, 180, 200)
      doc.text('Scan for Entry', W / 2, y, { align: 'center' })

      y += 8

      if (ticket.bookingTime) {
        const bt = new Date(ticket.bookingTime).toLocaleString('en-IN')
        doc.setFontSize(8)
        doc.text(`Booked: ${bt}`, W / 2, y, { align: 'center' })
      }

      // 🔗 FOOTER (CLICKABLE)
      doc.setTextColor(120, 180, 255)
      doc.setFontSize(9)
      doc.textWithLink(
        'ticketflix-ten.vercel.app',
        W / 2,
        H - 10,
        {
          url: 'https://ticketflix-ten.vercel.app',
          align: 'center',
        }
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
      className="flex items-center gap-1.5 px-3 py-1.5 border border-pink-500/40 text-pink-400 rounded-lg hover:bg-pink-500/10 transition text-xs font-medium disabled:opacity-50"
    >
      <Download size={13} />
      {generating ? 'Generating…' : 'Download Ticket'}
    </motion.button>
  )
}
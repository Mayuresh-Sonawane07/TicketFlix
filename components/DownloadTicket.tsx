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

      // 🌈 BACKGROUND
      doc.setFillColor(10, 5, 30)
      doc.rect(0, 0, W, H, 'F')

      // 🔥 HEADER STRIP
      doc.setFillColor(90, 0, 150)
      doc.setGState(doc.GState({ opacity: 0.4 }))
      doc.rect(0, 0, W, 90, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

      const cardX = 10
      let y = 20

      // 🎟️ TITLE
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(255, 255, 255)

      const titleLines = doc.splitTextToSize(ticket.eventTitle, W - 40)
      doc.text(titleLines, cardX, y)
      y += titleLines.length * 7

      y += 4

      // 🎬 TYPE BADGE
      doc.setFillColor(255, 0, 120)
      doc.roundedRect(cardX, y, 28, 8, 3, 3, 'F')

      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text(ticket.eventType, cardX + 14, y + 5.5, { align: 'center' })

      y += 16

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
      doc.text(`Date: ${formattedDate}`, cardX, y)

      y += 8

      // 📍 VENUE
      doc.text(
        `Venue: ${ticket.theaterName} - Screen ${ticket.screenNumber}`,
        cardX,
        y
      )

      y += 14

      // 🎫 SEATS CARD
      const grouped: any = {}
      ticket.seats.forEach((s: any) => {
        const cat = s.category || 'Other'
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(s.seat_number)
      })

      const seatBoxHeight = 12 + Object.keys(grouped).length * 6

      doc.setFillColor(255, 255, 255)
      doc.setGState(doc.GState({ opacity: 0.06 }))
      doc.roundedRect(cardX, y, W - 20, seatBoxHeight, 4, 4, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

      let seatY = y + 7

      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text('Seats', cardX + 5, seatY)

      seatY += 6

      Object.entries(grouped).forEach(([cat, seats]: any) => {
        doc.setFontSize(9)
        doc.setTextColor(180, 180, 255)
        doc.text(`${cat}: ${seats.join(', ')}`, cardX + 5, seatY)
        seatY += 5
      })

      y += seatBoxHeight + 10

      // 💰 PAYMENT CARD
      const paymentHeight = 24

      doc.setFillColor(255, 0, 120)
      doc.setGState(doc.GState({ opacity: 0.15 }))
      doc.roundedRect(cardX, y, W - 20, paymentHeight, 5, 5, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

      const amount = `Rs. ${Number(ticket.totalAmount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
      })}`

      doc.setFontSize(13)
      doc.setTextColor(255, 255, 255)
      doc.text(amount, cardX + 5, y + 9)

      doc.setFontSize(9)
      doc.text(`Txn: ${ticket.transactionId || '-'}`, cardX + 5, y + 18)

      y += paymentHeight + 12

      // 🟢 STATUS
      const status =
        ticket.status === 'Booked' ? 'CONFIRMED' : ticket.status

      doc.setFillColor(34, 197, 94)
      doc.roundedRect(cardX, y, 45, 10, 4, 4, 'F')

      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255)
      doc.text(status, cardX + 22.5, y + 6.5, { align: 'center' })

      y += 25

      // 🔳 PREMIUM QR CARD
      const qrSize = 60
      const qrX = W / 2 - qrSize / 2

      // shadow
      doc.setFillColor(0, 0, 0)
      doc.setGState(doc.GState({ opacity: 0.25 }))
      doc.roundedRect(qrX - 3, y - 2, qrSize + 6, qrSize + 6, 6, 6, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

      // white card
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(qrX - 6, y - 6, qrSize + 12, qrSize + 12, 6, 6, 'F')

      // glow border
      doc.setDrawColor(120, 180, 255)
      doc.setLineWidth(0.6)
      doc.roundedRect(qrX - 6, y - 6, qrSize + 12, qrSize + 12, 6, 6)

      if (ticket.qrBase64) {
        const raw = ticket.qrBase64.replace(
          /^data:image\/png;base64,/,
          ''
        )
        doc.addImage(raw, 'PNG', qrX, y, qrSize, qrSize)
      }

      // 🔻 FOOTER
      const footerY = H - 12

      doc.setFontSize(9)
      doc.setTextColor(180, 180, 200)
      doc.text('Scan for Entry', W / 2, footerY - 10, { align: 'center' })

      if (ticket.bookingTime) {
        const bt = new Date(ticket.bookingTime).toLocaleString('en-IN')
        doc.setFontSize(8)
        doc.text(`Booked: ${bt}`, W / 2, footerY - 5, { align: 'center' })
      }

      doc.setTextColor(120, 180, 255)
      doc.textWithLink(
        'ticketflix-ten.vercel.app',
        W / 2,
        footerY,
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
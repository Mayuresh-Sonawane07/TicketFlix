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

      // 🌈 Background
      doc.setFillColor(15, 10, 35)
      doc.rect(0, 0, W, H, 'F')

      doc.setFillColor(60, 0, 120)
      doc.setGState(doc.GState({ opacity: 0.4 }))
      doc.rect(0, 0, W, 120, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

      // 💎 Card
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

      // 🎬 Poster (fixed scaling + centered)
      if (ticket.posterUrl) {
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.src = ticket.posterUrl

          await new Promise((res) => (img.onload = res))

          const imgProps = doc.getImageProperties(img)
          const ratio = imgProps.width / imgProps.height

          const imgHeight = 70
          const imgWidth = imgHeight * ratio
          const imgX = cardX + (cardW - imgWidth) / 2

          doc.addImage(img, 'JPEG', imgX, y, imgWidth, imgHeight)

          // overlay
          doc.setFillColor(0, 0, 0)
          doc.setGState(doc.GState({ opacity: 0.5 }))
          doc.rect(cardX, y + 45, cardW, 25, 'F')
          doc.setGState(doc.GState({ opacity: 1 }))

          y += imgHeight + 10
        } catch {
          y += 10
        }
      }

      // 🎟️ Title
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(255, 255, 255)

      const titleLines = doc.splitTextToSize(ticket.eventTitle, cardW - 20)
      doc.text(titleLines, cardX + 10, y)
      y += titleLines.length * 6 + 6

      // Event type
      doc.setFillColor(255, 0, 120)
      doc.roundedRect(cardX + 10, y, 28, 7, 3, 3, 'F')

      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      doc.text(ticket.eventType, cardX + 24, y + 4.5, { align: 'center' })

      y += 14

      // 📅 Date
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
      doc.text(`Date: ${formattedDate}`, cardX + 10, y)

      y += 8

      // 📍 Venue
      doc.text(
        `Venue: ${ticket.theaterName} - Screen ${ticket.screenNumber}`,
        cardX + 10,
        y
      )

      y += 12

      // 🎫 Seats
      const grouped: any = {}
      ticket.seats.forEach((s: any) => {
        const cat = s.category || 'Other'
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(s.seat_number)
      })

      const seatBoxHeight = 12 + Object.keys(grouped).length * 6

      doc.setFillColor(255, 255, 255)
      doc.setGState(doc.GState({ opacity: 0.06 }))
      doc.roundedRect(cardX + 10, y, cardW - 20, seatBoxHeight, 4, 4, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

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

      y += seatBoxHeight + 8

      // 💰 Payment
      const paymentHeight = 22

      doc.setFillColor(255, 0, 120)
      doc.setGState(doc.GState({ opacity: 0.15 }))
      doc.roundedRect(cardX + 10, y, cardW - 20, paymentHeight, 4, 4, 'F')
      doc.setGState(doc.GState({ opacity: 1 }))

      const amount = `Rs. ${Number(ticket.totalAmount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
      })}`

      doc.setFontSize(12)
      doc.setTextColor(255, 255, 255)
      doc.text(amount, cardX + 15, y + 8)

      doc.setFontSize(9)
      doc.text(
        `Txn: ${ticket.transactionId || '-'}`,
        cardX + 15,
        y + 16
      )

      y += paymentHeight + 10

      // 🟢 Status
      const status =
        ticket.status === 'Booked' ? 'CONFIRMED' : ticket.status

      doc.setFillColor(34, 197, 94)
      doc.roundedRect(cardX + 10, y, 40, 9, 3, 3, 'F')

      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text(status, cardX + 30, y + 6, { align: 'center' })

      y += 20

      // 🔳 QR
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

      // 🔻 Footer (fixed)
      const footerY = H - 15

      doc.setFontSize(10)
      doc.setTextColor(180, 180, 200)
      doc.text('Scan for Entry', W / 2, footerY - 8, { align: 'center' })

      if (ticket.bookingTime) {
        const bt = new Date(ticket.bookingTime).toLocaleString('en-IN')
        doc.setFontSize(8)
        doc.text(`Booked: ${bt}`, W / 2, footerY - 3, { align: 'center' })
      }

      doc.setTextColor(120, 180, 255)
      doc.textWithLink(
        'ticketflix-ten.vercel.app',
        W / 2,
        footerY + 3,
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
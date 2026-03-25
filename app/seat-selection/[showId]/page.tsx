'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient, seatAPI, Seat, Show } from '@/lib/api'
import { ArrowLeft, Ticket, Timer } from 'lucide-react'

const SEAT_STYLES = {
  Silver: {
    available: 'border-slate-500 text-slate-300 hover:bg-slate-500/20 hover:border-slate-400',
    selected: 'bg-slate-500 text-white border-slate-500 shadow-lg shadow-slate-500/30',
    label: 'text-slate-400',
    badge: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
  },
  Gold: {
    available: 'border-yellow-500/70 text-yellow-400 hover:bg-yellow-500/15 hover:border-yellow-400',
    selected: 'bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/30',
    label: 'text-yellow-500',
    badge: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
  },
  Platinum: {
    available: 'border-violet-500/70 text-violet-400 hover:bg-violet-500/15 hover:border-violet-400',
    selected: 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/30',
    label: 'text-violet-400',
    badge: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
  },
}

interface ScreenPricing { silver: number; gold: number; platinum: number }
interface SeatWithStatus extends Seat { is_booked: boolean }

function splitIntoSections(seats: SeatWithStatus[], totalPerRow: number) {
  const leftCount = Math.floor(totalPerRow * 0.2)
  const rightCount = Math.floor(totalPerRow * 0.2)
  const centerCount = totalPerRow - leftCount - rightCount
  const rows: { left: SeatWithStatus[]; center: SeatWithStatus[]; right: SeatWithStatus[] }[] = []
  let i = 0
  while (i < seats.length) {
    const left = seats.slice(i, i + leftCount)
    const center = seats.slice(i + leftCount, i + leftCount + centerCount)
    const right = seats.slice(i + leftCount + centerCount, i + totalPerRow)
    if (left.length || center.length || right.length) rows.push({ left, center, right })
    i += totalPerRow
  }
  return rows
}

function SeatButton({
  seat,
  selected,
  styles,
  onToggle,
}: {
  seat: SeatWithStatus
  selected: boolean
  styles: typeof SEAT_STYLES[keyof typeof SEAT_STYLES]
  onToggle: (id: number) => void
}) {
  return (
    <motion.button
      key={seat.id}
      whileHover={{ scale: seat.is_booked ? 1 : 1.08 }}
      whileTap={{ scale: seat.is_booked ? 1 : 0.92 }}
      onClick={() => onToggle(seat.id)}
      disabled={seat.is_booked}
      title={seat.is_booked ? 'Already booked' : seat.seat_number}
      className={`
        w-9 h-9 rounded-lg border-2 text-[10px] font-bold transition-all duration-150 shrink-0
        ${seat.is_booked
          ? 'bg-white/[0.03] border-white/[0.08] text-white/15 cursor-not-allowed'
          : selected
          ? styles.selected
          : styles.available
        }
      `}
    >
      {seat.is_booked
        ? <span className="text-white/20 text-sm leading-none">×</span>
        : seat.seat_number.replace(/[A-Za-z]+/, '')
      }
    </motion.button>
  )
}

export default function SeatSelectionPage() {
  const { showId } = useParams()
  const router = useRouter()
  const [show, setShow] = useState<Show | null>(null)
  const [seats, setSeats] = useState<SeatWithStatus[]>([])
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [pricing, setPricing] = useState<ScreenPricing>({ silver: 0, gold: 0, platinum: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [timerExpired, setTimerExpired] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) { router.push('/login'); return }
    const fetchData = async () => {
      try {
        const [showRes, seatsRes] = await Promise.all([
          apiClient.get<any>(`/theaters/shows/${showId}/`),
          seatAPI.getAvailable(Number(showId)),
        ])
        setShow(showRes.data)
        if (showRes.data.screen_pricing) setPricing(showRes.data.screen_pricing)
        setSeats(seatsRes.data)
      } catch {
        setError('Failed to load show details')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [showId])

  useEffect(() => {
    if (selectedSeats.length === 1 && timeLeft === null) setTimeLeft(300)
  }, [selectedSeats])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) {
      setTimerExpired(true)
      setSelectedSeats([])
      setTimeLeft(null)
      return
    }
    const t = setTimeout(() => setTimeLeft(x => (x ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const toggleSeat = (seatId: number) => {
    const seat = seats.find(s => s.id === seatId)
    if (!seat || seat.is_booked) return
    setError('')
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
    )
  }

  const getPriceForCategory = (category: string) =>
    pricing[category.toLowerCase() as keyof ScreenPricing] || 0

  const getTotalAmount = () =>
    selectedSeats.reduce((total, seatId) => {
      const seat = seats.find(s => s.id === seatId)
      return seat ? total + getPriceForCategory(seat.category) : total
    }, 0)

  const getSelectedByCategory = () => {
    const result: Record<string, { count: number; price: number }> = {}
    selectedSeats.forEach(seatId => {
      const seat = seats.find(s => s.id === seatId)
      if (!seat) return
      if (!result[seat.category]) result[seat.category] = { count: 0, price: getPriceForCategory(seat.category) }
      result[seat.category].count++
    })
    return result
  }

  const handleBooking = () => {
    if (selectedSeats.length === 0) { setError('Please select at least one seat'); return }
    const title = (show as any)?.event_details?.title || 'Event'
    const venue = (show as any)?.theater_name
      ? `${(show as any).theater_name} · Screen ${(show as any).screen_number}`
      : 'Venue'
    const time = show?.show_time
      ? new Date(show.show_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : ''
    const params = new URLSearchParams({
      showId: showId as string,
      seats: selectedSeats.join(','),
      title,
      time,
      venue,
    })
    router.push(`/checkout?${params.toString()}`)
  }

  const groupedSeats = seats.reduce((acc, seat) => {
    if (!acc[seat.category]) acc[seat.category] = []
    acc[seat.category].push(seat)
    return acc
  }, {} as Record<string, SeatWithStatus[]>)

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading seats...</p>
      </div>
    </div>
  )

  const selectedBreakdown = getSelectedByCategory()
  const totalAmount = getTotalAmount()

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="mt-1 text-gray-500 hover:text-white transition p-1 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              {(show as any)?.event_details?.title || 'Select Seats'}
            </h1>
            {show && (
              <p className="text-gray-500 text-sm mt-0.5">
                {(show as any).theater_name}
                {(show as any).screen_number && ` · Screen ${(show as any).screen_number}`}
                {' · '}
                {new Date(show.show_time).toLocaleString('en-IN', {
                  dateStyle: 'medium', timeStyle: 'short'
                })}
              </p>
            )}
          </div>
        </div>

        {/* Screen indicator */}
        <div className="mb-10 text-center">
          <div className="relative mx-auto w-2/3 h-1.5 rounded-full overflow-hidden bg-gradient-to-r from-transparent via-red-600/60 to-transparent mb-3">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/40 to-transparent animate-pulse" />
          </div>
          <p className="text-gray-600 text-[10px] tracking-[0.2em] uppercase font-medium">Screen this side</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-600/10 border border-red-600/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Tier sections */}
        {['Silver', 'Gold', 'Platinum'].map(category => {
          const categorySeats = groupedSeats[category]
          if (!categorySeats || categorySeats.length === 0) return null

          const styles = SEAT_STYLES[category as keyof typeof SEAT_STYLES]
          const availableCount = categorySeats.filter(s => !s.is_booked).length

          // Dynamic seats per row based on tier size
          const SEATS_PER_ROW = categorySeats.length > 60 ? 13 : categorySeats.length > 30 ? 11 : 9
          const sections = splitIntoSections(categorySeats, SEATS_PER_ROW)
          const lastRowIndex = sections.length - 1

          return (
            <div key={category} className="mb-12">

              {/* Tier header */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`px-3 py-1 rounded-md border text-xs font-semibold tracking-wide ${styles.badge}`}>
                  {category}
                </div>
                <span className="text-gray-400 text-sm">₹{getPriceForCategory(category)} / seat</span>
                <span className="text-gray-600 text-xs ml-auto">{availableCount} available</span>
              </div>

              {/* Seat rows */}
              <div className="flex flex-col gap-2">
                {sections.map((row, rowIndex) => {
                  const isLastRow = rowIndex === lastRowIndex

                  return (
                    <div key={rowIndex} className="flex items-center">

                      {/* Row letter */}
                      <span className={`text-[10px] font-mono w-5 mr-2 text-right shrink-0 ${styles.label} opacity-40`}>
                        {String.fromCharCode(65 + rowIndex)}
                      </span>

                      {/* Left block */}
                      {row.left.length > 0 && (
                        <div className="flex gap-1.5">
                          {row.left.map(seat => (
                            <SeatButton
                              key={seat.id}
                              seat={seat}
                              selected={selectedSeats.includes(seat.id)}
                              styles={styles}
                              onToggle={toggleSeat}
                            />
                          ))}
                        </div>
                      )}

                      {/* Left aisle — hidden on last row */}
                      {!isLastRow && row.left.length > 0 && (
                        <div className="w-7 shrink-0 flex items-center justify-center">
                          <div className="w-px h-4 bg-white/[0.06]" />
                        </div>
                      )}
                      {isLastRow && row.left.length > 0 && <div className="w-1.5 shrink-0" />}

                      {/* Center block */}
                      {row.center.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {row.center.map(seat => (
                            <SeatButton
                              key={seat.id}
                              seat={seat}
                              selected={selectedSeats.includes(seat.id)}
                              styles={styles}
                              onToggle={toggleSeat}
                            />
                          ))}
                        </div>
                      )}

                      {/* Right aisle — hidden on last row */}
                      {!isLastRow && row.right.length > 0 && (
                        <div className="w-7 shrink-0 flex items-center justify-center">
                          <div className="w-px h-4 bg-white/[0.06]" />
                        </div>
                      )}
                      {isLastRow && row.right.length > 0 && <div className="w-1.5 shrink-0" />}

                      {/* Right block */}
                      {row.right.length > 0 && (
                        <div className="flex gap-1.5">
                          {row.right.map(seat => (
                            <SeatButton
                              key={seat.id}
                              seat={seat}
                              selected={selectedSeats.includes(seat.id)}
                              styles={styles}
                              onToggle={toggleSeat}
                            />
                          ))}
                        </div>
                      )}

                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {seats.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-gray-600">No seats available for this show</p>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-5 mt-4 flex-wrap">
          {[
            { label: 'Available', cls: 'border-2 border-gray-600' },
            { label: 'Selected', cls: 'bg-white/70' },
            { label: 'Booked', cls: 'bg-white/5 border border-white/10' },
          ].map(({ label, cls }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-md ${cls}`} />
              <span className="text-gray-600 text-xs">{label}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Booking bar */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="bg-[#111111]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-4">
              <div className="max-w-5xl mx-auto">

                {/* Timer */}
                {timeLeft !== null && (
                  <div className={`flex items-center gap-2 text-xs font-medium mb-3 ${
                    timeLeft <= 60 ? 'text-red-400' : 'text-yellow-500/80'
                  }`}>
                    <Timer size={12} />
                    <span>{timeLeft <= 60 ? '⚠ Hurry! ' : ''}Expires in {formatTime(timeLeft)}</span>
                    <div className="flex-1 h-0.5 bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          timeLeft <= 60 ? 'bg-red-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${(timeLeft / 300) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-1">
                      {Object.entries(selectedBreakdown).map(([cat, { count, price }]) => (
                        <span key={cat} className="text-xs text-gray-500">
                          {count}× {cat} <span className="text-gray-600">@ ₹{price}</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">₹{totalAmount}</span>
                      <span className="text-xs text-gray-600">+ convenience fee</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBooking}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shrink-0 text-sm"
                  >
                    <Ticket size={16} />
                    Proceed · {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}
                  </motion.button>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer expired modal */}
      <AnimatePresence>
        {timerExpired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-2xl p-8 text-center max-w-sm w-full"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Timer size={24} className="text-red-400" />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">Selection Expired</h2>
              <p className="text-gray-500 text-sm mb-6">
                Your 5-minute seat hold has ended. Please select your seats again.
              </p>
              <button
                onClick={() => { setTimerExpired(false); setTimeLeft(null); setSelectedSeats([]) }}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-colors text-sm"
              >
                Select again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
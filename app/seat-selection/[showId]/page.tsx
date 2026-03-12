'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { apiClient, seatAPI, Seat, Show } from '@/lib/api'
import { ArrowLeft, Ticket, Timer } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  Silver: 'border-gray-400 text-gray-300 hover:bg-gray-400/20',
  Gold: 'border-yellow-500 text-yellow-400 hover:bg-yellow-500/20',
  Platinum: 'border-purple-500 text-purple-400 hover:bg-purple-500/20',
}

const CATEGORY_SELECTED: Record<string, string> = {
  Silver: 'bg-gray-400 text-black border-gray-400',
  Gold: 'bg-yellow-500 text-black border-yellow-500',
  Platinum: 'bg-purple-500 text-white border-purple-500',
}

interface ScreenPricing {
  silver: number
  gold: number
  platinum: number
}

interface SeatWithStatus extends Seat {
  is_booked: boolean
}

export default function SeatSelectionPage() {
  const { showId } = useParams()
  const router = useRouter()
  const [show, setShow] = useState<Show | null>(null)
  const [seats, setSeats] = useState<SeatWithStatus[]>([])
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [pricing, setPricing] = useState<ScreenPricing>({ silver: 0, gold: 0, platinum: 0 })
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')

  // Timer state
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
        if (showRes.data.screen_pricing) {
          setPricing(showRes.data.screen_pricing)
        }
        setSeats(seatsRes.data)
      } catch {
        setError('Failed to load show details')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [showId])

  // Start 5 min timer when first seat is selected
  useEffect(() => {
    if (selectedSeats.length === 1 && timeLeft === null) {
      setTimeLeft(300)
    }
  }, [selectedSeats])

  // Countdown ticker
  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) {
      setTimerExpired(true)
      setSelectedSeats([])
      setTimeLeft(null)
      return
    }
    const timer = setTimeout(() => setTimeLeft(t => (t ?? 1) - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const toggleSeat = (seatId: number) => {
    const seat = seats.find(s => s.id === seatId)
    if (!seat || seat.is_booked) return
    setSelectedSeats(prev =>
      prev.includes(seatId)
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    )
  }

  const getPriceForCategory = (category: string): number => {
    const key = category.toLowerCase() as keyof ScreenPricing
    return pricing[key] || 0
  }

  const getTotalAmount = () => {
    return selectedSeats.reduce((total, seatId) => {
      const seat = seats.find(s => s.id === seatId)
      if (!seat) return total
      return total + getPriceForCategory(seat.category)
    }, 0)
  }

  const getSelectedByCategory = () => {
    const result: Record<string, { count: number; price: number }> = {}
    selectedSeats.forEach(seatId => {
      const seat = seats.find(s => s.id === seatId)
      if (!seat) return
      if (!result[seat.category]) {
        result[seat.category] = { count: 0, price: getPriceForCategory(seat.category) }
      }
      result[seat.category].count++
    })
    return result
  }

  const handleBooking = () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat')
      return
    }

    const params = new URLSearchParams({
      showId: showId as string,
      seats: selectedSeats.join(','),
      eventTitle: (show as any)?.event_details?.title || 'Event',
      theaterName: (show as any)?.theater_name || 'Venue',
      showTime: show?.show_time || '',
    })

    router.push(`/checkout?${params.toString()}`)
  }

  // Group seats by category
  const groupedSeats = seats.reduce((acc, seat) => {
    if (!acc[seat.category]) acc[seat.category] = []
    acc[seat.category].push(seat)
    return acc
  }, {} as Record<string, SeatWithStatus[]>)

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-gray-400">Loading seats...</p>
    </div>
  )

  if (error && !show) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-red-500">{error}</p>
    </div>
  )

  const selectedBreakdown = getSelectedByCategory()
  const totalAmount = getTotalAmount()

  return (
    <div className="min-h-screen bg-black pb-36">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Select Seats</h1>
            {show && (
              <p className="text-gray-400 text-sm mt-1">
                {(show as any).theater_name} • Screen {(show as any).screen_number} •{' '}
                {new Date(show.show_time).toLocaleString('en-IN', {
                  dateStyle: 'medium', timeStyle: 'short'
                })}
              </p>
            )}
          </div>
        </div>

        {/* Screen indicator */}
        <div className="mb-10">
          <div className="w-3/4 mx-auto h-2 bg-gradient-to-r from-transparent via-red-600 to-transparent rounded-full mb-2" />
          <p className="text-center text-gray-500 text-xs tracking-widest uppercase">Screen</p>
        </div>

        {/* Pricing Legend */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[
            { label: 'Silver', price: pricing.silver, color: 'border-gray-400 text-gray-300' },
            { label: 'Gold', price: pricing.gold, color: 'border-yellow-500 text-yellow-400' },
            { label: 'Platinum', price: pricing.platinum, color: 'border-purple-500 text-purple-400' },
          ].map(({ label, price, color }) => (
            <div key={label} className={`px-5 py-2 rounded-lg border-2 text-center ${color}`}>
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-sm font-bold">₹{price}</p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-600/10 border border-red-600/50 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Seats — Silver near screen, Gold middle, Platinum at back */}
        {['Silver', 'Gold', 'Platinum'].map(category => {
          const categorySeats = groupedSeats[category]
          if (!categorySeats || categorySeats.length === 0) return null
          const availableCount = categorySeats.filter(s => !s.is_booked).length
          return (
            <div key={category} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-white font-semibold text-lg">{category}</h3>
                <span className="text-gray-500 text-sm">₹{getPriceForCategory(category)} per seat</span>
                <span className="text-gray-600 text-xs">{availableCount} available</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categorySeats.map((seat) => {
                  const isSelected = selectedSeats.includes(seat.id)
                  const isBooked = seat.is_booked
                  return (
                    <motion.button
                      key={seat.id}
                      whileHover={{ scale: isBooked ? 1 : 1.05 }}
                      whileTap={{ scale: isBooked ? 1 : 0.95 }}
                      onClick={() => toggleSeat(seat.id)}
                      disabled={isBooked}
                      title={isBooked ? 'Already booked' : seat.seat_number}
                      className={`w-12 h-12 rounded-lg border-2 text-xs font-bold transition-all ${
                        isBooked
                          ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed'
                          : isSelected
                          ? CATEGORY_SELECTED[category]
                          : CATEGORY_COLORS[category]
                      }`}
                    >
                      {isBooked ? '✕' : seat.seat_number}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {seats.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400">No seats found for this show</p>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-gray-400 bg-transparent" />
            <span className="text-gray-400 text-xs">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span className="text-gray-400 text-xs">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
              <span className="text-gray-600 text-xs leading-none">✕</span>
            </div>
            <span className="text-gray-400 text-xs">Booked</span>
          </div>
        </div>

      </div>

      {/* Booking Summary Bar */}
      {selectedSeats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4"
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              {/* Timer */}
              {timeLeft !== null && (
                <div className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${
                  timeLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-yellow-400'
                }`}>
                  <Timer size={13} />
                  Complete payment in {formatTime(timeLeft)}
                </div>
              )}
              <p className="text-gray-400 text-sm mb-0.5">
                {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-3 text-xs text-gray-500 mb-1">
                {Object.entries(selectedBreakdown).map(([cat, { count, price }]) => (
                  <span key={cat}>{count}× {cat} (₹{price})</span>
                ))}
              </div>
              <p className="text-white font-bold text-xl">₹{totalAmount}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBooking}
              disabled={booking}
              className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
            >
              <Ticket size={18} />
              {booking ? 'Booking...' : 'Confirm Booking'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Timer Expired Modal */}
      {timerExpired && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-red-600/50 rounded-2xl p-8 text-center max-w-sm w-full"
          >
            <p className="text-5xl mb-4">⏰</p>
            <h2 className="text-white font-bold text-xl mb-2">Time Expired!</h2>
            <p className="text-gray-400 text-sm mb-6">
              Your seat selection has expired after 5 minutes. Please select your seats again.
            </p>
            <button
              onClick={() => {
                setTimerExpired(false)
                setTimeLeft(null)
                setSelectedSeats([])
              }}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
            >
              Select Again
            </button>
          </motion.div>
        </div>
      )}

    </div>
  )
}
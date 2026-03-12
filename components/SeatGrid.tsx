'use client'

import { Seat } from '@/lib/api'
import { motion } from 'framer-motion'

interface SeatGridProps {
  seats: Seat[]
  selectedSeats: number[]
  onSeatToggle: (seatId: number) => void
  disabled?: boolean
}

export default function SeatGrid({
  seats,
  selectedSeats,
  onSeatToggle,
  disabled = false,
}: SeatGridProps) {
  const SEATS_PER_ROW = 10
  const rows = Math.ceil(seats.length / SEATS_PER_ROW)

  const isSelected = (seatId: number) =>
    selectedSeats.includes(seatId)

  const getSeatColor = (seatId: number) => {
    if (isSelected(seatId)) {
      return 'bg-red-600 hover:bg-red-700'
    }
    return 'bg-green-600 hover:bg-green-700'
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Screen Indicator */}
      <div className="text-center">
        <p className="text-gray-400 text-sm mb-4">Screen this way →</p>
        <div className="w-full max-w-2xl h-1 bg-linear-to-r from-gray-600 via-yellow-500 to-gray-600 rounded-full" />
      </div>

      {/* Seat Grid */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, rowIdx) => {
          const seatsInRow = seats.slice(
            rowIdx * SEATS_PER_ROW,
            (rowIdx + 1) * SEATS_PER_ROW
          )

          return (
            <div key={rowIdx} className="flex items-center gap-2">
              {/* Row Label */}
              <span className="w-6 text-center font-bold text-gray-400 text-sm">
                {String.fromCharCode(65 + rowIdx)}
              </span>

              {/* Seats */}
              <div className="flex gap-2">
                {seatsInRow.map((seat) => (
                  <motion.button
                    key={seat.id}
                    type="button"
                    whileHover={!disabled ? { scale: 1.1 } : undefined}
                    whileTap={!disabled ? { scale: 0.95 } : undefined}
                    onClick={() => {
                      if (!disabled) {
                        onSeatToggle(seat.id)
                      }
                    }}
                    disabled={disabled}
                    className={`
                      w-8 h-8 rounded text-xs font-semibold transition-all
                      ${getSeatColor(seat.id)}
                      ${isSelected(seat.id) ? 'ring-2 ring-red-400' : ''}
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    title={`${seat.seat_number} - ${seat.category}`}
                  >
                    {seat.seat_number.split('-')[1]}
                  </motion.button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded" />
          <span className="text-gray-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded" />
          <span className="text-gray-300">Selected</span>
        </div>
      </div>
    </div>
  )
}
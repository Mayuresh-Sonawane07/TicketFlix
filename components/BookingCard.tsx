'use client'

import { Booking } from '@/lib/api'
import { motion } from 'framer-motion'
import { Trash2, CheckCircle, XCircle } from 'lucide-react'

interface BookingCardProps {
  booking: Booking
  onCancel: (bookingId: number) => void
  isLoading?: boolean
}

export default function BookingCard({
  booking,
  onCancel,
  isLoading = false,
}: BookingCardProps) {
  const bookingDate = new Date(booking.booking_time)
  const isCancelled = booking.status === 'cancelled'

  return (
    <motion.div
      whileHover={!isCancelled ? { y: -4 } : {}}
      className={`bg-gray-900 border rounded-lg p-6 ${
        isCancelled
          ? 'border-gray-700 opacity-60'
          : 'border-gray-800 hover:border-red-600/50'
      } transition-all duration-300`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-white">Booking #{booking.id}</h3>
            {isCancelled ? (
              <XCircle size={18} className="text-red-600" />
            ) : (
              <CheckCircle size={18} className="text-green-600" />
            )}
          </div>
          <p className="text-sm text-gray-400">
            {bookingDate.toLocaleDateString()} at {bookingDate.toLocaleTimeString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-red-600">₹{booking.total_amount}</p>
          <p className="text-xs text-gray-400">Total</p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-800/50 rounded">
        <p className="text-sm text-gray-300 mb-1">
          <span className="text-gray-400">Seats:</span> {booking.seats.length} seat(s)
        </p>
        <p className="text-sm text-gray-400">
          <span className="text-gray-500">Transaction ID:</span> {booking.transaction_id || 'N/A'}
        </p>
        <p className="text-sm text-gray-400">
          <span className="text-gray-500">Status:</span>{' '}
          <span className={isCancelled ? 'text-red-500' : 'text-green-500'}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </p>
      </div>

      {!isCancelled && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onCancel(booking.id)}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/30 text-red-600 rounded-lg hover:bg-red-600/20 hover:border-red-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={16} />
          {isLoading ? 'Cancelling...' : 'Cancel Booking'}
        </motion.button>
      )}
    </motion.div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Ticket, Clock, MapPin, User } from 'lucide-react'
import { apiClient } from '@/lib/api'

export default function VerifyTicketPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const bookingId = params.id
  const token = searchParams.get('token')

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!bookingId || !token) {
      setError('Invalid QR code — missing booking ID or token.')
      setLoading(false)
      return
    }
    verify()
  }, [])

  const verify = async () => {
    try {
      const res = await apiClient.get(`/bookings/${bookingId}/verify/?token=${token}`)
      setResult(res.data)
    } catch (err: any) {
      const data = err.response?.data
      setResult(data || { valid: false, error: 'Verification failed.' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Verifying ticket...</p>
      </div>
    </div>
  )

  const isValid = result?.valid === true
  const isCancelled = result?.status === 'Cancelled'

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        {/* Status Card */}
        <div className={`rounded-2xl border p-6 text-center mb-4 ${
          isValid
            ? 'bg-green-600/10 border-green-600/50'
            : isCancelled
            ? 'bg-red-600/10 border-red-600/50'
            : 'bg-yellow-600/10 border-yellow-600/50'
        }`}>
          <div className="flex justify-center mb-4">
            {isValid
              ? <CheckCircle size={64} className="text-green-500" />
              : isCancelled
              ? <XCircle size={64} className="text-red-500" />
              : <AlertCircle size={64} className="text-yellow-500" />
            }
          </div>
          <h1 className={`text-2xl font-bold mb-1 ${
            isValid ? 'text-green-400' : isCancelled ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {isValid ? 'VALID TICKET' : isCancelled ? 'CANCELLED' : 'INVALID QR CODE'}
          </h1>
          <p className={`text-sm ${
            isValid ? 'text-green-600' : isCancelled ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {isValid
              ? 'Allow entry ✓'
              : isCancelled
              ? 'This booking was cancelled'
              : result?.error || 'This QR code is not valid'
            }
          </p>
        </div>

        {/* Booking Details */}
        {result && (isValid || isCancelled) && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            {/* TicketFlix header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <span className="text-red-500 font-bold text-lg">TicketFlix</span>
              <span className="text-gray-500 text-xs">Booking #{result.booking_id}</span>
            </div>

            {/* Event */}
            <div>
              <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded mb-2 inline-block">
                {result.event_type}
              </span>
              <h2 className="text-white font-bold text-xl">{result.event}</h2>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock size={16} className="text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-400 text-xs">Show Time</p>
                  <p className="text-white text-sm font-medium">
                    {new Date(result.show_time).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-400 text-xs">Venue</p>
                  <p className="text-white text-sm font-medium">{result.venue}, {result.city}</p>
                  <p className="text-gray-500 text-xs">Screen: {result.screen}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Ticket size={16} className="text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-400 text-xs">Seats</p>
                  <p className="text-white text-sm font-medium">{result.seats?.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User size={16} className="text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-400 text-xs">Customer</p>
                  <p className="text-white text-sm font-medium">{result.customer}</p>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="pt-3 border-t border-gray-800 flex justify-between items-center">
              <span className="text-gray-400 text-sm">Amount Paid</span>
              <span className="text-white font-bold">₹{result.amount_paid}</span>
            </div>
          </div>
        )}

        <p className="text-center text-gray-700 text-xs mt-4">TicketFlix Entry Verification System</p>
      </motion.div>
    </div>
  )
}
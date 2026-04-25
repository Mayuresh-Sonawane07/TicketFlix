'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Ticket, Clock, MapPin, User, IndianRupee, Film, Sparkles } from 'lucide-react'
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
    if (!bookingId || !token) { setError('Invalid QR code — missing booking ID or token.'); setLoading(false); return }
    verify()
  }, [])

  const verify = async () => {
    try {
      const res = await apiClient.get(`/bookings/${bookingId}/verify/?token=${token}`)
      setResult(res.data)
    } catch (err: any) {
      const data = err.response?.data
      setResult(data || { valid: false, error: 'Verification failed.' })
    } finally { setLoading(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600 text-sm">Verifying ticket...</p>
      </div>
    </div>
  )

  const isValid = result?.valid === true
  const isCancelled = result?.status === 'Cancelled'

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity }}
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[120px] ${isValid ? 'bg-emerald-900/15' : isCancelled ? 'bg-red-900/15' : 'bg-yellow-900/12'}`} />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-red-600 rounded-lg rotate-6" />
              <Film size={16} className="relative text-white" />
            </div>
            <span className="text-xl font-black text-white">Ticket<span className="text-red-500">Flix</span></span>
          </div>
        </div>

        {/* Status Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`relative rounded-2xl border p-6 text-center mb-4 overflow-hidden ${
            isValid ? 'bg-emerald-500/5 border-emerald-500/25' : isCancelled ? 'bg-red-500/5 border-red-500/25' : 'bg-yellow-500/5 border-yellow-500/25'
          }`}>
          {/* Glow */}
          <div className={`absolute inset-0 opacity-30 blur-2xl ${isValid ? 'bg-emerald-500/10' : isCancelled ? 'bg-red-500/10' : 'bg-yellow-500/10'}`} />
          <div className="relative">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="flex justify-center mb-4">
              {isValid
                ? <div className="w-20 h-20 rounded-full bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center"><CheckCircle size={42} className="text-emerald-400" /></div>
                : isCancelled
                ? <div className="w-20 h-20 rounded-full bg-red-500/12 border border-red-500/25 flex items-center justify-center"><XCircle size={42} className="text-red-400" /></div>
                : <div className="w-20 h-20 rounded-full bg-yellow-500/12 border border-yellow-500/25 flex items-center justify-center"><AlertCircle size={42} className="text-yellow-400" /></div>
              }
            </motion.div>
            <h1 className={`text-2xl font-black mb-1 tracking-tight ${isValid ? 'text-emerald-400' : isCancelled ? 'text-red-400' : 'text-yellow-400'}`}>
              {isValid ? 'VALID TICKET' : isCancelled ? 'CANCELLED' : 'INVALID QR CODE'}
            </h1>
            <p className={`text-sm ${isValid ? 'text-emerald-600' : isCancelled ? 'text-red-600' : 'text-yellow-600'}`}>
              {isValid ? 'Allow entry ✓' : isCancelled ? 'This booking was cancelled' : result?.error || 'This QR code is not valid'}
            </p>
          </div>
        </motion.div>

        {/* Booking Details */}
        {result && (isValid || isCancelled) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-red-500 font-black text-base">TicketFlix</span>
              <span className="text-gray-700 text-xs font-mono">#{result.booking_id}</span>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="px-2 py-0.5 bg-red-600/15 text-red-400 text-[10px] font-black rounded uppercase tracking-widest">{result.event_type}</span>
                <h2 className="text-white font-black text-xl mt-2 tracking-tight">{result.event}</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/4 flex items-center justify-center shrink-0"><Clock size={14} className="text-gray-600" /></div>
                  <div>
                    <p className="text-gray-600 text-[10px] uppercase tracking-widest">Show Time</p>
                    <p className="text-white text-sm font-semibold">{new Date(result.show_time).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/4 flex items-center justify-center shrink-0"><MapPin size={14} className="text-gray-600" /></div>
                  <div>
                    <p className="text-gray-600 text-[10px] uppercase tracking-widest">Venue</p>
                    <p className="text-white text-sm font-semibold">{result.venue}, {result.city}</p>
                    <p className="text-gray-700 text-xs">Screen: {result.screen}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/4 flex items-center justify-center shrink-0"><Ticket size={14} className="text-gray-600" /></div>
                  <div>
                    <p className="text-gray-600 text-[10px] uppercase tracking-widest">Seats</p>
                    <p className="text-white text-sm font-semibold">{result.seats?.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/4 flex items-center justify-center shrink-0"><User size={14} className="text-gray-600" /></div>
                  <div>
                    <p className="text-gray-600 text-[10px] uppercase tracking-widest">Customer</p>
                    <p className="text-white text-sm font-semibold">{result.customer}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                <span className="text-gray-600 text-xs uppercase tracking-widest">Amount Paid</span>
                <span className="text-white font-black text-lg flex items-center gap-0.5">
                  <IndianRupee size={14} />{result.total_amount}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <p className="text-center text-gray-800 text-xs mt-5">TicketFlix Entry Verification System</p>
      </motion.div>
    </div>
  )
}
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { paymentAPI } from '@/lib/api'
import { ArrowLeft, Ticket, Shield, CreditCard } from 'lucide-react'
import Script from 'next/script'

declare global {
  interface Window {
    Razorpay: any
  }
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const showId = Number(searchParams.get('showId'))
  const seats = searchParams.get('seats')?.split(',').map(Number) || []
  const showTime = searchParams.get('showTime') || ''
  const eventTitle = searchParams.get('eventTitle') || 'Event'
  const theaterName = searchParams.get('theaterName') || 'Venue'

  const [orderData, setOrderData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  useEffect(() => {
    if (!showId || seats.length === 0) {
      router.push('/')
      return
    }
    createOrder()
  }, [])

  const createOrder = async () => {
    try {
      const res = await paymentAPI.createOrder({ show: showId, seats })
      setOrderData(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create order.')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = () => {
    if (!orderData || !razorpayLoaded) return
    setPaying(true)
    setError('')

    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const options = {
      key: orderData.key_id,
      amount: orderData.amount * 100,
      currency: orderData.currency,
      name: 'TicketFlix',
      description: `${eventTitle} - ${seats.length} seat(s)`,
      order_id: orderData.order_id,
      prefill: {
        email: user.email || '',
        contact: user.phone_number || '',
      },
      theme: { color: '#dc2626' },
      modal: {
        ondismiss: () => setPaying(false),
      },
      handler: async (response: any) => {
        try {
          await paymentAPI.verify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            show: showId,
            seats: seats,
            total_amount: orderData.amount,
          })
          router.push('/bookings?success=true')
        } catch (err: any) {
          setError(err.response?.data?.error || 'Payment verification failed.')
          setPaying(false)
        }
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (response: any) => {
      setError(`Payment failed: ${response.error.description}`)
      setPaying(false)
    })
    rzp.open()
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-gray-400">Preparing checkout...</p>
    </div>
  )

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="min-h-screen bg-black">
        <div className="max-w-lg mx-auto px-4 py-12">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-white">Checkout</h1>
          </div>

          {/* Event Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
            <h2 className="text-white font-bold text-xl mb-1">{eventTitle}</h2>
            <p className="text-gray-400 text-sm">{theaterName}</p>
            <p className="text-gray-400 text-sm">
              {showTime ? new Date(showTime).toLocaleString('en-IN', {
                dateStyle: 'medium', timeStyle: 'short'
              }) : ''}
            </p>

            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Ticket size={16} className="text-red-500" />
                <span>{seats.length} seat(s) selected</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          {orderData && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
              <h3 className="text-white font-semibold mb-4">Price Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    Ticket × {orderData.num_seats} (₹{orderData.show_price} each)
                  </span>
                  <span className="text-white">₹{orderData.ticket_amount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    Convenience Fee (2.75%)
                  </span>
                  <span className="text-white">₹{orderData.convenience_fee}</span>
                </div>
                <div className="border-t border-gray-800 pt-3 flex justify-between font-bold">
                  <span className="text-white">Total Payable</span>
                  <span className="text-red-500 text-xl">₹{orderData.amount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Security Badge */}
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-6 justify-center">
            <Shield size={14} className="text-green-500" />
            <span>100% Secure Payment powered by Razorpay</span>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-600/10 border border-red-600/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Pay Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePayment}
            disabled={paying || !razorpayLoaded || !orderData}
            className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition text-lg flex items-center justify-center gap-3"
          >
            <CreditCard size={22} />
            {paying ? 'Processing...' : `Pay ₹${orderData?.amount || ''}`}
          </motion.button>

          <p className="text-center text-gray-600 text-xs mt-4">
            By proceeding, you agree to our Terms & Conditions
          </p>

        </div>
      </div>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        Loading...
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
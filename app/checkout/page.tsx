'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { paymentAPI } from '@/lib/api'
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
      setError('Failed to create order.')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = () => {
    if (!orderData || !razorpayLoaded) return

    setPaying(true)
    setError('')

    const options = {
      key: orderData.key_id,
      amount: orderData.amount * 100,
      currency: orderData.currency,
      name: 'TicketFlix',
      description: 'Booking Payment',
      order_id: orderData.order_id,

      handler: async (response: any) => {
        try {
          await paymentAPI.verify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          setTimeout(() => {
            router.push('/bookings?success=true')
          }, 1500)
        } catch (err: any) {
          setError('Payment verification failed.')
          setPaying(false)
        }
      },

      modal: {
        ondismiss: () => setPaying(false),
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (response: any) => {
      setError(response.error.description)
      setPaying(false)
    })
    rzp.open()
  }

  // ✅ Script is ALWAYS rendered, outside of any conditional return
  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
      />

      {/* ✅ Wrapper div with actual styles so content is visible */}
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card text-card-foreground rounded-2xl shadow-lg p-8 w-full max-w-md space-y-6">

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm">Preparing your order...</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">Order Summary</h1>
                <p className="text-muted-foreground text-sm">Review your booking before payment</p>
              </div>

              <div className="border rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seats</span>
                  <span className="font-medium">{seats.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold text-base">₹{orderData?.amount}</span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={handlePayment}
                // ✅ Also disabled while Razorpay script hasn't loaded yet
                disabled={paying || !razorpayLoaded || !orderData}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl 
                           hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paying
                  ? 'Processing...'
                  : !razorpayLoaded
                  ? 'Loading payment...'
                  : `Pay ₹${orderData?.amount}`}
              </button>
            </>
          )}

        </div>
      </div>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
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
          console.log("PAYMENT SUCCESS:", response)

          await paymentAPI.verify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })

          // Wait for webhook
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

  if (loading) return <div>Loading...</div>

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button onClick={handlePayment} disabled={paying}>
          {paying ? 'Processing...' : `Pay ₹${orderData?.amount}`}
        </button>
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
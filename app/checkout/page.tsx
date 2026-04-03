'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { paymentAPI } from '@/lib/api'

declare global {
  interface Window { Razorpay: any }
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const showId = Number(searchParams.get('showId'))
  const seats = searchParams.get('seats')?.split(',').map(Number) || []
  const showTitle = searchParams.get('title') || 'Your Event'
  const showTime = searchParams.get('time') || ''
  const showVenue = searchParams.get('venue') || ''

  interface OrderData {
    key_id: string; order_id: string; amount: number; currency: string;
    num_seats: number; ticket_amount: number; convenience_fee: number;
  }
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  useEffect(() => {
    if (window.Razorpay) { setRazorpayLoaded(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setRazorpayLoaded(true)
    script.onerror = () => setError('Failed to load payment SDK. Please refresh.')
    document.body.appendChild(script)
    return () => { if (document.body.contains(script)) document.body.removeChild(script) }
  }, [])

  useEffect(() => {
    if (!showId || seats.length === 0) { router.push('/'); return }
    createOrder()
  }, [])

  const createOrder = async () => {
    try {
      const res = await paymentAPI.createOrder({ show: showId, seats })
      setOrderData(res.data)
    } catch {
      setError('Failed to create order. Please go back and try again.')
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
      description: showTitle,
      order_id: orderData.order_id,
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          await paymentAPI.verify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          setTimeout(() => router.push('/bookings?success=true'), 1500)
        } catch {
          setError('Payment verification failed. Contact support if amount was deducted.')
          setPaying(false)
        }
      },
      modal: { ondismiss: () => setPaying(false) },
    }
    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (response: { error: { description: string } }) => {
      setError(response.error.description)
      setPaying(false)
    })
    rzp.open()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .checkout-wrap * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

        .checkout-wrap {
          min-height: 100vh;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          position: relative;
          overflow: hidden;
        }

        .checkout-wrap::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 70%);
          top: -200px; right: -200px;
          pointer-events: none;
        }

        .checkout-wrap::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%);
          bottom: -150px; left: -100px;
          pointer-events: none;
        }

        .checkout-card {
          background: #111111;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          width: 100%;
          max-width: 460px;
          overflow: hidden;
          position: relative;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .checkout-header {
          background: linear-gradient(135deg, #1a0a0a 0%, #1f1010 100%);
          border-bottom: 1px solid rgba(220,38,38,0.15);
          padding: 28px 28px 24px;
        }

        .checkout-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .checkout-brand-icon {
          width: 28px; height: 28px;
          background: #dc2626;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
        }

        .checkout-brand-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: #dc2626;
          letter-spacing: 0.02em;
        }

        .checkout-event-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 22px;
          color: #ffffff;
          line-height: 1.2;
          margin-bottom: 10px;
        }

        .checkout-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .checkout-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          font-weight: 400;
        }

        .checkout-meta-dot {
          width: 3px; height: 3px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
        }

        .checkout-body {
          padding: 24px 28px 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 10px;
        }

        .seats-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .seat-chip {
          background: rgba(220,38,38,0.1);
          border: 1px solid rgba(220,38,38,0.25);
          color: #f87171;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 6px;
          font-family: 'DM Sans', monospace;
        }

        .pricing-rows {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
        }

        .pricing-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .pricing-row:last-child { border-bottom: none; }

        .pricing-row.total {
          background: rgba(220,38,38,0.06);
          border-top: 1px solid rgba(220,38,38,0.15);
        }

        .pricing-label {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          font-weight: 400;
        }

        .pricing-value {
          font-size: 13px;
          color: rgba(255,255,255,0.85);
          font-weight: 500;
        }

        .pricing-row.total .pricing-label {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
        }

        .pricing-row.total .pricing-value {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          font-family: 'Syne', sans-serif;
        }

        .error-box {
          background: rgba(220,38,38,0.08);
          border: 1px solid rgba(220,38,38,0.25);
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: #fca5a5;
          line-height: 1.4;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .pay-btn {
          width: 100%;
          background: #dc2626;
          color: #ffffff;
          border: none;
          border-radius: 14px;
          padding: 16px 24px;
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .pay-btn:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(220,38,38,0.35);
        }

        .pay-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .pay-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .pay-btn-loading {
          background: rgba(220,38,38,0.4) !important;
        }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .secure-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          font-weight: 400;
        }

        /* Loading skeleton */
        .skeleton-wrap {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
        }

        .skeleton-spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(220,38,38,0.2);
          border-top-color: #dc2626;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 4px;
        }

        .skeleton-text {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          font-weight: 400;
        }
      `}</style>

      <div className="checkout-wrap">
        <div className="checkout-card">

          {loading ? (
            <div className="skeleton-wrap" style={{ minHeight: 280 }}>
              <div className="skeleton-spinner" />
              <p className="skeleton-text">Securing your seats...</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="checkout-header">
                <div className="checkout-brand">
                  <div className="checkout-brand-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" fill="white"/>
                    </svg>
                  </div>
                  <span className="checkout-brand-name">TicketFlix</span>
                </div>

                <h1 className="checkout-event-title">{showTitle}</h1>

                <div className="checkout-meta">
                  {showTime && (
                    <span className="checkout-meta-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      {showTime}
                    </span>
                  )}
                  {showTime && showVenue && <span className="checkout-meta-dot" />}
                  {showVenue && (
                    <span className="checkout-meta-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" fillOpacity="0.6"/>
                      </svg>
                      {showVenue}
                    </span>
                  )}
                  <span className="checkout-meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" fillOpacity="0.5"/>
                      <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" fillOpacity="0.5"/>
                      <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" fillOpacity="0.5"/>
                      <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" fillOpacity="0.5"/>
                    </svg>
                    {seats.length} seat{seats.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="checkout-body">

                {/* Seats */}
                <div>
                  <p className="section-label">Selected Seats</p>
                  <div className="seats-grid">
                    {seats.map(s => (
                      <span key={s} className="seat-chip">#{s}</span>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <p className="section-label">Price Breakdown</p>
                  <div className="pricing-rows">
                    <div className="pricing-row">
                      <span className="pricing-label">
                        Ticket × {orderData?.num_seats}
                      </span>
                      <span className="pricing-value">₹{orderData?.ticket_amount}</span>
                    </div>
                    <div className="pricing-row">
                      <span className="pricing-label">Convenience fee</span>
                      <span className="pricing-value">₹{orderData?.convenience_fee}</span>
                    </div>
                    <div className="pricing-row total">
                      <span className="pricing-label">Total Payable</span>
                      <span className="pricing-value">₹{orderData?.amount}</span>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="error-box">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{marginTop:1,flexShrink:0}}>
                      <circle cx="12" cy="12" r="9" stroke="#f87171" strokeWidth="1.5"/>
                      <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {error}
                  </div>
                )}

                {/* Pay Button */}
                <button
                  onClick={handlePayment}
                  disabled={paying || !razorpayLoaded || !orderData}
                  className={`pay-btn ${paying ? 'pay-btn-loading' : ''}`}
                >
                  {paying ? (
                    <><div className="spinner" /> Processing...</>
                  ) : !razorpayLoaded ? (
                    <><div className="spinner" /> Loading payment...</>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="1.5"/>
                        <path d="M2 10h20" stroke="white" strokeWidth="1.5"/>
                      </svg>
                      Pay ₹{orderData?.amount}
                    </>
                  )}
                </button>

                {/* Secure note */}
                <div className="secure-note">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z" fill="currentColor" fillOpacity="0.5"/>
                  </svg>
                  Secured by Razorpay · 256-bit SSL encryption
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:32,height:32,border:'3px solid rgba(220,38,38,0.2)',borderTopColor:'#dc2626',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
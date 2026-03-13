'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ScanLine, Camera, XCircle, Flashlight } from 'lucide-react'

export default function ScanTicketPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [cameraStarted, setCameraStarted] = useState(false)
  const intervalRef = useRef<any>(null)

  useEffect(() => {
    // Check if venue owner
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'VENUE_OWNER') { router.push('/'); return }

    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraStarted(true)
        startScanning()
      }
    } catch {
      setError('Camera access denied. Please allow camera permission and refresh.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(t => t.stop())
    }
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const startScanning = () => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx || video.readyState !== 4) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      try {
        // Use BarcodeDetector API if available
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
          const barcodes = await detector.detect(canvas)
          if (barcodes.length > 0) {
            const qrValue = barcodes[0].rawValue
            handleQRDetected(qrValue)
          }
        }
      } catch {}
    }, 500)
  }

  const handleQRDetected = (value: string) => {
    clearInterval(intervalRef.current)
    stopCamera()

    // Extract booking ID and token from URL
    try {
      const url = new URL(value)
      const pathParts = url.pathname.split('/')
      const bookingId = pathParts[pathParts.length - 1]
      const token = url.searchParams.get('token')
      if (bookingId && token) {
        router.push(`/verify/${bookingId}?token=${token}`)
      } else {
        setError('Invalid QR code format')
        startCamera()
      }
    } catch {
      setError('Could not read QR code')
      startCamera()
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-3">
          <ScanLine className="text-red-500" size={24} />
          <div>
            <h1 className="text-white font-bold text-lg">Scan Ticket</h1>
            <p className="text-gray-400 text-xs">Point camera at QR code</p>
          </div>
        </div>
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition">
          <XCircle size={24} />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          className="w-full max-w-lg object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay */}
        {cameraStarted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500 rounded-br-lg" />

              {/* Scanning line animation */}
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-red-500/70"
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute bottom-8 left-4 right-4 bg-red-600/20 border border-red-600/50 rounded-xl p-3 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* No camera support fallback */}
        {!cameraStarted && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Camera size={48} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Starting camera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom instructions */}
      <div className="p-6 border-t border-gray-800 text-center">
        <p className="text-gray-400 text-sm">Hold the QR code steady inside the frame</p>
        <p className="text-gray-600 text-xs mt-1">The ticket will be verified automatically</p>

        {/* Manual entry fallback */}
        <button
          onClick={() => {
            const id = prompt('Enter Booking ID:')
            const token = prompt('Enter Token:')
            if (id && token) router.push(`/verify/${id}?token=${token}`)
          }}
          className="mt-4 text-red-500 text-xs underline"
        >
          Enter manually instead
        </button>
      </div>
    </div>
  )
}
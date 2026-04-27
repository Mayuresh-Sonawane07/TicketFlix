'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { authAPI } from '@/lib/api'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Film, ArrowRight, Sparkles } from 'lucide-react'

declare global { interface Window { google: any } }

const FLOATING_ITEMS = ['🎬', '🎵', '⚽', '🎪', '🎭', '🍿', '🎤', '🏆']

function FloatingIcon({ emoji, x, y, delay, duration }: { emoji: string; x: number; y: number; delay: number; duration: number }) {
  return (
    <motion.div
      className="absolute text-2xl select-none pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 0.15, 0.08, 0.15, 0], scale: [0, 1, 0.8, 1, 0], y: [0, -40, -20, -60, -80] }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay: duration * 0.5, ease: 'easeInOut' }}
    >
      {emoji}
    </motion.div>
  )
}

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotX = useSpring(mouseY, { stiffness: 200, damping: 30 })
  const rotY = useSpring(mouseX, { stiffness: 200, damping: 30 })

  useEffect(() => {
    const saved = localStorage.getItem('rememberedEmail')
    if (saved) { setEmail(saved); setRememberMe(true) }
  }, [])

  const initializeGoogle = () => {
    const el = document.getElementById('google-btn')
    if (!window.google || !el) return false
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: handleGoogleResponse,
    })
    el.innerHTML = ''
    window.google.accounts.id.renderButton(el, {
      theme: 'filled_black',
      size: 'large',
      shape: 'pill',
      width: 350,
      text: 'continue_with',
    })
    return true
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (initializeGoogle()) clearInterval(interval)
    }, 300)
    return () => clearInterval(interval)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 8)
    mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * -8)
  }
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0) }

  const getErrorMessage = (err: any): string => {
    if (err?.response?.status === 401) return 'Incorrect email or password. Please try again.'
    if (err?.response?.status === 403) return err?.response?.data?.error || 'Access denied.'
    return err?.response?.data?.error || 'Login failed. Please try again.'
  }

  // Centralised post-login routing — unapproved venue owners always go to /pending-approval
  const handleLoginSuccess = (user: any) => {
    window.dispatchEvent(new Event('authChange'))
    if (user.role === 'Admin') {
      router.push('/admin-panel')
    } else if (user.role === 'VENUE_OWNER') {
      if (user.is_approved) router.push('/venue-dashboard')
      else router.push('/pending-approval')   // ← was /?notice=pending_approval
    } else {
      router.push('/')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      if (rememberMe) localStorage.setItem('rememberedEmail', email)
      else localStorage.removeItem('rememberedEmail')
      handleLoginSuccess(data.user)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleResponse = async (response: any) => {
    setError(null)
    setIsGoogleLoading(true)
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_token: response.credential }),
      })
      const data = await res.json()

      // Unapproved venue owner — backend issued no cookies, redirect to pending page
      if (res.status === 403 && data.error === 'pending_approval') {
        router.push('/pending-approval')
        return
      }

      if (!res.ok) {
        setError(data.error || data.detail || 'Google login failed.')
        return
      }

      handleLoginSuccess(data.user)
    } catch {
      setError('Google login failed. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const floatingData = FLOATING_ITEMS.map((e, i) => ({
    emoji: e, x: 5 + (i * 13) % 90, y: 10 + (i * 17) % 80,
    delay: i * 0.8, duration: 5 + (i % 3) * 2,
  }))

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />

      <div className="min-h-screen bg-[#070707] flex items-center justify-center px-4 relative overflow-hidden">

        {/* Background atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 15, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-red-900/15 blur-[100px]" />
          <motion.div animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity, delay: 3 }}
            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-orange-900/10 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          {floatingData.map((f, i) => <FloatingIcon key={i} {...f} />)}
        </div>

        <div className="w-full max-w-md relative z-10">

          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4 }}
                className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-red-600 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300" />
                <Film size={20} className="relative text-white" />
              </motion.div>
              <span className="text-2xl font-black text-white tracking-tight">Ticket<span className="text-red-500">Flix</span></span>
            </Link>
          </motion.div>

          {/* Card */}
          <motion.div
            ref={cardRef}
            style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d', perspective: 1000 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-600/10 via-transparent to-orange-600/5 blur-xl" />

            <div className="relative bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

              <div className="p-8">
                {/* Header */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-red-500" />
                    <span className="text-red-400 text-xs font-bold tracking-widest uppercase">Welcome back</span>
                  </div>
                  <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Sign In</h1>
                  <p className="text-gray-600 text-sm mt-1">Your tickets are waiting</p>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="mb-5 p-4 bg-red-500/8 border border-red-500/20 rounded-2xl flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Email</label>
                    <div className={`relative rounded-2xl border transition-all duration-200 ${focusedField === 'email' ? 'border-red-500/50 bg-white/4 shadow-lg shadow-red-500/10' : 'border-white/6 bg-white/3'}`}>
                      <Mail size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'email' ? 'text-red-400' : 'text-gray-600'}`} />
                      <input
                        type="email" value={email} onChange={e => { setEmail(e.target.value); setError(null) }}
                        onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                        placeholder="your@email.com" disabled={isLoading}
                        className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none"
                      />
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Password</label>
                    <div className={`relative rounded-2xl border transition-all duration-200 ${focusedField === 'password' ? 'border-red-500/50 bg-white/4 shadow-lg shadow-red-500/10' : 'border-white/6 bg-white/3'}`}>
                      <Lock size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'password' ? 'text-red-400' : 'text-gray-600'}`} />
                      <input
                        type={showPassword ? 'text' : 'password'} value={password}
                        onChange={e => { setPassword(e.target.value); setError(null) }}
                        onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                        placeholder="••••••••" disabled={isLoading}
                        className="w-full pl-11 pr-12 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Remember + Forgot */}
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                    className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-red-600 border-red-600' : 'border-white/20 group-hover:border-white/40'}`}
                        onClick={() => setRememberMe(!rememberMe)}>
                        {rememberMe && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <span className="text-gray-500 text-xs">Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-red-500 hover:text-red-400 text-xs font-semibold transition-colors">
                      Forgot password?
                    </Link>
                  </motion.div>

                  {/* Submit */}
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(220,38,38,0.3)' }}
                      whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading}
                      className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
                    >
                      {isLoading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <><span>Sign In</span><ArrowRight size={15} /></>
                      )}
                    </motion.button>
                  </motion.div>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-gray-700 text-[10px] font-medium uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* Google */}
                <div className="w-full flex justify-center bg-white/5 border border-white/10 rounded-2xl p-2 min-h-[50px] items-center relative">
                  <div id="google-btn" />
                  {isGoogleLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity }}
                        className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full mr-2" />
                      <span className="text-gray-400 text-sm">Signing in with Google...</span>
                    </div>
                  )}
                </div>

                {/* Register */}
                <p className="text-center text-gray-600 text-sm mt-6">
                  No account?{' '}
                  <Link href="/register" className="text-red-500 hover:text-red-400 font-bold transition-colors">Create one</Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
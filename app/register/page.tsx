'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authAPI, profileAPI } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Mail, Lock, Phone, User, Building2, Eye, EyeOff } from 'lucide-react'

type Role = 'Customer' | 'VENUE_OWNER'

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length === 0) return { label: '', color: '', width: '0%' }
  if (password.length < 6) return { label: 'Too short', color: 'bg-red-500', width: '25%' }
  if (password.length < 8) return { label: 'Weak', color: 'bg-orange-500', width: '50%' }
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
    return { label: 'Fair', color: 'bg-yellow-500', width: '75%' }
  return { label: 'Strong', color: 'bg-green-500', width: '100%' }
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    role: 'Customer' as Role,
  })
  const [otp, setOtp] = useState('')

  const passwordStrength = getPasswordStrength(form.password)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const getValidationError = (): string => {
    if (!form.name.trim()) return 'Full name is required.'
    if (!form.email.includes('@')) return 'Enter a valid email address.'
    if (form.phone_number.length !== 10 || !/^\d+$/.test(form.phone_number))
      return 'Enter a valid 10-digit phone number.'
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    if (!agreedToTerms) return 'Please agree to the Terms & Conditions.'
    return ''
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = getValidationError()
    if (validationError) { setError(validationError); return }
    setLoading(true)
    setError('')
    try {
      await authAPI.register({
        name: form.name,
        email: form.email,
        phone_number: form.phone_number,
        password: form.password,
        role: form.role,
      })
      setStep('otp')
      startResendCooldown()
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (data) {
        const messages = Object.values(data).flat()
        setError(messages.join(' '))
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const startResendCooldown = () => {
    setResendCooldown(30)
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleResendOTP = async () => {
    setResending(true)
    setError('')
    setSuccess('')
    try {
      await profileAPI.resendOTP(form.email)
      setSuccess('OTP resent successfully! Check your email.')
      startResendCooldown()
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to resend OTP.')
    } finally {
      setResending(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await authAPI.verifyOTP({ email: form.email, otp })
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed after registration'); return }
      window.dispatchEvent(new Event('authChange'))
      router.push(form.role === 'VENUE_OWNER' ? '/venue-dashboard' : '/')
    } catch (err: unknown) {
      const data = (err as any)?.response?.data
      setError(data?.non_field_errors?.[0] || data?.otp?.[0] || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }
      
      // Fallback: login separately to get tokens
      const { token: loginToken, refresh: loginRefresh, user: loginUser } = await authAPI.login(form.email, form.password)
      localStorage.setItem('authToken', loginToken)
      localStorage.setItem('refreshToken', loginRefresh)
      const safeLoginUser = { id: loginUser.id, first_name: loginUser.first_name, role: loginUser.role }
      localStorage.setItem('user', JSON.stringify(safeLoginUser))
      window.dispatchEvent(new Event('authChange'))
      router.push(form.role === 'VENUE_OWNER' ? '/venue-dashboard' : '/')
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { non_field_errors?: string[]; otp?: string[] } } })?.response?.data
      setError(
        data?.non_field_errors?.[0] ||
        data?.otp?.[0] ||
        'Invalid OTP. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="inline-block mb-4">
              <UserPlus className="text-red-600" size={40} />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {step === 'details' ? 'Create Account' : 'Verify Email'}
            </h1>
            <p className="text-gray-400 text-sm">
              {step === 'details' ? 'Join TicketFlix today' : `OTP sent to ${form.email}`}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-1.5 w-20 rounded-full bg-red-600" />
            <div className={`h-1.5 w-20 rounded-full transition-all duration-500 ${step === 'otp' ? 'bg-red-600' : 'bg-gray-700'}`} />
          </div>

          {/* Error / Success */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-4 bg-red-600/10 border border-red-600/50 rounded-lg"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-4 bg-green-600/10 border border-green-600/50 rounded-lg"
              >
                <p className="text-green-400 text-sm">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* Step 1 — Details */}
            {step === 'details' && (
              <motion.form
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                {/* Role Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Customer', 'VENUE_OWNER'] as Role[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setForm({ ...form, role })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 ${form.role === role
                            ? 'border-red-600 bg-red-600/10 text-white'
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                          }`}
                      >
                        {role === 'Customer' ? <User size={24} /> : <Building2 size={24} />}
                        <span className="text-sm font-medium">
                          {role === 'Customer' ? 'Customer' : 'Venue Owner'}
                        </span>
                        <span className="text-xs text-center opacity-70">
                          {role === 'Customer' ? 'Book tickets & events' : 'List & manage events'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                      name="name" type="text" required value={form.name}
                      onChange={handleChange} placeholder="John Doe" disabled={loading}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                      name="email" type="email" required value={form.email}
                      onChange={handleChange} placeholder="john@example.com" disabled={loading}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                  <div className="flex">
                    <span className="bg-gray-700 text-gray-300 px-3 py-2 rounded-l-lg border border-gray-700 border-r-0 text-sm flex items-center">+91</span>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        name="phone_number" type="tel" required maxLength={10}
                        value={form.phone_number} onChange={handleChange}
                        placeholder="9876543210" disabled={loading}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-r-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                      name="password" type={showPassword ? 'text' : 'password'} required
                      value={form.password} onChange={handleChange}
                      placeholder="Min. 6 characters" disabled={loading}
                      className="w-full pl-10 pr-12 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {form.password.length > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: passwordStrength.width }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{passwordStrength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                      name="confirmPassword" type={showConfirm ? 'text' : 'password'} required
                      value={form.confirmPassword} onChange={handleChange}
                      placeholder="Re-enter password" disabled={loading}
                      className={`w-full pl-10 pr-12 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 ${form.confirmPassword && form.password !== form.confirmPassword
                          ? 'border-red-500' : 'border-gray-700'
                        }`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">Passwords don't match</p>
                  )}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox" checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-red-600"
                  />
                  <span className="text-gray-400 text-sm">
                    I agree to the{' '}
                    <Link href="/terms" className="text-red-500 hover:text-red-400">Terms & Conditions</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-red-500 hover:text-red-400">Privacy Policy</Link>
                  </span>
                </label>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading}
                  className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 mt-2"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP →'}
                </motion.button>

                <p className="text-center text-gray-400 text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="text-red-600 hover:text-red-500 font-semibold">Login</Link>
                </p>
              </motion.form>
            )}

            {/* Step 2 — OTP */}
            {step === 'otp' && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                    Enter the 6-digit OTP sent to your email
                  </label>
                  <input
                    type="text" maxLength={6} value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                    placeholder="• • • • • •" disabled={loading}
                    className="w-full bg-gray-800 text-white text-center text-2xl tracking-[0.5em] border border-gray-700 rounded-lg px-4 py-4 focus:outline-none focus:border-red-600 transition"
                  />
                  <p className="text-center text-gray-500 text-xs mt-2">
                    OTP expires in 5 minutes. Check spam folder too.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading || otp.length !== 6}
                  className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Create Account'}
                </motion.button>

                {/* Resend OTP */}
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-2">Didn't receive the OTP?</p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resending || resendCooldown > 0}
                    className="text-red-500 hover:text-red-400 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {resending ? 'Resending...' :
                      resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => { setStep('details'); setOtp(''); setError(''); setSuccess('') }}
                  className="w-full text-gray-500 hover:text-gray-300 text-sm transition"
                >
                  ← Go back and edit details
                </button>
              </motion.form>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
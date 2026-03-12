'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { authAPI } from '@/lib/api'
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react'

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length === 0) return { label: '', color: '', width: '0%' }
  if (password.length < 6) return { label: 'Too short', color: 'bg-red-500', width: '25%' }
  if (password.length < 8) return { label: 'Weak', color: 'bg-orange-500', width: '50%' }
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
    return { label: 'Fair', color: 'bg-yellow-500', width: '75%' }
  return { label: 'Strong', color: 'bg-green-500', width: '100%' }
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const passwordStrength = getPasswordStrength(newPassword)

  const startCooldown = () => {
    setResendCooldown(30)
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authAPI.forgotPassword(email)
      setStep('otp')
      startCooldown()
    } catch (err: any) {
      const data = err.response?.data
      setError(
        data?.email?.[0] ||
        data?.non_field_errors?.[0] ||
        'Failed to send OTP. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    try {
      await authAPI.forgotPassword(email)
      startCooldown()
    } catch {
      setError('Failed to resend OTP.')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authAPI.resetPassword({ email, otp, new_password: newPassword })
      setStep('success')
    } catch (err: any) {
      const data = err.response?.data
      setError(
        data?.non_field_errors?.[0] ||
        data?.otp?.[0] ||
        'Invalid OTP or reset failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div whileHover={{ scale: 1.1 }} className="inline-block mb-4">
              <KeyRound className="text-red-600" size={40} />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {step === 'email' ? 'Forgot Password' :
                step === 'otp' ? 'Reset Password' : 'All Done!'}
            </h1>
            <p className="text-gray-400 text-sm">
              {step === 'email' ? "Enter your email and we'll send you an OTP" :
                step === 'otp' ? `Enter the OTP sent to ${email}` :
                  'Your password has been reset successfully'}
            </p>
          </div>

          {/* Step Indicator */}
          {step !== 'success' && (
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="h-1.5 w-20 rounded-full bg-red-600" />
              <div className={`h-1.5 w-20 rounded-full transition-all duration-500 ${step === 'otp' ? 'bg-red-600' : 'bg-gray-700'
                }`} />
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 bg-red-600/10 border border-red-600/50 rounded-lg"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* Step 1 — Email */}
            {step === 'email' && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendOTP}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      placeholder="your@email.com"
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading}
                  className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP →'}
                </motion.button>

                <div className="flex items-center justify-center">
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition"
                  >
                    <ArrowLeft size={14} />
                    Back to Login
                  </Link>
                </div>
              </motion.form>
            )}

            {/* Step 2 — OTP + New Password */}
            {step === 'otp' && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleResetPassword}
                className="space-y-4"
              >
                {/* OTP */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                    Enter 6-digit OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                    placeholder="• • • • • •"
                    disabled={loading}
                    className="w-full bg-gray-800 text-white text-center text-2xl tracking-[0.5em] border border-gray-700 rounded-lg px-4 py-4 focus:outline-none focus:border-red-600"
                  />
                  <div className="text-center mt-2">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className="text-red-500 hover:text-red-400 text-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                      placeholder="Min. 6 characters"
                      disabled={loading}
                      className="w-full pl-10 pr-12 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{passwordStrength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                      placeholder="Re-enter new password"
                      disabled={loading}
                      className={`w-full pl-10 pr-12 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 ${confirmPassword && newPassword !== confirmPassword
                          ? 'border-red-500'
                          : 'border-gray-700'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">Passwords don't match</p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || otp.length !== 6 || !newPassword || newPassword !== confirmPassword}
                  className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </motion.button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setError('') }}
                  className="w-full text-gray-500 hover:text-gray-300 text-sm transition"
                >
                  ← Use different email
                </button>
              </motion.form>
            )}

            {/* Step 3 — Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                  <CheckCircle className="mx-auto text-green-500" size={72} />
                </motion.div>
                <div>
                  <p className="text-gray-400 text-sm">
                    Your password has been reset. You can now login with your new password.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/login')}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                >
                  Go to Login
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { authAPI } from '@/lib/api'
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle, Film, Sparkles } from 'lucide-react'

function getPasswordStrength(password: string): { label: string; color: string; score: number } {
  if (password.length === 0) return { label: '', color: '', score: 0 }
  if (password.length < 6) return { label: 'Too short', color: 'bg-red-500', score: 1 }
  if (password.length < 8) return { label: 'Weak', color: 'bg-orange-500', score: 2 }
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { label: 'Fair', color: 'bg-yellow-400', score: 3 }
  return { label: 'Strong', color: 'bg-emerald-500', score: 4 }
}

const inputCls = "w-full pl-11 pr-4 py-3.5 bg-white/3 border border-white/8 rounded-2xl text-white placeholder-gray-700 text-sm focus:outline-none focus:border-red-500/50 focus:bg-white/5 transition-all duration-200"

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
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const strength = getPasswordStrength(newPassword)

  const startCooldown = () => {
    setResendCooldown(30)
    const interval = setInterval(() => {
      setResendCooldown(prev => { if (prev <= 1) { clearInterval(interval); return 0 } return prev - 1 })
    }, 1000)
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      await authAPI.forgotPassword(email)
      setStep('otp'); startCooldown()
    } catch (err: any) {
      const data = err.response?.data
      setError(data?.email?.[0] || data?.non_field_errors?.[0] || 'Failed to send OTP. Please try again.')
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    setError('')
    try { await authAPI.forgotPassword(email); startCooldown() }
    catch { setError('Failed to resend OTP.') }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setError("Passwords don't match."); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    try {
      await authAPI.resetPassword({ email, otp, new_password: newPassword })
      setStep('success')
    } catch (err: any) {
      const data = err.response?.data
      setError(data?.non_field_errors?.[0] || data?.otp?.[0] || 'Invalid OTP or reset failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div animate={{ x: [0, 25, 0], y: [0, -20, 0] }} transition={{ duration: 16, repeat: Infinity }}
          className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-red-900/12 blur-[100px]" />
        <motion.div animate={{ x: [0, -20, 0], y: [0, 25, 0] }} transition={{ duration: 20, repeat: Infinity, delay: 3 }}
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-orange-900/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-red-600 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300" />
              <Film size={18} className="relative text-white" />
            </motion.div>
            <span className="text-xl font-black text-white">Ticket<span className="text-red-500">Flix</span></span>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }} className="relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-600/8 to-transparent blur-xl" />
          <div className="relative bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

            <div className="p-8">
              {/* Header */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-7">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={12} className="text-red-500" />
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                    {step === 'email' ? 'Password Recovery' : step === 'otp' ? 'Verification' : 'Done'}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
                  {step === 'email' ? 'Forgot Password' : step === 'otp' ? 'Reset Password' : 'All Done!'}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {step === 'email' ? "Enter your email and we'll send you an OTP"
                    : step === 'otp' ? `Enter the OTP sent to ${email}`
                    : 'Your password has been reset successfully'}
                </p>
              </motion.div>

              {/* Step indicator */}
              {step !== 'success' && (
                <div className="flex items-center gap-2 mb-7">
                  <div className="h-1 flex-1 rounded-full bg-red-600" />
                  <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step === 'otp' ? 'bg-red-600' : 'bg-white/8'}`} />
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mb-5 p-4 bg-red-500/8 border border-red-500/20 rounded-2xl flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {/* Step 1 — Email */}
                {step === 'email' && (
                  <motion.form key="email" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSendOTP} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Email Address</label>
                      <div className={`relative rounded-2xl border transition-all duration-200 ${focusedField === 'email' ? 'border-red-500/50 bg-white/4 shadow-lg shadow-red-500/10' : 'border-white/6 bg-white/3'}`}>
                        <Mail size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'email' ? 'text-red-400' : 'text-gray-600'}`} />
                        <input type="email" required value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                          onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                          placeholder="your@email.com" disabled={loading}
                          className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none" />
                      </div>
                    </div>

                    <motion.button whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(220,38,38,0.25)' }} whileTap={{ scale: 0.98 }}
                      type="submit" disabled={loading}
                      className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                      {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : 'Send OTP →'}
                    </motion.button>

                    <div className="flex items-center justify-center">
                      <Link href="/login" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-400 text-xs transition">
                        <ArrowLeft size={12} /> Back to Login
                      </Link>
                    </div>
                  </motion.form>
                )}

                {/* Step 2 — OTP + Password */}
                {step === 'otp' && (
                  <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleResetPassword} className="space-y-4">
                    {/* OTP */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2 text-center">6-digit OTP</label>
                      <div className={`relative rounded-2xl border transition-all ${focusedField === 'otp' ? 'border-red-500/50 bg-white/4 shadow-lg shadow-red-500/8' : 'border-white/6 bg-white/3'}`}>
                        <input type="text" maxLength={6} value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                          onFocus={() => setFocusedField('otp')} onBlur={() => setFocusedField(null)}
                          placeholder="• • • • • •" disabled={loading}
                          className="w-full bg-transparent text-white text-center text-3xl tracking-[0.6em] py-5 focus:outline-none font-mono placeholder-gray-800" />
                      </div>
                      <div className="text-center mt-2">
                        <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
                          className="text-red-500 hover:text-red-400 text-xs font-bold disabled:opacity-40 transition-colors">
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">New Password</label>
                      <div className={`relative rounded-2xl border transition-all duration-200 ${focusedField === 'newpw' ? 'border-red-500/50 bg-white/4 shadow-lg shadow-red-500/8' : 'border-white/6 bg-white/3'}`}>
                        <Lock size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'newpw' ? 'text-red-400' : 'text-gray-600'}`} />
                        <input type={showPassword ? 'text' : 'password'} required value={newPassword}
                          onChange={e => { setNewPassword(e.target.value); setError('') }}
                          onFocus={() => setFocusedField('newpw')} onBlur={() => setFocusedField(null)}
                          placeholder="Min. 6 characters" disabled={loading}
                          className="w-full pl-11 pr-12 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {newPassword.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 px-1">
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-white/8'}`} />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-600">{strength.label}</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Confirm New Password</label>
                      <div className={`relative rounded-2xl border transition-all duration-200 ${confirmPassword && newPassword !== confirmPassword ? 'border-red-500/40' : focusedField === 'confpw' ? 'border-red-500/50 bg-white/4 shadow-lg shadow-red-500/8' : 'border-white/6 bg-white/3'}`}>
                        <Lock size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'confpw' ? 'text-red-400' : 'text-gray-600'}`} />
                        <input type={showConfirm ? 'text' : 'password'} required value={confirmPassword}
                          onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                          onFocus={() => setFocusedField('confpw')} onBlur={() => setFocusedField(null)}
                          placeholder="Re-enter new password" disabled={loading}
                          className="w-full pl-11 pr-12 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none" />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
                          {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && <p className="text-red-400 text-xs mt-1 px-1">Passwords don't match</p>}
                    </div>

                    <motion.button whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(220,38,38,0.25)' }} whileTap={{ scale: 0.98 }}
                      type="submit" disabled={loading || otp.length !== 6 || !newPassword || newPassword !== confirmPassword}
                      className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40">
                      {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : 'Reset Password'}
                    </motion.button>

                    <button type="button" onClick={() => { setStep('email'); setOtp(''); setError('') }}
                      className="w-full text-gray-700 hover:text-gray-400 text-xs transition-colors">← Use different email</button>
                  </motion.form>
                )}

                {/* Step 3 — Success */}
                {step === 'success' && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-4">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                      className="w-20 h-20 rounded-full bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center mx-auto">
                      <CheckCircle size={40} className="text-emerald-400" />
                    </motion.div>
                    <div>
                      <h2 className="text-white font-black text-xl mb-2">Password Reset!</h2>
                      <p className="text-gray-600 text-sm">Your password has been reset. You can now login with your new password.</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(220,38,38,0.25)' }} whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/login')}
                      className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-500 transition text-sm">
                      Go to Login →
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
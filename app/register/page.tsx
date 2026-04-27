'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authAPI, profileAPI } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, Phone, User, Building2, Eye, EyeOff, Film,
  ArrowRight, CheckCircle2, Sparkles, MapPin, FileText, Info,
} from 'lucide-react'

type Role = 'Customer' | 'VENUE_OWNER'

function getPasswordStrength(p: string) {
  if (!p) return { score: 0, label: '', color: '' }
  if (p.length < 6) return { score: 1, label: 'Too short', color: 'bg-red-500' }
  if (p.length < 8) return { score: 2, label: 'Weak', color: 'bg-orange-500' }
  if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { score: 3, label: 'Fair', color: 'bg-yellow-400' }
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' }
}

function Field({ label, icon: Icon, error, children, focusedField, name, hint }: any) {
  const isFocused = focusedField === name
  return (
    <div>
      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">{label}</label>
      <div className={`relative rounded-2xl border transition-all duration-200 ${isFocused ? 'border-red-500/50 bg-white/4 shadow-lg shadow-red-500/8' : error ? 'border-red-500/40 bg-white/3' : 'border-white/6 bg-white/3'}`}>
        {Icon && <Icon size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-red-400' : 'text-gray-600'}`} />}
        {children}
      </div>
      {hint && <p className="text-gray-700 text-[10px] mt-1.5 px-1">{hint}</p>}
    </div>
  )
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
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    role: 'Customer' as Role,
    business_name: '',
    business_address: '',
    business_city: '',
    business_state: '',
    gst_number: '',
    pan_number: '',
    website: '',
  })
  const [otp, setOtp] = useState('')
  const strength = getPasswordStrength(form.password)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }
  const focus = (name: string) => setFocusedField(name)
  const blur = () => setFocusedField(null)

  const getValidationError = () => {
    if (!form.name.trim()) return 'Full name is required.'
    if (!form.email.includes('@')) return 'Enter a valid email address.'
    if (form.phone_number.length !== 10 || !/^\d+$/.test(form.phone_number))
      return 'Enter a valid 10-digit phone number.'
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    if (!agreedToTerms) return 'Please agree to the Terms & Privacy Policy.'
    if (form.role === 'VENUE_OWNER') {
      if (!form.business_name.trim()) return 'Business / venue name is required.'
      if (!form.business_address.trim()) return 'Business address is required.'
      if (!form.business_city.trim()) return 'City is required.'
      if (!form.business_state.trim()) return 'State is required.'
    }
    return ''
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const ve = getValidationError()
    if (ve) { setError(ve); return }
    setLoading(true); setError('')
    try {
      await authAPI.register({
        name: form.name,
        email: form.email,
        phone_number: form.phone_number,
        password: form.password,
        role: form.role,
        ...(form.role === 'VENUE_OWNER' && {
          business_name: form.business_name,
          business_address: form.business_address,
          business_city: form.business_city,
          business_state: form.business_state,
          gst_number: form.gst_number,
          pan_number: form.pan_number,
          website: form.website,
        }),
      })
      setStep('otp')
      startResendCooldown()
    } catch (err: any) {
      const data = err?.response?.data
      setError(data ? Object.values(data).flat().join(' ') : 'Something went wrong.')
    } finally { setLoading(false) }
  }

  const startResendCooldown = () => {
    setResendCooldown(30)
    const iv = setInterval(() => setResendCooldown(p => {
      if (p <= 1) { clearInterval(iv); return 0 }
      return p - 1
    }), 1000)
  }

  const handleResendOTP = async () => {
    setResending(true); setError(''); setSuccess('')
    try {
      await profileAPI.resendOTP(form.email)
      setSuccess('OTP resent! Check your email.')
      startResendCooldown()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to resend OTP.')
    } finally { setResending(false) }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      // Step 1: verify OTP (marks email as verified on backend)
      await authAPI.verifyOTP({ email: form.email, otp })

      // Step 2: log in to get a session/cookies so support chat works
      // For venue owners this sets cookies but middleware will enforce
      // the pending-approval redirect for any protected route they visit.
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      const loginData = await loginRes.json()

      if (form.role === 'VENUE_OWNER') {
        // Login may fail (unlikely) but we still redirect to pending-approval.
        // If login succeeded, cookies are set and support chat will work.
        // The middleware blocks venue-dashboard until is_approved = true.
        if (!loginRes.ok) {
          console.warn('[register] Login after OTP failed — support chat will require manual sign-in')
        } else {
          window.dispatchEvent(new Event('authChange'))
        }
        router.push('/pending-approval')
        return
      }

      // Customer — login must succeed
      if (!loginRes.ok) { setError(loginData.error || 'Login failed'); return }
      window.dispatchEvent(new Event('authChange'))
      router.push('/')
    } catch (err: any) {
      const data = err?.response?.data
      setError(data?.non_field_errors?.[0] || data?.otp?.[0] || 'Invalid OTP.')
    } finally { setLoading(false) }
  }

  const isVenueOwner = form.role === 'VENUE_OWNER'

  return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div animate={{ x: [0, 25, 0], y: [0, -15, 0] }} transition={{ duration: 18, repeat: Infinity }}
          className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-red-900/12 blur-[100px]" />
        <motion.div animate={{ x: [0, -20, 0], y: [0, 25, 0] }} transition={{ duration: 22, repeat: Infinity, delay: 4 }}
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-900/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-red-600 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300" />
              <Film size={18} className="relative text-white" />
            </motion.div>
            <span className="text-xl font-black text-white">Ticket<span className="text-red-500">Flix</span></span>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }} className="relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-600/8 to-transparent blur-xl" />

          <div className="relative bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

            <div className="p-8">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={12} className="text-red-500" />
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                    {step === 'details' ? 'New account' : 'Verify email'}
                  </span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
                  {step === 'details' ? 'Join TicketFlix' : 'Check your inbox'}
                </h1>
                {step === 'otp' && (
                  <p className="text-gray-600 text-xs mt-1">
                    OTP sent to <span className="text-gray-400">{form.email}</span>
                  </p>
                )}
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-7">
                <div className="h-1 flex-1 rounded-full bg-red-600" />
                <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step === 'otp' ? 'bg-red-600' : 'bg-white/8'}`} />
              </div>

              {/* Alerts */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3.5 bg-red-500/8 border border-red-500/20 rounded-2xl flex gap-2.5">
                    <div className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <p className="text-red-300 text-xs leading-relaxed">{error}</p>
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3.5 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <p className="text-emerald-300 text-xs">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {/* ── DETAILS STEP ── */}
                {step === 'details' && (
                  <motion.form key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }} onSubmit={handleRegister} className="space-y-4">

                    {/* Role Selector */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">I am a...</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['Customer', 'VENUE_OWNER'] as Role[]).map((role) => (
                          <motion.button key={role} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => setForm({ ...form, role })}
                            className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 overflow-hidden ${form.role === role ? 'border-red-500/60 bg-red-500/8' : 'border-white/6 bg-white/2 hover:border-white/12'}`}>
                            {form.role === role && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
                            )}
                            {role === 'Customer'
                              ? <User size={22} className={form.role === role ? 'text-red-400' : 'text-gray-600'} />
                              : <Building2 size={22} className={form.role === role ? 'text-red-400' : 'text-gray-600'} />}
                            <span className={`text-xs font-bold ${form.role === role ? 'text-white' : 'text-gray-500'}`}>
                              {role === 'Customer' ? 'Customer' : 'Venue Owner'}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Venue owner info banner */}
                    <AnimatePresence>
                      {isVenueOwner && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="p-3.5 bg-amber-500/6 border border-amber-500/20 rounded-2xl flex gap-2.5">
                          <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-amber-300/80 text-xs leading-relaxed">
                            Venue owner accounts require <strong className="text-amber-300">admin approval</strong> before you can list events. You'll be notified via email once approved.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Personal Info */}
                    <Field label="Full Name" icon={User} name="name" focusedField={focusedField}>
                      <input name="name" type="text" required value={form.name} onChange={handleChange}
                        onFocus={() => focus('name')} onBlur={blur} placeholder="John Doe" disabled={loading}
                        className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none" />
                    </Field>

                    <Field label="Email" icon={Mail} name="email" focusedField={focusedField}>
                      <input name="email" type="email" required value={form.email} onChange={handleChange}
                        onFocus={() => focus('email')} onBlur={blur} placeholder="john@example.com" disabled={loading}
                        className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none" />
                    </Field>

                    {/* Phone */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Phone</label>
                      <div className={`flex rounded-2xl border overflow-hidden transition-all duration-200 ${focusedField === 'phone' ? 'border-red-500/50 shadow-lg shadow-red-500/8' : 'border-white/6'}`}>
                        <span className="bg-white/3 text-gray-500 px-3 py-3.5 text-sm font-medium border-r border-white/6 flex items-center">+91</span>
                        <div className="relative flex-1 bg-white/3">
                          <Phone size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'phone' ? 'text-red-400' : 'text-gray-600'}`} />
                          <input name="phone_number" type="tel" required maxLength={10} value={form.phone_number}
                            onChange={handleChange} onFocus={() => focus('phone')} onBlur={blur}
                            placeholder="9876543210" disabled={loading}
                            className="w-full pl-10 pr-4 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none" />
                        </div>
                      </div>
                      <p className="text-gray-700 text-[10px] mt-1.5 px-1">Each phone number can only be used for one account.</p>
                    </div>

                    <Field label="Password" icon={Lock} name="password" focusedField={focusedField}>
                      <input name="password" type={showPassword ? 'text' : 'password'} required value={form.password}
                        onChange={handleChange} onFocus={() => focus('password')} onBlur={blur}
                        placeholder="Min. 6 characters" disabled={loading}
                        className="w-full pl-11 pr-12 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </Field>

                    {form.password && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mt-2 px-1">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-white/8'}`} />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-600">{strength.label}</span>
                      </motion.div>
                    )}

                    <Field label="Confirm Password" icon={Lock} name="confirm" focusedField={focusedField}>
                      <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} required
                        value={form.confirmPassword} onChange={handleChange}
                        onFocus={() => focus('confirm')} onBlur={blur}
                        placeholder="Re-enter password" disabled={loading}
                        className="w-full pl-11 pr-12 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none" />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </Field>

                    {form.confirmPassword && form.password !== form.confirmPassword && (
                      <p className="text-red-400 text-xs -mt-2 px-1">Passwords don't match</p>
                    )}

                    {/* Venue Owner Extra Fields */}
                    <AnimatePresence>
                      {isVenueOwner && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="pt-2 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-white/6" />
                              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Business Details</span>
                              <div className="flex-1 h-px bg-white/6" />
                            </div>

                            <Field label="Business / Venue Name *" icon={Building2} name="business_name" focusedField={focusedField}
                              hint="The official name of your theater or event venue">
                              <input name="business_name" type="text" required={isVenueOwner} value={form.business_name}
                                onChange={handleChange} onFocus={() => focus('business_name')} onBlur={blur}
                                placeholder="e.g. INOX Metro Junction" disabled={loading}
                                className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none" />
                            </Field>

                            <Field label="Business Address *" icon={MapPin} name="business_address" focusedField={focusedField}>
                              <input name="business_address" type="text" required={isVenueOwner} value={form.business_address}
                                onChange={handleChange} onFocus={() => focus('business_address')} onBlur={blur}
                                placeholder="Full street address" disabled={loading}
                                className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none" />
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                              <Field label="City *" icon={MapPin} name="business_city" focusedField={focusedField}>
                                <input name="business_city" type="text" required={isVenueOwner} value={form.business_city}
                                  onChange={handleChange} onFocus={() => focus('business_city')} onBlur={blur}
                                  placeholder="Mumbai" disabled={loading}
                                  className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none" />
                              </Field>
                              <Field label="State *" icon={MapPin} name="business_state" focusedField={focusedField}>
                                <input name="business_state" type="text" required={isVenueOwner} value={form.business_state}
                                  onChange={handleChange} onFocus={() => focus('business_state')} onBlur={blur}
                                  placeholder="Maharashtra" disabled={loading}
                                  className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none" />
                              </Field>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-white/6" />
                              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Optional</span>
                              <div className="flex-1 h-px bg-white/6" />
                            </div>

                            <Field label="GST Number" icon={FileText} name="gst_number" focusedField={focusedField}
                              hint="15-digit GSTIN if your business is GST registered">
                              <input name="gst_number" type="text" value={form.gst_number}
                                onChange={handleChange} onFocus={() => focus('gst_number')} onBlur={blur}
                                placeholder="22AAAAA0000A1Z5" disabled={loading} maxLength={15}
                                className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none" />
                            </Field>

                            <Field label="PAN Number" icon={FileText} name="pan_number" focusedField={focusedField}>
                              <input name="pan_number" type="text" value={form.pan_number}
                                onChange={handleChange} onFocus={() => focus('pan_number')} onBlur={blur}
                                placeholder="ABCDE1234F" disabled={loading} maxLength={10}
                                className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none uppercase" />
                            </Field>

                            <Field label="Website" icon={FileText} name="website" focusedField={focusedField}>
                              <input name="website" type="url" value={form.website}
                                onChange={handleChange} onFocus={() => focus('website')} onBlur={blur}
                                placeholder="https://yourvenue.com" disabled={loading}
                                className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none" />
                            </Field>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Terms */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all ${agreedToTerms ? 'bg-red-600 border-red-600' : 'border-white/20 group-hover:border-white/40'}`}
                        onClick={() => setAgreedToTerms(!agreedToTerms)}>
                        {agreedToTerms && (
                          <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="10" height="10" viewBox="0 0 10 10">
                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                          </motion.svg>
                        )}
                      </div>
                      <span className="text-gray-600 text-xs leading-relaxed">
                        I agree to the{' '}
                        <Link href="/terms" className="text-red-500 hover:text-red-400">Terms & Conditions</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-red-500 hover:text-red-400">Privacy Policy</Link>
                        {isVenueOwner && (
                          <span className="block mt-1 text-gray-700">
                            As a venue owner, I agree to be responsible for all events I list and comply with applicable laws.
                          </span>
                        )}
                      </span>
                    </label>

                    <motion.button whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(220,38,38,0.25)' }}
                      whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                      className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                      {loading
                        ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        : <><span>Send OTP</span><ArrowRight size={14} /></>
                      }
                    </motion.button>

                    <p className="text-center text-gray-600 text-xs">
                      Already have an account?{' '}
                      <Link href="/login" className="text-red-500 hover:text-red-400 font-bold">Sign in</Link>
                    </p>
                  </motion.form>
                )}

                {/* ── OTP STEP ── */}
                {step === 'otp' && (
                  <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }} onSubmit={handleVerifyOTP} className="space-y-5">

                    {isVenueOwner && (
                      <div className="p-3.5 bg-amber-500/6 border border-amber-500/20 rounded-2xl flex gap-2.5">
                        <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-amber-300/80 text-xs leading-relaxed">
                          After verifying your email, your account will be reviewed by our team. You'll receive an email once approved.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 text-center">6-digit OTP</label>
                      <div className={`relative rounded-2xl border transition-all ${focusedField === 'otp' ? 'border-red-500/50 bg-white/4 shadow-lg shadow-red-500/8' : 'border-white/6 bg-white/3'}`}>
                        <input type="text" maxLength={6} value={otp}
                          onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                          onFocus={() => focus('otp')} onBlur={blur} placeholder="• • • • • •" disabled={loading}
                          className="w-full bg-transparent text-white text-center text-3xl tracking-[0.6em] py-5 focus:outline-none font-mono placeholder-gray-800" />
                      </div>
                      <p className="text-center text-gray-700 text-[10px] mt-2">OTP expires in 5 minutes · Check spam folder</p>
                    </div>

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40">
                      {loading
                        ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        : <><CheckCircle2 size={15} /><span>Verify & Create Account</span></>
                      }
                    </motion.button>

                    <div className="text-center">
                      <p className="text-gray-700 text-xs mb-2">Didn't receive it?</p>
                      <button type="button" onClick={handleResendOTP} disabled={resending || resendCooldown > 0}
                        className="text-red-500 hover:text-red-400 text-sm font-bold disabled:opacity-40 transition-colors">
                        {resending ? 'Resending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                      </button>
                    </div>

                    <button type="button"
                      onClick={() => { setStep('details'); setOtp(''); setError(''); setSuccess('') }}
                      className="w-full text-gray-700 hover:text-gray-400 text-xs transition-colors">
                      ← Back to details
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
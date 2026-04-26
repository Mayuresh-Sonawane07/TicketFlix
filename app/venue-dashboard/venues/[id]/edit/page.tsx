'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { theaterAPI } from '@/lib/api'
import { ArrowLeft, Sparkles, Building2, MapPin, Phone, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

const inputCls = "w-full px-4 py-3 bg-white/3 border border-white/8 rounded-2xl text-white placeholder-gray-700 text-sm focus:outline-none focus:border-red-500/50 transition"
const labelCls = "block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2"

export default function EditVenuePage() {
  const router = useRouter()
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone_number: '',
    description: '',
  })

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) { router.push('/login'); return }
      const user = await res.json()
      if (user.role !== 'VENUE_OWNER') { router.push('/'); return }
      fetchVenue()
    })()
  }, [])

  const fetchVenue = async () => {
    try {
      const res = await theaterAPI.getAll()
      const all = Array.isArray(res.data) ? res.data : (res.data as any).results ?? []
      const venue = all.find((v: any) => v.id === Number(id))
      if (!venue) { router.push('/venue-dashboard/venues'); return }
      setForm({
        name: venue.name ?? '',
        address: venue.address ?? '',
        city: venue.city ?? '',
        state: venue.state ?? '',
        pincode: venue.pincode ?? '',
        phone_number: venue.phone_number ?? '',
        description: venue.description ?? '',
      })
    } catch {
      setError('Failed to load venue')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await theaterAPI.update(Number(id), form)
      setSuccess(true)
      setTimeout(() => router.push('/venue-dashboard/venues'), 1200)
    } catch (err: any) {
      const data = err?.response?.data
      if (data) {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')
        setError(msgs)
      } else {
        setError('Failed to update venue. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { name: 'name', label: 'Venue Name *', placeholder: 'e.g. INOX Metro Junction', icon: <Building2 size={14} />, required: true },
    { name: 'address', label: 'Street Address *', placeholder: 'Full address', icon: <MapPin size={14} />, required: true },
    { name: 'city', label: 'City *', placeholder: 'e.g. Mumbai', icon: <MapPin size={14} />, required: true },
    { name: 'state', label: 'State *', placeholder: 'e.g. Maharashtra', icon: <MapPin size={14} />, required: true },
    { name: 'pincode', label: 'Pincode *', placeholder: 'e.g. 400001', icon: <MapPin size={14} />, required: true },
    { name: 'phone_number', label: 'Phone Number', placeholder: 'e.g. 9876543210', icon: <Phone size={14} />, required: false },
  ]

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-7 h-7 border-2 border-red-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div animate={{ x: [0, 20, 0], y: [0, -15, 0] }} transition={{ duration: 18, repeat: Infinity }}
          className="absolute top-0 left-1/4 w-[450px] h-[450px] rounded-full bg-cyan-900/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-10">
          <Link href="/venue-dashboard/venues">
            <motion.div whileHover={{ scale: 1.1, x: -2 }}
              className="w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-gray-600 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft size={16} />
            </motion.div>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={12} className="text-red-500" />
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Edit Venue</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
              {form.name || 'Edit Venue'}
            </h1>
            <p className="text-gray-600 text-sm mt-0.5">Update your venue details</p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="relative bg-white/[0.02] border border-white/8 rounded-2xl p-8">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent rounded-t-2xl" />

          {/* Status messages */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-500/8 border border-red-500/20 rounded-2xl flex items-start gap-3">
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <p className="text-emerald-300 text-sm font-semibold">Venue updated! Redirecting...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Main fields grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {fields.map(({ name, label, placeholder, required }, i) => (
                <motion.div key={name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className={name === 'name' || name === 'address' ? 'sm:col-span-2' : ''}>
                  <label className={labelCls}>{label}</label>
                  <input
                    name={name}
                    type={name === 'pincode' || name === 'phone_number' ? 'text' : 'text'}
                    required={required}
                    value={form[name as keyof typeof form]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={inputCls}
                  />
                </motion.div>
              ))}
            </div>

            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><FileText size={11} /> Description (optional)</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Brief description of your venue..."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </motion.div>

            {/* Actions */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              className="flex gap-3 pt-2">
              <Link href="/venue-dashboard/venues"
                className="flex-1 py-3 text-center border border-white/8 text-gray-500 rounded-xl hover:border-white/15 hover:text-gray-300 transition text-sm font-semibold">
                Cancel
              </Link>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={saving || success}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 disabled:opacity-50 transition text-sm shadow-lg shadow-red-600/20">
                {saving ? 'Saving...' : success ? 'Saved ✓' : 'Save Changes'}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
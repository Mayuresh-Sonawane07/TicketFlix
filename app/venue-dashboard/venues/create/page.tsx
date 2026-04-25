'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { theaterAPI } from '@/lib/api'
import { ArrowLeft, Sparkles, Building2, MapPin, Phone, Link2 } from 'lucide-react'

const inputCls = "w-full px-4 py-3.5 bg-white/3 border border-white/8 rounded-2xl text-white placeholder-gray-700 text-sm focus:outline-none focus:border-red-500/50 focus:bg-white/4 transition-all duration-200"

export default function CreateVenuePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', pincode: '', phone_number: '', google_maps_link: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try { const res = await theaterAPI.create(form); router.push(`/venue-dashboard/venues/${res.data.id}/screens`) }
    catch (err: any) { const data = err.response?.data; setError(data ? Object.values(data).flat().join(' ') : 'Failed to create venue.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#080808] overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div animate={{ x: [0, 20, 0], y: [0, -15, 0] }} transition={{ duration: 18, repeat: Infinity }}
          className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-900/10 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.013]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/venue-dashboard/venues">
              <motion.div whileHover={{ scale: 1.1, x: -2 }} className="w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-gray-600 hover:text-white transition-colors cursor-pointer">
                <ArrowLeft size={16} />
              </motion.div>
            </Link>
            <div className="flex items-center gap-2"><Sparkles size={12} className="text-red-500" /><span className="text-[10px] font-black text-red-400 uppercase tracking-widest">New Venue</span></div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Add Venue</h1>
          <p className="text-gray-600 text-sm mt-1">Fill in your venue details</p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-500/8 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative bg-white/[0.02] border border-white/6 rounded-2xl overflow-hidden p-6 space-y-5">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

          <div>
            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Venue Name *</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
              <input name="name" type="text" required value={form.name} onChange={handleChange} placeholder="e.g. Grand Cinema Hall" className={inputCls + ' pl-10'} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Address *</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-4 top-4 text-gray-600" />
              <textarea name="address" required value={form.address} onChange={handleChange} rows={2} placeholder="Street address, landmark..." className={inputCls + ' pl-10 resize-none'} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">City *</label>
              <input name="city" type="text" required value={form.city} onChange={handleChange} placeholder="e.g. Mumbai" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">State *</label>
              <input name="state" type="text" required value={form.state} onChange={handleChange} placeholder="e.g. Maharashtra" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Pincode *</label>
              <input name="pincode" type="text" required maxLength={6} value={form.pincode} onChange={handleChange} placeholder="e.g. 421301" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Phone Number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input name="phone_number" type="tel" value={form.phone_number} onChange={handleChange} placeholder="9876543210" className={inputCls + ' pl-10'} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Google Maps Link <span className="text-gray-700 normal-case font-normal">(optional)</span></label>
            <div className="relative">
              <Link2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
              <input name="google_maps_link" type="url" value={form.google_maps_link} onChange={handleChange} placeholder="https://maps.google.com/..." className={inputCls + ' pl-10'} />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <Link href="/venue-dashboard/venues" className="flex-1 py-4 border border-white/8 text-gray-500 rounded-2xl hover:border-white/15 hover:text-gray-300 transition-all text-center text-sm font-semibold">Cancel</Link>
            <motion.button whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(220,38,38,0.25)' }} whileTap={{ scale: 0.98 }}
              type="button" onClick={handleSubmit} disabled={loading}
              className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : 'Save & Add Screens →'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
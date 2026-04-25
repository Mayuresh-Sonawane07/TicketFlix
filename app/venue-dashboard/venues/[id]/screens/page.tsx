'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { theaterAPI, screenAPI, Theater, Screen } from '@/lib/api'
import { Plus, Trash2, ArrowLeft, Monitor, Sparkles } from 'lucide-react'

const inputCls = "w-full px-4 py-3 bg-white/3 border border-white/8 rounded-2xl text-white placeholder-gray-700 text-sm focus:outline-none focus:border-red-500/50 transition"

export default function ScreensPage() {
  const router = useRouter()
  const { id } = useParams()
  const [venue, setVenue] = useState<Theater | null>(null)
  const [screens, setScreens] = useState<Screen[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ screen_number: '', silver_count: '', silver_price: '', gold_count: '', gold_price: '', platinum_count: '', platinum_price: '' })

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    try {
      const [venueRes, screensRes] = await Promise.all([theaterAPI.getAll(), screenAPI.getByTheater(Number(id))])
      const allVenues = Array.isArray(venueRes.data) ? venueRes.data : (venueRes.data as any).results ?? []
      setVenue(allVenues.find((v: Theater) => v.id === Number(id)) || null)
      setScreens(Array.isArray(screensRes.data) ? screensRes.data : (screensRes.data as any).results ?? [])
    } catch { setError('Failed to load data') } finally { setLoading(false) }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setForm({ ...form, [e.target.name]: e.target.value }) }
  const totalSeats = () => (Number(form.silver_count) || 0) + (Number(form.gold_count) || 0) + (Number(form.platinum_count) || 0)

  const handleAddScreen = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await screenAPI.create({ theater: Number(id), screen_number: Number(form.screen_number), total_seats: totalSeats(), silver_count: Number(form.silver_count), silver_price: Number(form.silver_price), gold_count: Number(form.gold_count), gold_price: Number(form.gold_price), platinum_count: Number(form.platinum_count), platinum_price: Number(form.platinum_price) })
      setForm({ screen_number: '', silver_count: '', silver_price: '', gold_count: '', gold_price: '', platinum_count: '', platinum_price: '' })
      setShowForm(false); fetchData()
    } catch (err: any) { setError(err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Failed to add screen.') } finally { setSaving(false) }
  }

  const handleDelete = async (screenId: number) => {
    if (!confirm('Delete this screen? All seats will be removed.')) return
    try { await screenAPI.delete(screenId); setScreens(screens.filter(s => s.id !== screenId)) }
    catch { alert('Failed to delete screen') }
  }

  const TIERS = [
    { tier: 'Silver', countKey: 'silver_count', priceKey: 'silver_price', color: 'text-slate-300', accent: 'border-slate-500/30 bg-slate-500/5' },
    { tier: 'Gold', countKey: 'gold_count', priceKey: 'gold_price', color: 'text-yellow-400', accent: 'border-yellow-500/30 bg-yellow-500/5' },
    { tier: 'Platinum', countKey: 'platinum_count', priceKey: 'platinum_price', color: 'text-violet-400', accent: 'border-violet-500/30 bg-violet-500/5' },
  ]

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/3 w-[400px] h-[400px] rounded-full bg-violet-900/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link href="/venue-dashboard/venues">
              <motion.div whileHover={{ scale: 1.1, x: -2 }} className="w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-gray-600 hover:text-white transition-colors cursor-pointer">
                <ArrowLeft size={16} />
              </motion.div>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1"><Sparkles size={12} className="text-red-500" /><span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Screens</span></div>
              <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>{venue?.name || 'Venue'}</h1>
              <p className="text-gray-600 text-sm mt-0.5">Manage screens & seat configuration</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition font-bold text-sm shadow-lg shadow-red-600/20">
            <Plus size={15} /> Add Screen
          </motion.button>
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

        {/* Add Screen Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
              className="mb-8 overflow-hidden">
              <div className="relative bg-white/[0.02] border border-white/8 rounded-2xl p-6">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent rounded-t-2xl" />
                <h2 className="text-white font-black text-lg mb-6">New Screen Configuration</h2>
                <form onSubmit={handleAddScreen} className="space-y-5">
                  <div className="w-48">
                    <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Screen Number *</label>
                    <input name="screen_number" type="number" required min={1} value={form.screen_number} onChange={handleChange} placeholder="e.g. 1" className={inputCls} />
                  </div>
                  {TIERS.map(({ tier, countKey, priceKey, color, accent }) => (
                    <div key={tier} className={`border rounded-2xl p-5 ${accent}`}>
                      <h3 className={`font-black mb-4 ${color}`}>{tier} Tier</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2">Number of Seats</label>
                          <input name={countKey} type="number" min={0} value={form[countKey as keyof typeof form]} onChange={handleChange} placeholder="e.g. 50" className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2">Price per Seat (₹)</label>
                          <input name={priceKey} type="number" min={0} value={form[priceKey as keyof typeof form]} onChange={handleChange} placeholder="e.g. 150" className={inputCls} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="bg-white/3 border border-white/6 rounded-xl px-5 py-3.5 flex justify-between items-center">
                    <span className="text-gray-500 text-sm font-semibold">Total Seats</span>
                    <span className="text-white font-black text-xl">{totalSeats()}</span>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-white/8 text-gray-500 rounded-xl hover:border-white/15 transition text-sm font-semibold">Cancel</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={saving}
                      className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 disabled:opacity-50 transition text-sm">
                      {saving ? 'Adding...' : 'Add Screen & Generate Seats'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} className="h-28 rounded-2xl bg-white/3" />
            ))}
          </div>
        )}

        {!loading && screens.length === 0 && !showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 border border-dashed border-white/6 rounded-3xl">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Monitor size={48} className="mx-auto text-gray-800 mb-4" />
            </motion.div>
            <p className="text-white text-xl font-black mb-2">No screens yet</p>
            <p className="text-gray-700 text-sm mb-8">Add your first screen to configure seats</p>
            <button onClick={() => setShowForm(true)} className="px-8 py-3.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition font-bold text-sm">Add Screen →</button>
          </motion.div>
        )}

        <div className="space-y-4">
          {screens.map((screen, i) => (
            <motion.div key={screen.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white/[0.02] border border-white/6 rounded-2xl p-6 hover:border-white/10 transition-all duration-300">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Monitor size={17} className="text-violet-400" />
                  </div>
                  <h3 className="text-white font-black text-lg">Screen {screen.screen_number}</h3>
                </div>
                <button onClick={() => handleDelete(screen.id)}
                  className="w-9 h-9 rounded-xl border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500/8 transition">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { tier: 'Silver', count: screen.silver_count, price: screen.silver_price, color: 'border-slate-500/30 text-slate-300', bg: 'bg-slate-500/5' },
                  { tier: 'Gold', count: screen.gold_count, price: screen.gold_price, color: 'border-yellow-500/30 text-yellow-400', bg: 'bg-yellow-500/5' },
                  { tier: 'Platinum', count: screen.platinum_count, price: screen.platinum_price, color: 'border-violet-500/30 text-violet-400', bg: 'bg-violet-500/5' },
                ].map(({ tier, count, price, color, bg }) => (
                  <div key={tier} className={`border ${color} ${bg} rounded-xl p-4 text-center`}>
                    <p className="font-black text-sm mb-1">{tier}</p>
                    <p className="text-white text-xl font-black">{count}</p>
                    <p className="text-xs opacity-60 mt-0.5">seats · ₹{price}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-sm">
                <span className="text-gray-600">Total Seats</span>
                <span className="text-white font-black">{screen.total_seats}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {screens.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-center">
            <Link href="/venue-dashboard/events/create"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition shadow-lg shadow-red-600/20">
              Create Event at This Venue →
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
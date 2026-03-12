'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { theaterAPI, screenAPI, Theater, Screen } from '@/lib/api'
import { Plus, Trash2, ArrowLeft, Monitor } from 'lucide-react'

export default function ScreensPage() {
  const router = useRouter()
  const { id } = useParams()
  const [venue, setVenue] = useState<Theater | null>(null)
  const [screens, setScreens] = useState<Screen[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    screen_number: '',
    silver_count: '',
    silver_price: '',
    gold_count: '',
    gold_price: '',
    platinum_count: '',
    platinum_price: '',
  })

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [venueRes, screensRes] = await Promise.all([
        theaterAPI.getAll(),
        screenAPI.getByTheater(Number(id)),
      ])
      const allVenues = Array.isArray(venueRes.data) ? venueRes.data : (venueRes.data as any).results ?? []
      setVenue(allVenues.find((v: Theater) => v.id === Number(id)) || null)
      setScreens(Array.isArray(screensRes.data) ? screensRes.data : (screensRes.data as any).results ?? [])
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const totalSeats = () =>
    (Number(form.silver_count) || 0) +
    (Number(form.gold_count) || 0) +
    (Number(form.platinum_count) || 0)

  const handleAddScreen = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await screenAPI.create({
        theater: Number(id),
        screen_number: Number(form.screen_number),
        total_seats: totalSeats(),
        silver_count: Number(form.silver_count),
        silver_price: Number(form.silver_price),
        gold_count: Number(form.gold_count),
        gold_price: Number(form.gold_price),
        platinum_count: Number(form.platinum_count),
        platinum_price: Number(form.platinum_price),
      })
      setForm({
        screen_number: '',
        silver_count: '', silver_price: '',
        gold_count: '', gold_price: '',
        platinum_count: '', platinum_price: '',
      })
      setShowForm(false)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Failed to add screen.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (screenId: number) => {
    if (!confirm('Delete this screen? All seats will be removed.')) return
    try {
      await screenAPI.delete(screenId)
      setScreens(screens.filter(s => s.id !== screenId))
    } catch {
      alert('Failed to delete screen')
    }
  }

  const inputClass = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 text-sm transition"

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/venue-dashboard/venues" className="text-gray-400 hover:text-white transition">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">{venue?.name || 'Venue'}</h1>
              <p className="text-gray-400 text-sm mt-1">Manage screens & seat configuration</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
          >
            <Plus size={18} />
            Add Screen
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-600/10 border border-red-600/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Add Screen Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <h2 className="text-white font-bold text-lg mb-6">New Screen Configuration</h2>
            <form onSubmit={handleAddScreen} className="space-y-6">

              <div className="w-48">
                <label className="block text-sm font-medium text-gray-300 mb-2">Screen Number *</label>
                <input name="screen_number" type="number" required min={1}
                  value={form.screen_number} onChange={handleChange}
                  placeholder="e.g. 1" className={inputClass} />
              </div>

              {/* Tier config */}
              {[
                { tier: 'Silver', countKey: 'silver_count', priceKey: 'silver_price', color: 'text-gray-300' },
                { tier: 'Gold', countKey: 'gold_count', priceKey: 'gold_price', color: 'text-yellow-400' },
                { tier: 'Platinum', countKey: 'platinum_count', priceKey: 'platinum_price', color: 'text-purple-400' },
              ].map(({ tier, countKey, priceKey, color }) => (
                <div key={tier} className="bg-gray-800 rounded-xl p-4">
                  <h3 className={`font-semibold mb-3 ${color}`}>{tier} Tier</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Number of Seats</label>
                      <input
                        name={countKey} type="number" min={0}
                        value={form[countKey as keyof typeof form]}
                        onChange={handleChange}
                        placeholder="e.g. 50" className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Price per Seat (₹)</label>
                      <input
                        name={priceKey} type="number" min={0}
                        value={form[priceKey as keyof typeof form]}
                        onChange={handleChange}
                        placeholder="e.g. 150" className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Total preview */}
              <div className="bg-gray-800 rounded-lg px-4 py-3 flex justify-between items-center">
                <span className="text-gray-400 text-sm">Total Seats</span>
                <span className="text-white font-bold text-lg">{totalSeats()}</span>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-gray-700 text-gray-300 rounded-lg hover:border-gray-500 transition text-sm">
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={saving}
                  className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition text-sm"
                >
                  {saving ? 'Adding...' : 'Add Screen & Generate Seats'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Screens List */}
        {loading && <div className="text-center text-gray-400 py-16">Loading screens...</div>}

        {!loading && screens.length === 0 && !showForm && (
          <div className="text-center py-24 border border-dashed border-gray-800 rounded-xl">
            <Monitor className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400 text-lg mb-2">No screens yet</p>
            <p className="text-gray-500 text-sm mb-6">Add your first screen to configure seats</p>
            <button onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold">
              Add Screen →
            </button>
          </div>
        )}

        <div className="space-y-4">
          {screens.map((screen) => (
            <motion.div
              key={screen.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Screen {screen.screen_number}</h3>
                <button
                  onClick={() => handleDelete(screen.id)}
                  className="p-2 border border-red-600/30 text-red-500 rounded-lg hover:bg-red-600/10 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { tier: 'Silver', count: screen.silver_count, price: screen.silver_price, color: 'border-gray-500 text-gray-300' },
                  { tier: 'Gold', count: screen.gold_count, price: screen.gold_price, color: 'border-yellow-500 text-yellow-400' },
                  { tier: 'Platinum', count: screen.platinum_count, price: screen.platinum_price, color: 'border-purple-500 text-purple-400' },
                ].map(({ tier, count, price, color }) => (
                  <div key={tier} className={`border ${color} rounded-lg p-3 text-center`}>
                    <p className="font-semibold text-sm mb-1">{tier}</p>
                    <p className="text-white text-lg font-bold">{count} seats</p>
                    <p className="text-xs opacity-70">₹{price} each</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-sm">
                <span className="text-gray-400">Total Seats</span>
                <span className="text-white font-semibold">{screen.total_seats}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {screens.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/venue-dashboard/events/create"
              className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition inline-block"
            >
              Create Event at This Venue →
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}